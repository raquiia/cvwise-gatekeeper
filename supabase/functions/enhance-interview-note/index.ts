
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

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

    // Configurer OpenAI
    const configuration = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(configuration);

    // Appel à l'API OpenAI pour améliorer le contenu
    const prompt = `
    Voici une note d'entretien avec un candidat: "${content}"

    En tant que professionnel RH, améliore cette note pour la rendre:
    1. Plus structurée et professionnelle
    2. Claire et concise
    3. Objective et factuelle
    4. Prête à être présentée à un client potentiel
    5. Sans fautes d'orthographe ou de grammaire

    Garde toutes les informations importantes sur le candidat mais reformule-les de manière professionnelle.
    Format ta réponse en plusieurs paragraphes bien organisés.
    `;

    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant RH expert qui améliore les notes d'entretien pour les rendre professionnelles et impeccables, prêtes pour être présentées à des clients."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Extraire le contenu amélioré
    const enhancedContent = response.data.choices[0]?.message?.content || "";

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
