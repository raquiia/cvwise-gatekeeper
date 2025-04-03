
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
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error || !data) return false
  return data.is_admin === true
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

    // Vérification des privilèges administrateur
    const isUserAdmin = await isAdmin(user.id)
    if (!isUserAdmin) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé - privilèges administrateur requis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupération de la liste des utilisateurs avec le rôle service
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
