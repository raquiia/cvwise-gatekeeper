
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Interface for expected request body
interface RequestBody {
  candidateId: string;
  jobOfferId?: string;
  scoringType: 'completeness' | 'job_matching';
}

interface ScoringBreakdown {
  skills: number;
  experience: number;
  education: number;
  cvStructure?: number;
  profileSummary?: number;
  location?: number;
  cultural?: number;
  languages?: number;
  [key: string]: number | undefined;
}

interface ScoringResult {
  score: number;
  explanation: string;
  breakdown: ScoringBreakdown;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const requestBody: RequestBody = await req.json();
    const { candidateId, jobOfferId, scoringType } = requestBody;
    
    if (!candidateId) {
      return new Response(JSON.stringify({ error: 'Candidate ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (scoringType === 'job_matching' && !jobOfferId) {
      return new Response(JSON.stringify({ error: 'Job offer ID is required for job matching' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Supabase clients
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get candidate data
    const { data: candidateData, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .eq('user_id', user.id)
      .single();
      
    if (candidateError || !candidateData) {
      return new Response(JSON.stringify({ 
        error: 'Failed to retrieve candidate data',
        details: candidateError 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get candidate notes (optional, for additional context)
    const { data: candidateNotes } = await supabaseAdmin
      .from('candidate_notes')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('user_id', user.id);
    
    // For job matching, get job offer data
    let jobOfferData = null;
    if (scoringType === 'job_matching' && jobOfferId) {
      const { data: jobOffer, error: jobError } = await supabaseAdmin
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .eq('user_id', user.id)
        .single();
        
      if (jobError || !jobOffer) {
        return new Response(JSON.stringify({ 
          error: 'Failed to retrieve job offer data',
          details: jobError 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      jobOfferData = jobOffer;
    }
    
    // Calculate the scoring based on type
    let scoringResult: ScoringResult;
    
    if (scoringType === 'completeness') {
      scoringResult = calculateCompletenessScore(candidateData, candidateNotes || []);
    } else {
      if (!jobOfferData) {
        return new Response(JSON.stringify({ error: 'Job offer data is required for job matching' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      scoringResult = calculateJobMatchingScore(candidateData, jobOfferData, candidateNotes || []);
    }
    
    // Save the score in Supabase
    const { data: savedScore, error: saveError } = await supabaseAdmin.rpc(
      'save_ai_candidate_score',
      {
        p_candidate_id: candidateId,
        p_score: scoringResult.score,
        p_explanation: scoringResult.explanation,
        p_job_offer_id: jobOfferId || null,
        p_breakdown: scoringResult.breakdown
      }
    );
    
    if (saveError) {
      console.error('Error saving AI score:', saveError);
      // Continue anyway, as we want to return the calculated score even if saving fails
    }
    
    // Return success response with score
    return new Response(JSON.stringify({
      success: true,
      candidateId,
      jobOfferId: jobOfferId || null,
      score: scoringResult.score,
      explanation: scoringResult.explanation,
      breakdown: scoringResult.breakdown,
      savedToDatabase: !saveError,
      scoringType
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Unexpected error in AI scoring function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Calculate score for profile completeness
 */
function calculateCompletenessScore(
  candidate: any, 
  notes: any[]
): ScoringResult {
  // --------- SCORE 1: INFORMATION DE BASE (20 points) ---------
  let baseInfoScore = 0;
  const baseInfoChecks = [
    candidate.first_name && candidate.last_name ? 4 : 0,  // Nom complet
    candidate.email ? 4 : 0,                              // Email
    candidate.phone ? 3 : 0,                              // Téléphone
    candidate.position ? 5 : 0,                           // Poste actuel
    candidate.location ? 4 : 0,                           // Localisation
  ];
  baseInfoScore = baseInfoChecks.reduce((sum, val) => sum + val, 0);
  
  // --------- SCORE 2: COMPÉTENCES (25 points) ---------
  let skillsScore = 0;
  const skills = candidate.skills || [];
  if (Array.isArray(skills)) {
    if (skills.length >= 10) skillsScore = 25;
    else if (skills.length >= 7) skillsScore = 20;
    else if (skills.length >= 5) skillsScore = 15;
    else if (skills.length >= 3) skillsScore = 10;
    else if (skills.length >= 1) skillsScore = 5;
  }
  
  // --------- SCORE 3: EXPÉRIENCE (25 points) ---------
  let experienceScore = 0;
  const experiences = candidate.experiences || [];
  if (candidate.years_experience) {
    experienceScore += 10; // Points pour avoir renseigné les années d'expérience
  }
  if (Array.isArray(experiences)) {
    // Points pour le nombre d'expériences détaillées
    if (experiences.length >= 3) experienceScore += 15;
    else if (experiences.length >= 2) experienceScore += 10;
    else if (experiences.length >= 1) experienceScore += 5;
  }
  // Plafonner à 25
  experienceScore = Math.min(experienceScore, 25);
  
  // --------- SCORE 4: ÉDUCATION (15 points) ---------
  let educationScore = 0;
  const education = candidate.education || [];
  if (Array.isArray(education)) {
    if (education.length >= 2) educationScore = 15;
    else if (education.length >= 1) educationScore = 10;
  }
  
  // --------- SCORE 5: STRUCTURE ET FORME DU CV (15 points) ---------
  let cvStructureScore = 0;
  const cvStructureFeatures = [
    candidate.languages && Array.isArray(candidate.languages) && candidate.languages.length > 0 ? 3 : 0,
    candidate.availability ? 3 : 0,
    candidate.mobility ? 3 : 0,
    candidate.career_objectives ? 3 : 0,
    candidate.interests ? 3 : 0
  ];
  cvStructureScore = cvStructureFeatures.reduce((sum, val) => sum + val, 0);
  
  // Calculer le score total et les pourcentages par section
  const totalScore = Math.min(
    Math.round(baseInfoScore + skillsScore + experienceScore + educationScore + cvStructureScore),
    100
  );
  
  // Normaliser les scores en pourcentage pour le breakdown
  const totalMaxScore = 100;
  const skillsPercent = Math.round((skillsScore / 25) * 100);
  const experiencePercent = Math.round((experienceScore / 25) * 100);
  const educationPercent = Math.round((educationScore / 15) * 100);
  const cvStructurePercent = Math.round((cvStructureScore / 15) * 100);
  const profileSummaryPercent = Math.round((baseInfoScore / 20) * 100);
  
  let explanation = 'Score de complétude du profil calculé automatiquement ';
  explanation += `(Infos de base: ${baseInfoScore}/20, Compétences: ${skillsScore}/25, `;
  explanation += `Expérience: ${experienceScore}/25, Éducation: ${educationScore}/15, `;
  explanation += `Structure du CV: ${cvStructureScore}/15)`;
  
  return {
    score: totalScore,
    explanation,
    breakdown: {
      skills: skillsPercent,
      experience: experiencePercent,
      education: educationPercent,
      cvStructure: cvStructurePercent,
      profileSummary: profileSummaryPercent
    }
  };
}

/**
 * Calculate job matching score
 */
function calculateJobMatchingScore(
  candidate: any, 
  jobOffer: any, 
  notes: any[]
): ScoringResult {
  // --------- SCORE 1: COMPÉTENCES (40 points) ---------
  let skillsScore = 0;
  const candidateSkills = new Set(
    (candidate.skills || [])
      .map((s: any) => typeof s === 'string' ? s.toLowerCase() : 
           (typeof s === 'object' && s !== null && s.name ? s.name.toLowerCase() : null))
      .filter(Boolean)
  );
  
  const requiredSkills = new Set(
    (jobOffer.required_skills || [])
      .map((s: any) => typeof s === 'string' ? s.toLowerCase() : 
           (typeof s === 'object' && s !== null && s.name ? s.name.toLowerCase() : null))
      .filter(Boolean)
  );
  
  const preferredSkills = new Set(
    (jobOffer.preferred_skills || [])
      .map((s: any) => typeof s === 'string' ? s.toLowerCase() : 
           (typeof s === 'object' && s !== null && s.name ? s.name.toLowerCase() : null))
      .filter(Boolean)
  );
  
  // Calculer le score des compétences requises (30 points max)
  let matchedRequiredSkills = 0;
  requiredSkills.forEach(skill => {
    if (candidateSkills.has(skill)) matchedRequiredSkills++;
  });
  
  const requiredSkillsScore = requiredSkills.size > 0
    ? Math.round((matchedRequiredSkills / requiredSkills.size) * 30)
    : 15; // Score moyen si aucune compétence requise
  
  // Calculer le score des compétences préférées (10 points max)
  let matchedPreferredSkills = 0;
  preferredSkills.forEach(skill => {
    if (candidateSkills.has(skill)) matchedPreferredSkills++;
  });
  
  const preferredSkillsScore = preferredSkills.size > 0
    ? Math.round((matchedPreferredSkills / preferredSkills.size) * 10)
    : 5; // Score moyen si aucune compétence préférée
  
  skillsScore = requiredSkillsScore + preferredSkillsScore;
  
  // --------- SCORE 2: EXPÉRIENCE (30 points) ---------
  let experienceScore = 0;
  const candidateYears = candidate.years_experience || 0;
  const minYears = jobOffer.experience_years_min || 0;
  const maxYears = jobOffer.experience_years_max || minYears + 5;
  
  if (candidateYears >= minYears) {
    // Candidat atteint le minimum requis
    if (maxYears === minYears || candidateYears <= maxYears) {
      // Correspondance parfaite avec la fourchette
      experienceScore = 30;
    } else if (candidateYears <= maxYears + 5) {
      // Légèrement au-dessus de la fourchette
      experienceScore = 25;
    } else {
      // Beaucoup trop d'expérience
      experienceScore = 20;
    }
  } else if (candidateYears >= minYears * 0.75) {
    // Presque le minimum requis
    experienceScore = 15;
  } else if (candidateYears >= minYears * 0.5) {
    // Moitié du minimum requis
    experienceScore = 10;
  } else {
    // Trop peu d'expérience
    experienceScore = 5;
  }
  
  // --------- SCORE 3: ÉDUCATION (20 points) ---------
  let educationScore = 0;
  // Par défaut, attribuer un score moyen car l'éducation est difficile à évaluer
  // sans analyse sémantique avancée
  educationScore = 10;
  
  // --------- SCORE 4: LOCALISATION (10 points) ---------
  let locationScore = 0;
  const candidateLocation = candidate.location?.toLowerCase() || '';
  const jobLocation = jobOffer.location?.toLowerCase() || '';
  
  if (candidateLocation && jobLocation) {
    if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      locationScore = 10; // Même ville ou région
    } else {
      // Vérifier la mobilité du candidat
      if (candidate.mobility && candidate.mobility.toLowerCase().includes('oui')) {
        locationScore = 5; // Candidat mobile
      } else {
        locationScore = 0; // Pas mobile et localisations différentes
      }
    }
  } else {
    locationScore = 5; // Informations manquantes, score moyen
  }
  
  // --------- SCORE 5: LANGUES (0 bonus points) ---------
  // Bonus pour les langues si le job en spécifie
  let languagesScore = 0;
  
  // Calculer le score total (max 100)
  const totalScore = Math.min(
    Math.round(skillsScore + experienceScore + educationScore + locationScore + languagesScore),
    100
  );
  
  // Générer l'explication du score
  let explanation = `Match de ${totalScore}% avec l'offre "${jobOffer.title || 'Sans titre'}". `;
  explanation += `Compétences: ${matchedRequiredSkills}/${requiredSkills.size} requises, ${matchedPreferredSkills}/${preferredSkills.size} préférées. `;
  explanation += `Expérience: ${candidate.years_experience || 0} ans (requis: ${minYears}-${maxYears}). `;
  if (candidateLocation && jobLocation) {
    explanation += `Localisation: ${locationScore === 10 ? 'Correspondance' : 'Différente'}.`;
  }
  
  return {
    score: totalScore,
    explanation,
    breakdown: {
      skills: skillsScore / 0.4,
      experience: experienceScore / 0.3,
      education: educationScore / 0.2,
      location: locationScore / 0.1,
      languages: languagesScore || 0
    }
  };
}
