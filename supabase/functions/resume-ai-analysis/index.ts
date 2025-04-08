
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

// Truncate text to avoid token limit issues with OpenAI
function truncateText(text: string, maxLength = 30000): string {
  if (!text || text.length <= maxLength) return text;
  
  console.log(`Truncating text from ${text.length} characters to ${maxLength} characters`);
  
  // Extract the first part for basic info
  const firstPart = text.substring(0, maxLength * 0.3);
  
  // Try to find important sections like experience, education, skills
  const experienceMatch = text.match(/expérience|experience|professional|professionnel/i);
  const educationMatch = text.match(/education|formation|études|etudes/i);
  const skillsMatch = text.match(/compétences|competences|skills|skillset/i);
  
  let experiencePart = "";
  let educationPart = "";
  let skillsPart = "";
  
  // Get experience section if found (up to 40% of max length)
  if (experienceMatch && experienceMatch.index !== undefined) {
    const start = experienceMatch.index;
    const end = Math.min(start + (maxLength * 0.4), text.length);
    experiencePart = text.substring(start, end);
  }
  
  // Get education section if found (up to 15% of max length)
  if (educationMatch && educationMatch.index !== undefined) {
    const start = educationMatch.index;
    const end = Math.min(start + (maxLength * 0.15), text.length);
    educationPart = text.substring(start, end);
  }
  
  // Get skills section if found (up to 15% of max length)
  if (skillsMatch && skillsMatch.index !== undefined) {
    const start = skillsMatch.index;
    const end = Math.min(start + (maxLength * 0.15), text.length);
    skillsPart = text.substring(start, end);
  }
  
  // Combine parts with markers
  return [
    "--- DÉBUT DU CV (PREMIÈRES INFORMATIONS) ---",
    firstPart,
    "--- SECTION EXPÉRIENCE ---",
    experiencePart,
    "--- SECTION ÉDUCATION ---",
    educationPart,
    "--- SECTION COMPÉTENCES ---",
    skillsPart,
    "--- FIN DU CV (TRONQUÉ POUR L'ANALYSE) ---"
  ].join("\n\n");
}

