
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

    // Appel direct à l'API OpenAI sans utiliser le client OpenAI
    const prompt = `
    Voici l'ensemble des notes d'entretien pour un candidat:

    ${notesContent}

    En tant que professionnel RH, génère un compte-rendu global synthétisant toutes ces notes d'entretien pour créer un résumé complet du profil du candidat.
    
    Ce compte-rendu doit:
    1. Synthétiser les points clés de tous les entretiens
    2. Mettre en évidence les forces et faiblesses du candidat
    3. Évaluer l'adéquation globale du profil
    4. Être structuré et professionnel
    5. Faire des recommandations sur la suite du processus de recrutement

    Format ta réponse en plusieurs paragraphes bien organisés avec des sections clairement définies.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant RH expert qui synthétise des notes d'entretien pour créer un compte-rendu global complet et professionnel."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur OpenAI:", errorData);
      throw new Error(`Erreur API OpenAI: ${response.status} ${response.statusText}`);
    }

    // Extraire le résumé global généré
    const data = await response.json();
    const globalSummary = data.choices[0]?.message?.content || "";

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
    console.error("Erreur:", error.message);
    
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
