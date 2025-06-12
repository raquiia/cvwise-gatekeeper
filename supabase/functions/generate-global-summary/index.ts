
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Récupérer les variables d'environnement
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY manquante");
    }

    // Parser le corps de la requête
    const { notesContent, candidateId } = await req.json();
    
    if (!notesContent || typeof notesContent !== "string") {
      throw new Error("Le contenu des notes est requis et doit être une chaîne de caractères");
    }

    if (!candidateId) {
      throw new Error("L'identifiant du candidat est requis");
    }

    // Prompt optimisé pour GPT-4o-mini avec structure plus détaillée
    const prompt = `
    Voici l'ensemble des notes d'entretien pour un candidat:

    ${notesContent}

    En tant que professionnel RH senior, génère un compte-rendu global synthétisant toutes ces notes d'entretien pour créer un résumé complet et professionnel du profil du candidat.
    
    STRUCTURE OBLIGATOIRE du compte-rendu :

    **1. SYNTHÈSE DU PROFIL**
    - Résumé en 3-4 phrases du profil professionnel
    - Positionnement du candidat (junior/confirmé/senior)
    - Domaine(s) d'expertise principal/aux

    **2. FORCES IDENTIFIÉES**
    - Compétences techniques solides (avec exemples concrets)
    - Qualités humaines et relationnelles observées
    - Expériences ou réalisations marquantes
    - Potentiel d'évolution identifié

    **3. POINTS D'ATTENTION**
    - Compétences à développer ou manquantes
    - Aspects comportementaux ou situationnels à surveiller
    - Écarts éventuels avec le profil recherché

    **4. ADÉQUATION GLOBALE**
    - Évaluation de la correspondance avec les attentes
    - Positionnement par rapport aux autres candidats (si applicable)
    - Capacité d'intégration dans l'équipe/entreprise

    **5. RECOMMANDATIONS**
    - Suite du processus de recrutement recommandée
    - Étapes supplémentaires nécessaires (tests, entretiens...)
    - Conditions ou points de vigilance pour un recrutement

    Le compte-rendu doit être :
    - Factuel et objectif basé sur les observations
    - Équilibré entre points positifs et points d'attention
    - Professionnel et prêt à être partagé avec un client
    - Structuré avec des sections clairement identifiées
    - Concis mais complet (éviter les répétitions)
    `;

    // Migration vers GPT-4o-mini
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Migration vers gpt-4o-mini
        messages: [
          {
            role: "system",
            content: "Tu es un assistant RH expert qui synthétise des notes d'entretien pour créer des comptes-rendus globaux complets, structurés et professionnels. Tu produis des évaluations équilibrées et objectives, prêtes pour être présentées à des clients."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4, // Légèrement augmenté pour plus de nuance dans l'analyse
        max_tokens: 3000, // Augmenté pour permettre un compte-rendu complet
        top_p: 0.9 // Ajouté pour améliorer la qualité
      })
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur OpenAI (GPT-4o-mini):", errorData);
      throw new Error(`Erreur API OpenAI: ${response.status} ${response.statusText}`);
    }

    // Extraire le résumé global généré
    const data = await response.json();
    const globalSummary = data.choices[0]?.message?.content || "";

    console.log("Global summary generated successfully with GPT-4o-mini for candidate:", candidateId);

    return new Response(
      JSON.stringify({ globalSummary }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur generate-global-summary (GPT-4o-mini):", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 400,
      }
    );
  }
});
