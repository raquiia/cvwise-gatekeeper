
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { jobTitle, location, freeformText } = await req.json();
    
    if (!jobTitle && !freeformText) {
      throw new Error("Le titre du poste ou une description libre est requis");
    }
    
    console.log("Génération de suggestions pour:", { jobTitle, location, freeformText: freeformText?.substring(0, 100) + "..." });

    // Obtenir la clé API OpenAI
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("Clé API OpenAI non configurée");
    }
    
    // Construire le prompt basé sur les entrées
    const content = freeformText 
      ? `Génère une offre d'emploi complète et détaillée basée sur cette description: ${freeformText}`
      : `Génère une offre d'emploi complète et détaillée pour un poste de ${jobTitle}${location ? ` à ${location}` : ''}.`;
    
    // Appel à l'API OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en recrutement et en rédaction d'offres d'emploi qui génère des offres d'emploi complètes, structurées et professionnelles. 
            
Analyse la demande de l'utilisateur et génère une offre d'emploi complète avec les éléments suivants :

1. Un titre de poste précis et professionnel
2. Une localisation précise (ville ou région + pays)
3. Une description complète et détaillée du poste (au moins 200 mots)
4. Une liste de compétences techniques (hard skills) requises (au moins 8)
5. Une liste de compétences comportementales (soft skills) souhaitées (au moins 5)
6. Un niveau d'éducation requis (exemple: Bac+5, Bac+3, etc.)
7. Une fourchette d'expérience (années, minimum et maximum)
8. Un type de contrat recommandé (CDI, CDD, Freelance, etc.)
9. Une recommandation pour le mode de travail (sur site, hybride, télétravail)
10. Une fourchette de salaire appropriée (montants minimum et maximum)

Retourne ces informations dans un JSON structuré avec les champs suivants:

{
  "title": "Titre du poste",
  "location": "Localisation (ville/région, pays)",
  "description": "Description complète du poste sur plusieurs paragraphes",
  "requiredSkills": ["Compétence 1", "Compétence 2", ...],
  "softSkills": ["Soft skill 1", "Soft skill 2", ...],
  "toolsAndTechnologies": ["Outil/Technologie 1", "Outil/Technologie 2", ...],
  "education": "Niveau d'éducation requis",
  "experience": {
    "min": nombre d'années minimum,
    "max": nombre d'années maximum
  },
  "contractType": "Type de contrat recommandé",
  "remotePreference": "Préférence de télétravail",
  "salary": {
    "min": salaire minimum,
    "max": salaire maximum,
    "currency": "EUR"
  }
}

Assure-toi que tous les champs sont remplis avec des informations pertinentes et professionnelles. Ton objectif est de créer une offre d'emploi attrayante et complète qui pourrait être publiée immédiatement.`
          },
          { role: "user", content }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur OpenAI:", errorData);
      throw new Error(`Erreur lors de la génération: ${errorData.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Réponse OpenAI reçue");
    
    let suggestions;
    try {
      const content = result.choices[0].message.content;
      // Extraire le JSON de la réponse
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
        console.log("Suggestions analysées avec succès");
      } else {
        throw new Error("Format de réponse invalide");
      }
    } catch (error) {
      console.error("Erreur lors du parsing de la réponse:", error);
      throw new Error("Impossible de traiter la réponse de l'IA");
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: suggestions
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("Erreur:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Une erreur est survenue lors de la génération des suggestions"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
