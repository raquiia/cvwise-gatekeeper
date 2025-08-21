import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command } = await req.json();

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

    // Récupérer les candidats de l'utilisateur pour le contexte
    const { data: candidates, error: candidatesError } = await userSupabase
      .from('candidates')
      .select('id, first_name, last_name, position, detailed_status, ai_score')
      .limit(100);

    if (candidatesError) {
      console.error('Erreur lors de la récupération des candidats:', candidatesError);
    }

    // Construire le contexte avec les candidats
    const candidatesContext = candidates?.map(c => 
      `${c.first_name} ${c.last_name} (ID: ${c.id}) - ${c.position || 'Poste non spécifié'} - Statut: ${c.detailed_status || 'initial'} - Score IA: ${c.ai_score || 'N/A'}`
    ).join('\n') || '';

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

RÈGLES:
- Identifie le candidat par son nom ou ID
- Pour les actions, réponds TOUJOURS avec un JSON contenant "message" et "action"
- Pour les questions simples, réponds juste avec "message"
- Sois concis et professionnel
- Si le nom n'est pas exact, suggère des candidats similaires

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