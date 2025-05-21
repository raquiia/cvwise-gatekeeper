
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

// Cette fonction vérifie si l'utilisateur demandeur est un administrateur
async function isAdmin(userId: string) {
  try {
    // Vérification dans la table profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Erreur lors de la vérification du statut admin:', profileError.message)
      return false
    }

    // Si l'utilisateur est explicitement marqué comme admin
    if (profileData && profileData.is_admin === true) {
      return true
    }

    // Si l'administrateur par défaut est configuré, on vérifie si c'est lui
    const adminEmail = Deno.env.get('DEFAULT_ADMIN_EMAIL')
    if (adminEmail) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!userError && userData && userData.user && userData.user.email === adminEmail) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Exception lors de la vérification admin:', error)
    return false
  }
}

// Gestion des requêtes
Deno.serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Récupération du token d'autorisation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé - token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérification de l'utilisateur demandeur
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'utilisateur demandeur est un administrateur
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return new Response(
        JSON.stringify({ error: 'Seuls les administrateurs peuvent créer des comptes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les données du corps de la requête
    const requestData = await req.json()
    const { email, password, userData } = requestData

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email et mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer l'utilisateur avec les droits admin
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: userData?.firstName || '',
        last_name: userData?.lastName || '',
        company: userData?.company || '',
      }
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Si le nouveau compte doit avoir des droits admin
    if (userData?.isAdmin && newUser?.user) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', newUser.user.id)

      if (updateError) {
        console.error('Erreur lors de la définition des droits admin:', updateError.message)
        // On continue car l'utilisateur a bien été créé, même si les droits admin n'ont pas pu être définis
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Utilisateur créé avec succès',
        user: {
          id: newUser?.user?.id,
          email: newUser?.user?.email,
          isAdmin: userData?.isAdmin || false
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la création de l\'utilisateur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
