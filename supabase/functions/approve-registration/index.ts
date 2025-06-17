
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé - token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'utilisateur est admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Accès non autorisé - privilèges admin requis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { registrationId, action, rejectionReason } = await req.json()

    if (!registrationId || !action || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Paramètres invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer la demande d'inscription
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', registrationId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !registration) {
      return new Response(
        JSON.stringify({ error: 'Demande d\'inscription non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'approve') {
      // Créer le compte utilisateur
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: registration.email,
        password: registration.password_hash,
        email_confirm: true,
        user_metadata: {
          first_name: registration.first_name,
          last_name: registration.last_name,
          company: registration.company,
        }
      })

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabaseAdmin
        .from('pending_registrations')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', registrationId)

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError)
      }

      return new Response(
        JSON.stringify({ 
          message: 'Inscription approuvée avec succès',
          userId: newUser?.user?.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Rejeter la demande
      const { error: updateError } = await supabaseAdmin
        .from('pending_registrations')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'Aucune raison spécifiée',
        })
        .eq('id', registrationId)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Inscription rejetée avec succès' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
