
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
    const { content } = await req.json();
    
    if (!content || typeof content !== "string") {
      throw new Error("Le contenu de la note est requis et doit être une chaîne de caractères");
    }

    // Prompt optimisé pour GPT-4o-mini
    const prompt = `
    Voici une note d'entretien avec un candidat: "${content}"

    En tant que professionnel RH expérimenté, améliore cette note pour la rendre:
    1. Plus structurée et professionnelle avec des sections clairement définies
    2. Claire, concise et factuelle sans répétitions
    3. Objective et professionnelle, prête à être présentée à un client
    4. Sans fautes d'orthographe, de grammaire ou de syntaxe
    5. Avec une évaluation équilibrée (points forts ET points d'amélioration)

    STRUCTURE ATTENDUE :
    - Profil du candidat (résumé en 2-3 phrases)
    - Points forts observés (2-4 points factuels)
    - Points d'attention ou d'amélioration (1-3 points constructifs)
    - Recommandations pour la suite du processus

    Garde toutes les informations importantes du candidat mais reformule-les de manière professionnelle et structurée.
    Utilise un ton professionnel mais accessible.
    `;

    // Migration vers GPT-4o-mini pour réduire les coûts
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
            content: "Tu es un assistant RH expert qui améliore les notes d'entretien pour les rendre professionnelles, structurées et impeccables. Tu produis des comptes-rendus clairs et objectifs, prêts pour être présentés à des clients potentiels."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Réduit pour plus de cohérence
        max_tokens: 2500, // Augmenté légèrement pour compenser
        top_p: 0.9 // Ajouté pour améliorer la qualité
      })
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur OpenAI (GPT-4o-mini):", errorData);
      throw new Error(`Erreur API OpenAI: ${response.status} ${response.statusText}`);
    }

    // Extraire le contenu amélioré
    const data = await response.json();
    const enhancedContent = data.choices[0]?.message?.content || "";

    console.log("Interview note enhanced successfully with GPT-4o-mini");

    return new Response(
      JSON.stringify({ enhancedContent }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur enhance-interview-note (GPT-4o-mini):", error.message);
    
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
