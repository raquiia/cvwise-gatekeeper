
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
    console.log('Confirming Claire Laurent user...')
    
    // Trouver l'utilisateur Claire Laurent par email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching users:', authError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des utilisateurs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claireUser = authUsers.users.find(user => user.email === 'claire.l1607@gmail.com')
    
    if (!claireUser) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur Claire Laurent non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found Claire Laurent user:', claireUser.id)
    console.log('Current email confirmation status:', claireUser.email_confirmed_at)

    let updateData: any = {
      email_confirm: true
    }

    // Si l'email n'est pas confirmé, le confirmer
    if (!claireUser.email_confirmed_at) {
      console.log('Email not confirmed, confirming now...')
    }

    // Mettre à jour l'utilisateur pour confirmer son email
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      claireUser.id,
      updateData
    )

    if (updateError) {
      console.error('Error updating user:', updateError)
      return new Response(
        JSON.stringify({ error: `Erreur lors de la mise à jour de l'utilisateur: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mettre à jour ou créer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: claireUser.id,
        first_name: 'Claire',
        last_name: 'Laurent',
        is_admin: true 
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return new Response(
        JSON.stringify({ error: `Erreur lors de la mise à jour du profil: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully confirmed and updated Claire Laurent')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Claire Laurent est confirmée et administratrice',
        user_id: claireUser.id,
        email_confirmed: !!updatedUser.user.email_confirmed_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: `Erreur serveur: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
