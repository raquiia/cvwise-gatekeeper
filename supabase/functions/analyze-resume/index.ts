
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

// Configure CORS headers
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

// Extraire des informations d'un CV (factice pour le moment)
async function extractResumeInfo(resumeText: string) {
  // À l'avenir, remplacer par un appel à l'API OpenAI pour extraire les informations du CV
  
  // Simuler l'extraction d'informations pour le moment
  const skills = [
    "JavaScript",
    "React",
    "CSS",
    "PHP",
    "SQL",
    "Product Management"
  ];
  
  const randomSkillsCount = Math.floor(Math.random() * 3) + 2;
  const selectedSkills = skills.sort(() => 0.5 - Math.random()).slice(0, randomSkillsCount);
  
  return {
    first_name: "Jean", // À remplacer par une véritable extraction
    last_name: "Dupont", // À remplacer par une véritable extraction
    email: "jean.dupont@example.com", // À remplacer par une véritable extraction
    phone: "+33123456789", // À remplacer par une véritable extraction
    position: "Développeur Frontend",
    years_experience: Math.floor(Math.random() * 10) + 1,
    location: "Paris, France",
    skills: selectedSkills,
    score: Math.floor(Math.random() * 50) + 50, // Score sur 100
  };
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    const { resumeId } = await req.json();
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les informations du CV depuis Supabase
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();
    
    if (resumeError || !resumeData) {
      throw new Error(resumeError?.message || "CV non trouvé");
    }
    
    // Fetch the resume file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("resumes")
      .download(resumeData.file_path);
    
    if (fileError || !fileData) {
      throw new Error(fileError?.message || "Fichier CV non trouvé");
    }
    
    // Simuler l'extraction des données du CV
    // Remplacer par un véritable appel à l'API OpenAI pour extraire le texte et les informations
    const resumeText = "Ceci est un texte de CV simulé.";
    
    // Extraire les informations du CV
    const extractedInfo = await extractResumeInfo(resumeText);
    
    // Créer ou mettre à jour le candidat dans la base de données
    const candidateData = {
      resume_id: resumeId,
      user_id: resumeData.user_id,
      ...extractedInfo,
    };
    
    const { data: candidateData, error: candidateError } = await supabase
      .from("candidates")
      .upsert(candidateData)
      .select()
      .single();
    
    if (candidateError) {
      throw new Error(candidateError.message);
    }
    
    // Marquer le CV comme analysé
    await supabase
      .from("resumes")
      .update({ parsed: true })
      .eq("id", resumeId);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "CV analysé avec succès",
        candidate: candidateData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Erreur lors de l'analyse du CV",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
