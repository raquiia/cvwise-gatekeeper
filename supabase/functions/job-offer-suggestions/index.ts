
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

// Fonction pour extraire un titre de poste à partir du texte libre
function extractJobTitle(text: string): string {
  // Rechercher des patterns communs de titres de poste
  const titlePatterns = [
    /poste\s+de\s+([\w\s]+?)(?:\s+à|\s+basé|\s+en|,|$)/i,
    /recherche\s+([\w\s]+?)(?:\s+à|\s+basé|\s+en|,|$)/i,
    /([\w\s]+?)\s+(?:à|basé|en|recherché)/i,
    /(développeur|ingénieur|technicien|consultant|chef de projet|architecte|manager)[\w\s]*/i,
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Nettoyer et formater le titre
      return match[1].trim().replace(/\s+/g, ' ').replace(/^\w/, c => c.toUpperCase());
    }
  }

  // Si aucun pattern ne correspond, utiliser les premiers mots (max 5)
  const words = text.trim().split(/\s+/);
  if (words.length > 0) {
    return words.slice(0, Math.min(5, words.length)).join(' ');
  }

  return "Poste à pourvoir"; // Titre par défaut
}

// Fonction pour extraire la localisation à partir du texte libre
function extractLocation(text: string): string | null {
  // Rechercher des patterns communs de localisation
  const locationPatterns = [
    /(?:à|en|sur|dans|près de|proche de)\s+([A-Z][a-zÀ-ÿ-]+(?:\s+[A-Z][a-zÀ-ÿ-]+)*)/i,
    /(?:basé|localisé|situé)\s+(?:à|en|sur|dans|près de|proche de)\s+([A-Z][a-zÀ-ÿ-]+(?:\s+[A-Z][a-zÀ-ÿ-]+)*)/i,
    /(?:poste|emploi|job)\s+(?:à|en|sur|dans)\s+([A-Z][a-zÀ-ÿ-]+(?:\s+[A-Z][a-zÀ-ÿ-]+)*)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  // Liste des grandes villes françaises pour la détection simple
  const frenchCities = ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", 
                      "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", 
                      "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"];
  
  for (const city of frenchCities) {
    if (text.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }

  return null;
}

// Fonction pour extraire le niveau d'éducation du texte libre
function extractEducationLevel(text: string): string | null {
  // Patterns pour les formulations courantes de niveaux d'éducation
  const educationPatterns = [
    /\b(bac\s*\+\s*[1-8])\b/i,
    /\b(master|licence|doctorat|bts|dut|bachelor)\b/i,
    /\bniveau\s+(bac\s*\+\s*[1-8]|master|licence|doctorat|bts|dut|bachelor)\b/i,
    /\bdiplôme\s+(bac\s*\+\s*[1-8]|master|licence|doctorat|bts|dut|bachelor)\b/i,
    /\b(bac\s*\+\s*[1-8]|master|licence|doctorat|bts|dut|bachelor)\s+(?:exigé|requis|demandé|obligatoire|souhaité)\b/i,
    /\b(master|licence|doctorat|bts|dut|bachelor)\s+(?:[1-2]|i{1,2})\b/i,
  ];

  for (const pattern of educationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Standardiser le format
      const education = match[1].trim().toLowerCase();
      
      // Normalisation des termes
      if (education.includes("bac+") || education.includes("bac +")) {
        return education.replace(/\s+/g, "").replace("bac+", "Bac+").toUpperCase();
      }
      
      if (education.startsWith("master")) return "Bac+5";
      if (education.startsWith("licence")) return "Bac+3";
      if (education.startsWith("doctorat")) return "Bac+8";
      if (education.startsWith("bts") || education.startsWith("dut")) return "Bac+2";
      if (education.startsWith("bachelor")) return "Bac+3";
      
      // Si c'est déjà un format standard, capitaliser la première lettre
      return education.charAt(0).toUpperCase() + education.slice(1);
    }
  }

  return null;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { jobTitle, location, freeformText } = await req.json();
    
    // Vérifier si nous avons un texte libre ou des champs spécifiques
    const isUsingFreeformText = !!freeformText && freeformText.trim().length > 0;
    
    if (!jobTitle && !freeformText) {
      throw new Error("Le titre du poste ou une description libre est requis");
    }
    
    console.log("Génération de suggestions pour:", { 
      mode: isUsingFreeformText ? "texte libre" : "formulaire standard",
      jobTitle, 
      location, 
      freeformText: freeformText?.substring(0, 100) + "..." 
    });

    // Obtenir la clé API OpenAI
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("Clé API OpenAI non configurée");
    }
    
    // Extraire des informations du texte libre si nécessaire
    let effectiveTitle = jobTitle || "";
    let effectiveLocation = location || "";
    let effectiveEducation = null;
    
    if (isUsingFreeformText) {
      // Extraire le titre si non fourni
      if (!effectiveTitle) {
        effectiveTitle = extractJobTitle(freeformText);
        console.log("Titre extrait du texte libre:", effectiveTitle);
      }
      
      // Extraire la localisation si non fournie
      if (!effectiveLocation) {
        const extractedLocation = extractLocation(freeformText);
        if (extractedLocation) {
          effectiveLocation = extractedLocation;
          console.log("Localisation extraite du texte libre:", effectiveLocation);
        }
      }
      
      // Extraire le niveau d'éducation
      effectiveEducation = extractEducationLevel(freeformText);
      if (effectiveEducation) {
        console.log("Niveau d'éducation extrait du texte libre:", effectiveEducation);
      }
    }
    
    // Construire le prompt basé sur les entrées
    let content;
    if (isUsingFreeformText) {
      content = `Génère une offre d'emploi complète et détaillée basée sur cette description: ${freeformText}`;
      
      // Ajouter des informations supplémentaires extraites si elles n'étaient pas dans le prompt d'origine
      if (effectiveTitle && !freeformText.toLowerCase().includes(effectiveTitle.toLowerCase())) {
        content += `\n\nTitre du poste: ${effectiveTitle}`;
      }
      
      if (effectiveLocation && !freeformText.toLowerCase().includes(effectiveLocation.toLowerCase())) {
        content += `\n\nLocalisation: ${effectiveLocation}`;
      }
      
      if (effectiveEducation && !freeformText.toLowerCase().includes(effectiveEducation.toLowerCase())) {
        content += `\n\nNiveau d'éducation requis: ${effectiveEducation}`;
      }
    } else {
      content = `Génère une offre d'emploi complète et détaillée pour un poste de ${effectiveTitle}${effectiveLocation ? ` à ${effectiveLocation}` : ''}`;
      if (effectiveEducation) {
        content += `\n\nNiveau d'éducation requis: ${effectiveEducation}`;
      }
    }
    
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