// Extract JSON content from potential markdown-formatted responses
function extractJsonFromMarkdown(text: string): string {
  // Check if response contains markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    console.log("Extracted JSON from markdown code block");
    return jsonMatch[1];
  }
  
  // If no code blocks, try to find JSON object directly
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    console.log("Extracted JSON object directly from response");
    return objectMatch[0];
  }
  
  // Return original text if no JSON pattern found
  return text;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { resumeId, resumeText, extractText, pdfUrl } = await req.json();
    
    if (!resumeId) {
      throw new Error("L'ID du CV est requis");
    }
    
    console.log("Démarrage de l'analyse AI pour le CV:", resumeId);

    // Créer un client Supabase avec la clé service
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les données du CV pour le contexte
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();
      
    if (resumeError) {
      console.error("Erreur lors de la récupération du CV:", resumeError);
      throw new Error("CV introuvable");
    }
    
    // Récupérer ou créer le candidat associé
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("*")
      .eq("resume_id", resumeId)
      .maybeSingle();
    
    console.log("Candidat existant:", existingCandidate);
    
    // Extraire ou utiliser le texte du CV
    let textToAnalyze = resumeText;
    
    if (!textToAnalyze && pdfUrl) {
      console.log("URL PDF fournie, tentative d'extraction du texte");
      
      try {
        // Appeler notre fonction d'extraction de texte avec l'URL
        const extractResponse = await fetch(`${supabaseUrl}/functions/v1/extract-cv-text`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ pdfUrl, resumeId })
        });
        
        if (!extractResponse.ok) {
          throw new Error(`Échec de l'extraction: ${extractResponse.status} ${extractResponse.statusText}`);
        }
        
        const extractData = await extractResponse.json();
        
        if (!extractData.success) {
          throw new Error(extractData.error || "Échec de l'extraction du texte");
        }
        
        textToAnalyze = extractData.data.text;
        console.log("Texte extrait avec succès, longueur:", textToAnalyze.length);
      } catch (extractError) {
        console.error("Erreur lors de l'extraction du texte:", extractError);
        // On continue avec l'ancienne méthode d'extraction si disponible
      }
    }
    
    if (!textToAnalyze && extractText) {
      console.log("Extraction du texte côté serveur demandée");
      
      try {
        // Télécharger le fichier du storage avec des privilèges élevés
        const { data: fileData, error: fileError } = await supabase.storage
          .from("resumes")
          .download(resumeData.file_path);
          
        if (fileError || !fileData) {
          console.error("Erreur lors du téléchargement du fichier:", fileError);
          throw new Error("Impossible de télécharger le fichier du CV");
        }
        
        // Convertir le blob en texte
        textToAnalyze = await fileData.text();
        console.log("Texte extrait côté serveur, longueur:", textToAnalyze.length);
      } catch (extractError) {
        console.error("Erreur lors de l'extraction du texte:", extractError);
        throw new Error("Échec de l'extraction du texte du CV");
      }
    }
    
    if (!textToAnalyze) {
      throw new Error("Le texte du CV est requis pour l'analyse");
    }
    
    console.log("Texte à analyser, longueur:", textToAnalyze.length);
    
    // IMPORTANT: Tronquer le texte pour respecter les limites de tokens d'OpenAI
    const truncatedText = truncateText(textToAnalyze, 30000);
    
    // Utiliser OpenAI pour analyser le CV
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("Clé API OpenAI non configurée");
    }
    
    // Construire la requête vers l'API OpenAI
    console.log("Envoi de la requête à OpenAI");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Utiliser gpt-4o-mini qui est plus efficace avec les tokens
        messages: [
          {
            role: "system",
            content: `Tu es un expert en analyse de CV. Tu dois extraire les informations structurées suivantes d'un CV:
            - Informations personnelles (prénom, nom, email, téléphone)
            - Titre/position professionnelle actuelle
            - Années d'expérience totales
            - Lieu/localisation
            - Compétences techniques (liste détaillée)
            - Entreprise actuelle/dernière
            - Expériences professionnelles (avec titre, entreprise, dates, description)
            - Formation (avec diplôme, établissement, année)
            - Certifications
            - Langues (avec niveau)
            - Projets significatifs
            - Centres d'intérêt
            - Industries pertinentes
            
            Fournis ces informations sous forme d'un objet JSON valide SANS utiliser de bloc de code markdown. Retourne UNIQUEMENT l'objet JSON brut, sans aucun formatage markdown ni autre texte.
            
            Note importante: Ce texte a été tronqué pour l'analyse, utilise les informations disponibles au mieux.`
          },
          {
            role: "user",
            content: `Voici le texte extrait d'un CV. Analyse-le et extrait les informations structurées demandées:\n\n${truncatedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    
    // Traiter la réponse de l'API
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur OpenAI:", errorData);
      throw new Error(`Erreur lors de l'analyse IA: ${errorData.error?.message || response.statusText}`);
    }
    
    const aiResult = await response.json();
    console.log("Réponse d'OpenAI reçue");
    
    // Extraire le contenu JSON de la réponse
    let parsedData: any;
    try {
      const content = aiResult.choices[0].message.content;
      // Utiliser la fonction d'extraction JSON pour gérer le cas où OpenAI retourne un JSON encapsulé dans un bloc de code markdown
      const cleanedContent = extractJsonFromMarkdown(content);
      console.log("Contenu nettoyé:", cleanedContent.substring(0, 200) + "...");
      
      parsedData = JSON.parse(cleanedContent);
      console.log("Données structurées extraites avec succès");
    } catch (error) {
      console.error("Erreur lors du parsing de la réponse OpenAI:", error);
      throw new Error("Impossible de traiter la réponse de l'IA");
    }
    
    // Transformer les données pour correspondre au schéma de la base de données
    const candidateData = {
      resume_id: resumeId,
      user_id: resumeData.user_id,
      first_name: parsedData.firstName || parsedData.first_name || "",
      last_name: parsedData.lastName || parsedData.last_name || "",
      email: parsedData.email || "",
      phone: parsedData.phone || parsedData.phoneNumber || "",
      position: parsedData.position || parsedData.title || parsedData.currentPosition || "",
      years_experience: parsedData.yearsExperience || parsedData.years_experience || 0,
      location: parsedData.location || "",
      skills: parsedData.skills || [],
      company: parsedData.company || parsedData.currentCompany || "",
      experiences: parsedData.experiences || parsedData.professionalExperiences || [],
      education: parsedData.education || [],
      certifications: parsedData.certifications || [],
      languages: parsedData.languages || [],
      interests: parsedData.interests || parsedData.hobbies || "",
      projects: parsedData.projects || [],
      industries: parsedData.industries || [],
      // Calcul du score basé sur la complétude et la qualité des données
      score: Math.min(95, 50 + 
        (parsedData.skills?.length || 0) * 3 + 
        (parsedData.experiences?.length || 0) * 5 +
        (parsedData.education?.length || 0) * 3),
      status: "qualification",
      profile_completeness: Math.min(95, 30 + 
        (parsedData.skills?.length || 0) * 3 + 
        (parsedData.experiences?.length || 0) * 5 +
        (parsedData.education?.length || 0) * 3 +
        (parsedData.languages?.length || 0) * 2 +
        (parsedData.certifications?.length || 0) * 2)
    };
    
    // Upsert du candidat dans la base de données
    console.log("Enregistrement du candidat dans la base de données");
    const { data: savedCandidate, error: candidateError } = await supabase
      .from("candidates")
      .upsert({
        ...(existingCandidate || {}),
        ...candidateData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (candidateError) {
      console.error("Erreur lors de l'enregistrement du candidat:", candidateError);
      throw new Error(`Impossible d'enregistrer le candidat: ${candidateError.message}`);
    }
    
    // Marquer le CV comme analysé
    const { error: updateError } = await supabase
      .from("resumes")
      .update({ parsed: true })
      .eq("id", resumeId);
      
    if (updateError) {
      console.error("Erreur lors de la mise à jour du statut du CV:", updateError);
      // Ne pas faire échouer l'opération entière pour cette erreur
    }
    
    console.log("Analyse IA du CV terminée avec succès");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Analyse IA terminée avec succès",
        candidate: savedCandidate,
        parsed_data: parsedData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'analyse IA du CV:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Une erreur est survenue lors de l'analyse IA du CV"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
