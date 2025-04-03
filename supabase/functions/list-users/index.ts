
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

// Cette fonction vérifie si l'utilisateur est un administrateur
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

// Fonction pour définir un utilisateur comme administrateur
async function setUserAsAdmin(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Exception lors de la définition admin:', error)
    return false
  }
}

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

    // Vérification de l'utilisateur
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Analyse de l'URL pour déterminer l'action
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    // Action spéciale pour définir l'administrateur par défaut si c'est l'email configuré
    if (action === 'set-default-admin' && req.method === 'POST') {
      const adminEmail = Deno.env.get('DEFAULT_ADMIN_EMAIL')
      if (!adminEmail) {
        return new Response(
          JSON.stringify({ error: 'Aucun administrateur par défaut configuré' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (user.email !== adminEmail) {
        return new Response(
          JSON.stringify({ error: 'Seul l\'utilisateur désigné comme administrateur par défaut peut exécuter cette action' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const success = await setUserAsAdmin(user.id)
      if (!success) {
        return new Response(
          JSON.stringify({ error: 'Impossible de définir l\'utilisateur comme administrateur' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Vous êtes maintenant administrateur' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérification des privilèges administrateur pour les autres actions
    const isUserAdmin = await isAdmin(user.id)
    if (!isUserAdmin) {
      const adminEmail = Deno.env.get('DEFAULT_ADMIN_EMAIL')
      let message = 'Accès refusé - privilèges administrateur requis'
      
      if (adminEmail && user.email === adminEmail) {
        message += '. Veuillez d\'abord exécuter l\'action set-default-admin pour vous définir comme administrateur.'
      }

      return new Response(
        JSON.stringify({ error: message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Si on arrive ici, l'utilisateur est admin, on récupère la liste des utilisateurs
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les profils des utilisateurs pour enrichir les données
    const userIds = users.users.map(u => u.id)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('id', userIds)

    // Combiner les données des utilisateurs avec leurs profils
    const enrichedUsers = users.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id) || {}
      return {
        ...user,
        profile
      }
    })

    // Réponse avec la liste des utilisateurs
    return new Response(
      JSON.stringify({ users: enrichedUsers }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    // Gestion des erreurs
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la récupération des utilisateurs' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