1. Un titre de poste précis et professionnel (maximum 5-6 mots)
2. Une localisation précise (ville ou région + pays)
3. Une description complète et détaillée du poste (au moins 200 mots)
4. Une liste de compétences techniques (hard skills) requises (au moins 8)
5. Une liste de compétences comportementales (soft skills) souhaitées (au moins 5)
6. Un niveau d'éducation requis (exemple: Bac+5, Bac+3, etc.)
7. Une fourchette d'expérience (années, minimum et maximum)
8. Un type de contrat recommandé (CDI, CDD, Freelance, etc.)
9. Une recommandation pour le mode de travail (sur site, hybride, télétravail)
10. Une fourchette de salaire appropriée (montants minimum et maximum)

Si le texte fourni par l'utilisateur mentionne explicitement:
- Un titre de poste: utilise exactement ce titre
- Une localisation: utilise exactement cette localisation
- Un niveau d'éducation: respecte cette exigence
- Un type de contrat: respecte cette exigence
- Des compétences spécifiques: inclus-les obligatoirement

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
        
        // S'assurer que les valeurs extraites sont utilisées si elles sont valides
        if (isUsingFreeformText) {
          // Garantir l'utilisation du titre et de la localisation extraits si pertinent
          if (effectiveTitle && (!suggestions.title || suggestions.title.length > 50)) {
            suggestions.title = effectiveTitle;
          }
          
          if (effectiveLocation && (!suggestions.location || suggestions.location.includes("Paris"))) {
            suggestions.location = effectiveLocation + (suggestions.location?.includes("France") ? ", France" : "");
          }
          
          // S'assurer que le niveau d'éducation est bien pris en compte
          if (effectiveEducation && (!suggestions.education || suggestions.education === "Bac+3")) {
            suggestions.education = effectiveEducation;
          }
        }
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
