
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
    const { resumeId, resumeText } = await req.json();
    
    if (!resumeId || !resumeText) {
      throw new Error("L'ID du CV et le texte extrait sont requis");
    }
    
    console.log("Démarrage de l'analyse AI pour le CV:", resumeId);
    console.log("Texte extrait, longueur:", resumeText.length);

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
        model: "gpt-4o-mini",
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
            
            Fournis ces informations sous forme d'un objet JSON valide et RIEN D'AUTRE, avec des propriétés en anglais.
            
            Réponds UNIQUEMENT avec un objet JSON, sans explications ni texte additionnel.`
          },
          {
            role: "user",
            content: `Voici le texte extrait d'un CV. Analyse-le et extrait les informations structurées demandées:\n\n${resumeText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
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
      parsedData = JSON.parse(content);
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
