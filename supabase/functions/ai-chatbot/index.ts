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
    console.log('🚀 [ai-chatbot] Début du traitement de la requête');
    
    const { command } = await req.json();
    console.log('📥 [ai-chatbot] Commande reçue:', command);

    if (!command) {
      console.error('❌ [ai-chatbot] Aucune commande fournie');
      throw new Error('Aucune commande fournie');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ [ai-chatbot] Clé API OpenAI manquante');
      throw new Error('Clé API OpenAI non configurée');
    }
    
    console.log('✅ [ai-chatbot] Clé API OpenAI disponible');

    // Initialiser Supabase pour récupérer les candidats
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer l'utilisateur authentifié depuis l'authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ [ai-chatbot] Token d\'authentification manquant');
      throw new Error('Token d\'authentification manquant');
    }
    
    console.log('🔐 [ai-chatbot] Token d\'authentification présent');

    // Créer un client Supabase avec le token utilisateur
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    console.log('✅ [ai-chatbot] Client Supabase utilisateur créé');

    // Récupérer les candidats de l'utilisateur pour le contexte (triés par date de création)
    const { data: candidates, error: candidatesError } = await userSupabase
      .from('candidates')
      .select('id, first_name, last_name, position, detailed_status, ai_score, email, created_at')
      .order('created_at', { ascending: false })
      .limit(50); // Limiter pour améliorer les performances et la qualité du contexte

    if (candidatesError) {
      console.error('Erreur lors de la récupération des candidats:', candidatesError);
    }

    console.log(`📊 [ai-chatbot] ${candidates?.length || 0} candidats récupérés pour le contexte`);

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

    console.log('📝 [ai-chatbot] Contexte des candidats construit:', candidatesContext.substring(0, 500) + '...');

    const systemPrompt = `Tu es un assistant IA pour une application de recrutement. Tu peux exécuter des actions sur les candidats.

CANDIDATS DISPONIBLES:
${candidatesContext}

ACTIONS POSSIBLES:
1. add_note: Ajouter une note à un candidat
2. change_status: Changer le statut d'un candidat (initial, contact, prequalification, presentation_client, en_mission, refus, ancien_employe)
3. change_status_with_note: Changer le statut d'un candidat vers EC1/EC2 avec détails obligatoires (business manager, date entretien)
4. get_candidate_info: Récupérer les informations d'un candidat
5. search_candidates: Rechercher des candidats selon des critères avancés
6. navigate: Naviguer vers une page de l'application

🔍 CRITÈRES DE RECHERCHE DISPONIBLES:
- **location**: ville, pays, code postal (ex: "Paris", "Lyon", "75001")
- **experienceMin/experienceMax**: années d'expérience (ex: 3, 5)
- **education**: diplôme, filière (ex: "ingénieur", "master", "doctorat")
- **skills**: compétences techniques (ex: ["React", "Python"])
- **status**: statut candidat (ex: "ec1", "ec2", "en_mission")
- **minScore**: score AI minimum (ex: 80)

EXEMPLES DE RECHERCHES COMPLEXES:
• "Candidats ingénieurs à Lyon avec 5+ ans d'expérience"
• "Développeurs React parisiens ayant fait un EC2"
• "Meilleurs candidats (score >80) disponibles pour mission"
• "Profils master informatique dans le 75 avec statut contact"

⚠️ RÈGLES CRITIQUES POUR EC1 ET EC2:
- Les statuts EC1 et EC2 EXIGENT OBLIGATOIREMENT:
  * Le nom complet du Business Manager (prénom et nom)
  * L'email du Business Manager
  * La date et heure de l'entretien
- INTERDICTION ABSOLUE de changer vers EC1/EC2 sans ces informations
- Si ces informations manquent, tu DOIS refuser l'action et demander les informations manquantes
- Utilise TOUJOURS "change_status_with_note" pour EC1/EC2, JAMAIS "change_status"

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

PARSING DE DATES ET HEURES (IMPORTANT):
- Format français: "22/08/25" ou "22/08/2025" → convertir en ISO: "2025-08-22"
- Heure: "10h30", "10:30", "à 10h30" → convertir en "10:30:00"
- Date complète: "22/08/25 à 10h30" → "2025-08-22T10:30:00.000Z"
- Si pas d'heure précisée, utiliser "09:00:00" par défaut

PARSING BUSINESS MANAGER:
- Extraire prénom et nom séparément si possible
- "Guilhem Lecussan" → firstName: "Guilhem", lastName: "Lecussan"
- Si un seul nom donné, le mettre dans firstName

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

Pour "Change le statut de Louis Le Potvin en EC1" (SANS informations requises):
{
  "message": "❌ Impossible de passer Louis Le Potvin en EC1. Pour les statuts EC1 et EC2, je dois avoir obligatoirement:\n\n• Le nom complet du Business Manager\n• Son email\n• La date et heure de l'entretien\n\nExemple: 'Change le statut de Louis Le Potvin en EC1 avec Guilhem Lecussan (guilhem@exemple.com) pour un entretien le 22/08/25 à 10h30'"
}

Pour "Change le statut de Louis Le Potvin en EC1 avec Guilhem Lecussan (guilhem@exemple.com) pour un entretien le 22/08/25 à 10h30":
{
  "message": "Je change le statut de Louis Le Potvin en EC1 et j'ajoute une note pour l'entretien avec le business manager Guilhem Lecussan le 22/08/25 à 10h30. Une tâche sera automatiquement créée sur votre tableau de bord.",
  "action": {
    "type": "change_status_with_note",
    "candidateId": "uuid-du-candidat",
    "status": "ec1",
    "businessManager": "Guilhem Lecussan",
    "businessManagerEmail": "guilhem@exemple.com",
    "scheduledDate": "2025-08-22T10:30:00.000Z",
    "interviewType": "ec1",
    "noteContent": "Passage en EC1 avec Guilhem Lecussan pour entretien planifié"
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

Pour "Candidats ingénieurs à Lyon avec 5+ ans d'expérience":
{
  "message": "Je recherche les candidats ingénieurs basés à Lyon avec au moins 5 ans d'expérience...",
  "action": {
    "type": "search_candidates",
    "criteria": {
      "location": "Lyon",
      "education": "ingénieur",
      "experienceMin": 5
    }
  }
}

Pour "Meilleurs candidats parisiens ayant fait un EC2":
{
  "message": "Je recherche les meilleurs candidats parisiens qui ont eu un entretien client EC2...",
  "action": {
    "type": "search_candidates",
    "criteria": {
      "location": "Paris",
      "status": "ec2",
      "minScore": 70
    }
  }
}

Pour "Développeurs React avec master dans le 75":
{
  "message": "Je recherche les développeurs React ayant un master et basés dans Paris (75)...",
  "action": {
    "type": "search_candidates",
    "criteria": {
      "skills": ["React"],
      "education": "master",
      "location": "75"
    }
  }
}

Pour une question générale:
{
  "message": "Voici la réponse à votre question..."
}`;

    // Appel à OpenAI
    console.log('🤖 [ai-chatbot] Envoi de la requête à OpenAI...');
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
      console.error('❌ [ai-chatbot] Erreur OpenAI:', response.status, response.statusText);
      throw new Error(`Erreur OpenAI: ${response.statusText}`);
    }

    console.log('✅ [ai-chatbot] Réponse OpenAI reçue avec succès');
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('🤖 [ai-chatbot] Réponse IA brute:', aiResponse);

    // Essayer de parser la réponse comme JSON
    let parsedResponse;
    try {
      console.log('🔄 [ai-chatbot] Parsing de la réponse JSON...');
      parsedResponse = JSON.parse(aiResponse);
      console.log('✅ [ai-chatbot] JSON parsé avec succès:', parsedResponse);
    } catch (parseError) {
      console.log('⚠️ [ai-chatbot] Réponse non-JSON, traitement comme message simple');
      parsedResponse = { message: aiResponse };
    }

    console.log('📤 [ai-chatbot] Envoi de la réponse finale');
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [ai-chatbot] Exception attrapée:', error);
    console.error('💥 [ai-chatbot] Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        message: "Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous réessayer ?",
        error: error.message,
        debug: {
          type: error.constructor.name,
          stack: error.stack?.substring(0, 500) + '...'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});