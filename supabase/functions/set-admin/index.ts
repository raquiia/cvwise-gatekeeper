
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Définition des headers CORS pour permettre les requêtes depuis le frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Création du client Supabase avec le rôle de service
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

// Les emails autorisés à devenir administrateurs par défaut
const DEFAULT_ADMIN_EMAILS = ['guillaume.aubry@migso-pcubed.com'];

Deno.serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Vérification de l'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé - token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupération de l'utilisateur à partir du token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérification si l'email de l'utilisateur est dans la liste des administrateurs par défaut
    if (!DEFAULT_ADMIN_EMAILS.includes(user.email ?? '')) {
      return new Response(
        JSON.stringify({ error: 'Vous n\'avez pas les privilèges requis pour devenir administrateur' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mise à jour du profil de l'utilisateur pour définir is_admin à true
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Erreur lors de la mise à jour du profil: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Vous êtes maintenant administrateur' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Erreur serveur: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
