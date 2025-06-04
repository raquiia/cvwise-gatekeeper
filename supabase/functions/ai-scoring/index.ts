
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
    const { candidateId, jobOfferId, scoringType } = await req.json();
    
    console.log('AI Scoring request:', { candidateId, jobOfferId, scoringType });
    
    if (!candidateId) {
      throw new Error("Candidate ID is required");
    }

    // Créer un client Supabase avec la clé service
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les données du candidat
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();
      
    if (candidateError || !candidate) {
      throw new Error("Candidate not found");
    }
    
    // Récupérer les notes d'entretien
    const { data: notes, error: notesError } = await supabase
      .from("candidate_notes")
      .select("*")
      .eq("candidate_id", candidateId);
    
    if (notesError) {
      console.warn("Could not fetch notes:", notesError);
    }
    
    let jobOffer = null;
    if (jobOfferId && scoringType === 'matching') {
      const { data: jobOfferData, error: jobError } = await supabase
        .from("job_offers")
        .select("*")
        .eq("id", jobOfferId)
        .single();
        
      if (jobError) {
        console.warn("Could not fetch job offer:", jobError);
      } else {
        jobOffer = jobOfferData;
      }
    }
    
    // Utiliser OpenAI pour analyser
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }
    
    const scoringPrompt = createScoringPrompt(candidate, jobOffer, notes || [], scoringType);
    
    console.log("Calling OpenAI for scoring analysis");
    
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
            content: scoringPrompt.system
          },
          {
            role: "user",
            content: scoringPrompt.user
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const aiResult = await response.json();
    const analysisContent = aiResult.choices[0].message.content;
    
    console.log("AI analysis received");
    
    // Parser la réponse JSON de l'IA
    let scoringResult;
    try {
      // Extraire le JSON de la réponse (au cas où l'IA ajoute du texte autour)
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : analysisContent;
      scoringResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Invalid AI response format");
    }
    
    // Stocker le résultat dans la base de données selon le type
    if (scoringType === 'matching' && jobOfferId) {
      // Stocker le score de matching
      await supabase
        .from('candidate_job_matching_scores')
        .upsert({
          candidate_id: candidateId,
          job_offer_id: jobOfferId,
          user_id: candidate.user_id,
          education_match_score: scoringResult.education_score || 0,
          skills_tools_score: scoringResult.skills_score || 0,
          relevant_experience_score: scoringResult.experience_score || 0,
          location_score: scoringResult.location_score || 0,
          languages_match_score: scoringResult.languages_score || 0,
          cultural_fit_score: scoringResult.cultural_fit_score || 0,
          availability_mobility_score: scoringResult.availability_score || 0,
          interview_notes_bonus: scoringResult.interview_bonus || 0,
          total_matching_score: scoringResult.total_score || 0,
          ai_analysis: scoringResult.explanation || '',
          data_hash: `ai-${candidateId}-${jobOfferId}-${Date.now()}`,
          calculated_at: new Date().toISOString()
        });
    } else {
      // Stocker le score de complétude
      await supabase
        .from('candidate_scores')
        .upsert({
          candidate_id: candidateId,
          user_id: candidate.user_id,
          education_score: scoringResult.education_score || 0,
          experience_score: scoringResult.experience_score || 0,
          skills_score: scoringResult.skills_score || 0,
          languages_score: scoringResult.languages_score || 0,
          location_mobility_score: scoringResult.location_score || 0,
          profile_summary_score: scoringResult.profile_summary_score || 0,
          cv_structure_score: scoringResult.cv_structure_score || 0,
          general_score: scoringResult.total_score || 0,
          ai_analysis: scoringResult.explanation || '',
          data_hash: `ai-${candidateId}-${Date.now()}`,
          calculated_at: new Date().toISOString()
        });
    }
    
    console.log("AI scoring completed successfully");
    
    return new Response(
      JSON.stringify({
        success: true,
        scoringResult,
        message: "AI scoring completed successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
    
  } catch (error: any) {
    console.error("Error in AI scoring:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred during AI scoring",
        message: "AI scoring failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  }
});

function createScoringPrompt(candidate: any, jobOffer: any, notes: any[], scoringType: string) {
  const isMatching = scoringType === 'matching' && jobOffer;
  
  const systemPrompt = `Tu es un expert en évaluation de profils candidats avec une approche analytique et précise. Tu dois analyser ${isMatching ? 'la correspondance entre un candidat et une offre d\'emploi' : 'la complétude et qualité d\'un profil candidat'}.

${isMatching ? `
Critères de matching (total 100 points):
1. Compétences techniques requises (25 points)
2. Expérience pertinente (20 points) 
3. Niveau d'études correspondant (20 points)
4. Localisation/mobilité (10 points)
5. Langues requises (5 points)
6. Adéquation culturelle/soft skills (10 points)
7. Disponibilité et mobilité (5 points)
8. Notes d'entretien (bonus/malus 5 points)
` : `
Critères de complétude (total 100 points):
1. Niveau d'études (20 points)
2. Expériences professionnelles (20 points)
3. Compétences/outils (20 points)
4. Langues (10 points)
5. Localisation/mobilité (10 points)
6. Résumé/objectif professionnel (10 points)
7. Structuration du CV (10 points)
`}

Retourne UNIQUEMENT un objet JSON avec cette structure exacte:
{
  "education_score": number,
  "skills_score": number,
  "experience_score": number,
  "location_score": number,
  "languages_score": number,
  ${isMatching ? `
  "cultural_fit_score": number,
  "availability_score": number,
  "interview_bonus": number,
  ` : `
  "profile_summary_score": number,
  "cv_structure_score": number,
  `}
  "total_score": number,
  "explanation": "Explication détaillée en français du scoring"
}`;

  const candidateData = `
CANDIDAT:
- Nom: ${candidate.first_name || ''} ${candidate.last_name || ''}
- Position: ${candidate.position || 'Non spécifiée'}
- Expérience: ${candidate.years_experience || 0} ans
- Localisation: ${candidate.location || 'Non spécifiée'}
- Entreprise: ${candidate.company || 'Non spécifiée'}
- Compétences: ${Array.isArray(candidate.skills) ? candidate.skills.join(', ') : 'Aucune'}
- Formations: ${candidate.education ? JSON.stringify(candidate.education).slice(0, 500) : 'Aucune'}
- Expériences: ${candidate.experiences ? JSON.stringify(candidate.experiences).slice(0, 1000) : 'Aucune'}
- Langues: ${candidate.languages ? JSON.stringify(candidate.languages).slice(0, 300) : 'Aucune'}
- Disponibilité: ${candidate.availability || 'Non spécifiée'}
- Mobilité: ${candidate.mobility || 'Non spécifiée'}
- Objectifs: ${candidate.career_objectives || 'Non spécifiés'}
`;

  let userPrompt = candidateData;

  if (isMatching && jobOffer) {
    userPrompt += `

OFFRE D'EMPLOI:
- Titre: ${jobOffer.title || ''}
- Description: ${jobOffer.description || ''}
- Compétences requises: ${Array.isArray(jobOffer.required_skills) ? jobOffer.required_skills.join(', ') : 'Aucune'}
- Expérience min: ${jobOffer.experience_years_min || 0} ans
- Expérience max: ${jobOffer.experience_years_max || 'Pas de limite'} ans
- Localisation: ${jobOffer.location || 'Non spécifiée'}
- Niveau d'études: ${jobOffer.education_level || 'Non spécifié'}
- Langues: ${Array.isArray(jobOffer.required_languages) ? jobOffer.required_languages.join(', ') : 'Aucune'}
`;
  }

  if (notes && notes.length > 0) {
    userPrompt += `

NOTES D'ENTRETIEN:
${notes.map(note => `- ${note.content}${note.enhanced_content ? ' | ' + note.enhanced_content : ''}`).join('\n')}
`;
  }

  return {
    system: systemPrompt,
    user: userPrompt
  };
}
