import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction utilitaire pour normaliser les noms (pour un meilleur matching)
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction pour créer des variations de noms
function createNameVariations(firstName, lastName) {
  const variations = [
    `${firstName} ${lastName}`,
    `${firstName.toLowerCase()} ${lastName.toLowerCase()}`,
    `${firstName.toUpperCase()} ${lastName.toUpperCase()}`,
    `${firstName} ${lastName.toUpperCase()}`,
    `${firstName.toLowerCase()} ${lastName}`,
    normalizeText(`${firstName} ${lastName}`),
  ];
  
  // Ajouter des variations sans espaces
  variations.push(`${firstName}${lastName}`.toLowerCase());
  variations.push(`${firstName}.${lastName}`.toLowerCase());
  
  return [...new Set(variations)]; // Supprimer les doublons
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();
    console.log('Commande reçue:', command);

    if (!command) {
      throw new Error('Aucune commande fournie');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    // Initialiser Supabase pour récupérer les candidats
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer l'utilisateur authentifié depuis l'authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Token d\'authentification manquant');
    }

    // Créer un client Supabase avec le token utilisateur
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Récupérer les candidats de l'utilisateur pour le contexte (triés par date de création)
    const { data: candidates, error: candidatesError } = await userSupabase
      .from('candidates')
      .select('id, first_name, last_name, position, detailed_status, ai_score, email, created_at')
      .order('created_at', { ascending: false })
      .limit(50); // Limiter pour améliorer les performances et la qualité du contexte

    if (candidatesError) {
      console.error('Erreur lors de la récupération des candidats:', candidatesError);
    }

    console.log(`${candidates?.length || 0} candidats récupérés pour le contexte`);

    // Construire un contexte enrichi avec variations de noms
    const candidatesContext = candidates?.map(c => {
      const fullName = `${c.first_name} ${c.last_name}`;
      const variations = createNameVariations(c.first_name, c.last_name);
      const additionalInfo = [];
      
      if (c.email) additionalInfo.push(`Email: ${c.email}`);
      if (c.position) additionalInfo.push(`Poste: ${c.position}`);
      
      return `• ${fullName} (ID: ${c.id})
  - Statut: ${c.detailed_status || 'initial'}
  - Score IA: ${c.ai_score || 'N/A'}
  - ${additionalInfo.join(' | ')}
  - Variations: ${variations.slice(0, 3).join(', ')}`;
    }).join('\n\n') || '';

    console.log('Contexte des candidats construit:', candidatesContext.substring(0, 500) + '...');

    const systemPrompt = `Tu es un assistant IA pour une application de recrutement. Tu peux exécuter des actions sur les candidats.

CANDIDATS DISPONIBLES:
${candidatesContext}

ACTIONS POSSIBLES:
1. add_note: Ajouter une note à un candidat
2. change_status: Changer le statut d'un candidat (initial, contact, prequalification, ec1, ec2, presentation_client, en_mission, refus, ancien_employe)
3. change_status_with_note: Changer le statut d'un candidat et ajouter une note avec détails (business manager, date entretien)
4. get_candidate_info: Récupérer les informations d'un candidat
5. search_candidates: Rechercher des candidats selon des critères
6. navigate: Naviguer vers une page de l'application

PAGES DISPONIBLES POUR LA NAVIGATION:
- /dashboard : Tableau de bord principal
- /candidates : Liste des candidats
- /candidates/:id : Fiche détaillée d'un candidat (remplace :id par l'ID du candidat)
- /resumes : Gestion des CVs
- /job-offers : Liste des offres d'emploi
- /job-offers/:id : Détails d'une offre d'emploi

RÈGLES IMPORTANTES POUR L'IDENTIFICATION DES CANDIDATS:
- Sois TRÈS TOLÉRANT avec les variations de noms (casse, accents, espaces)
- "Louis Le Potvin", "louis le potvin", "Louis le potvin", "LOUIS LE POTVIN" sont tous identiques
- Ignore les différences d'accents : "é" = "e", "à" = "a", etc.
- Accepte les variations d'espacement : "Le Potvin" = "LePotvin" = "le potvin"
- Utilise les variations fournies dans le contexte pour identifier les candidats
- En cas de doute entre plusieurs candidats, utilise l'ID ou demande une clarification
- TOUJOURS utiliser l'ID exact du candidat trouvé dans la réponse JSON

RÈGLES GÉNÉRALES:
- Pour les actions, réponds TOUJOURS avec un JSON contenant "message" et "action"
- Pour les questions simples, réponds juste avec "message"
- Sois concis et professionnel
- Si aucun candidat ne correspond exactement, suggère le plus proche

EXEMPLES DE MATCHING DE NOMS:
- "louis le potvin" → Trouve "Louis Le Potvin (ID: e6e7f2b4-e415-4fd2-978c-a11cf1641ee9)"
- "MARIE MARTIN" → Trouve "Marie Martin" même si écrit différemment
- "jean dupont" → Trouve "Jean Dupont" même sans majuscules

EXEMPLES DE RÉPONSES:
Pour "Ajoute une note à Jean Dupont":
{
  "message": "J'ajoute une note pour Jean Dupont",
  "action": {
    "type": "add_note",
    "candidateId": "uuid-du-candidat",
    "content": "Note ajoutée via assistant IA",
    "noteType": "global"
  }
}

Pour "Change le statut de Louis Le Potvin en EC1 avec Guilhem Lecussan pour un entretien le 22/08/25 à 10h30":
{
  "message": "Je change le statut de Louis Le Potvin en EC1 et j'ajoute une note pour l'entretien avec le business manager Guilhem Lecussan le 22/08/25 à 10h30.",
  "action": {
    "type": "change_status_with_note",
    "candidateId": "uuid-du-candidat",
    "status": "ec1",
    "businessManager": "Guilhem Lecussan",
    "interviewDate": "22/08/25",
    "interviewTime": "10h30",
    "noteContent": "Entretien EC1 prévu le 22/08/25 à 10h30 avec le business manager Guilhem Lecussan"
  }
}

Pour "Quel est le statut de Marie Martin ?":
{
  "message": "Je vérifie le statut de Marie Martin",
  "action": {
    "type": "get_candidate_info",
    "candidateId": "uuid-du-candidat"
  }
}

Pour "Ouvre la fiche de Jean Dupont":
{
  "message": "J'ouvre la fiche de Jean Dupont",
  "action": {
    "type": "navigate",
    "path": "/candidates/:id",
    "candidateId": "uuid-du-candidat"
  }
}

Pour "Va au dashboard":
{
  "message": "Je vous redirige vers le tableau de bord",
  "action": {
    "type": "navigate",
    "path": "/dashboard"
  }
}

Pour une question générale:
{
  "message": "Voici la réponse à votre question..."
}`;

    // Appel à OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur OpenAI: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Réponse IA brute:', aiResponse);

    // Essayer de parser la réponse comme JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // Si ce n'est pas du JSON, traiter comme message simple
      parsedResponse = { message: aiResponse };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur dans ai-chatbot:', error);
    return new Response(
      JSON.stringify({ 
        message: "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous réessayer ?",
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});