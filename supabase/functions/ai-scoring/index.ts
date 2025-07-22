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
 * Calculate job matching score - COMPLETELY REVISED ALGORITHM
 */
function calculateJobMatchingScore(
  candidate: any, 
  jobOffer: any, 
  notes: any[]
): ScoringResult {
  console.log(`🔍 Calculating match for candidate ${candidate.first_name} ${candidate.last_name} vs job "${jobOffer.title}"`);
  
  // --------- PHASE 1: COMPÉTENCES (75% du score - CRITIQUE) ---------
  let skillsScore = 0;
  const candidateSkills = new Set(
    (candidate.skills || [])
      .map((s: any) => typeof s === 'string' ? s.toLowerCase().trim() : 
           (typeof s === 'object' && s !== null && s.name ? s.name.toLowerCase().trim() : null))
      .filter(Boolean)
  );
  
  const requiredSkills = new Set(
    (jobOffer.required_skills || [])
      .map((s: any) => typeof s === 'string' ? s.toLowerCase().trim() : 
           (typeof s === 'object' && s !== null && s.name ? s.name.toLowerCase().trim() : null))
      .filter(Boolean)
  );
  
  const preferredSkills = new Set(
    (jobOffer.preferred_skills || [])
      .map((s: any) => typeof s === 'string' ? s.toLowerCase().trim() : 
           (typeof s === 'object' && s !== null && s.name ? s.name.toLowerCase().trim() : null))
      .filter(Boolean)
  );
  
  console.log(`👤 Candidate skills:`, Array.from(candidateSkills));
  console.log(`🎯 Required skills:`, Array.from(requiredSkills));
  console.log(`⭐ Preferred skills:`, Array.from(preferredSkills));
  
  // Calculer le score des compétences requises (60 points max)
  let matchedRequiredSkills = 0;
  let partialMatchedRequired = 0;
  
  requiredSkills.forEach(reqSkill => {
    let hasExactMatch = false;
    let hasPartialMatch = false;
    
    candidateSkills.forEach(candSkill => {
      if (candSkill === reqSkill) {
        hasExactMatch = true;
      } else if (isSkillRelated(candSkill, reqSkill)) {
        hasPartialMatch = true;
      }
    });
    
    if (hasExactMatch) {
      matchedRequiredSkills++;
    } else if (hasPartialMatch) {
      partialMatchedRequired++;
    }
  });
  
  // Score des compétences requises
  const requiredSkillsScore = requiredSkills.size > 0
    ? Math.round((matchedRequiredSkills * 60 + partialMatchedRequired * 30) / requiredSkills.size)
    : 30; // Score moyen si aucune compétence requise
  
  // Calculer le score des compétences préférées (15 points max)
  let matchedPreferredSkills = 0;
  preferredSkills.forEach(prefSkill => {
    if (candidateSkills.has(prefSkill) || 
        Array.from(candidateSkills).some(candSkill => isSkillRelated(candSkill, prefSkill))) {
      matchedPreferredSkills++;
    }
  });
  
  const preferredSkillsScore = preferredSkills.size > 0
    ? Math.round((matchedPreferredSkills / preferredSkills.size) * 15)
    : 0;
  
  skillsScore = requiredSkillsScore + preferredSkillsScore;
  
  // SEUIL CRITIQUE: Si moins de 30% des compétences requises, score maximum de 25
  const skillsMatchPercentage = requiredSkills.size > 0 ? 
    (matchedRequiredSkills + partialMatchedRequired * 0.5) / requiredSkills.size : 0.5;
  
  if (skillsMatchPercentage < 0.3) {
    skillsScore = Math.min(skillsScore, 25);
    console.log(`⚠️ Critical skills threshold not met: ${Math.round(skillsMatchPercentage * 100)}%`);
  }
  
  console.log(`🎯 Skills analysis: ${matchedRequiredSkills}/${requiredSkills.size} exact + ${partialMatchedRequired} partial required, ${matchedPreferredSkills}/${preferredSkills.size} preferred`);
  console.log(`📊 Skills score: ${skillsScore}/75`);
  
  // --------- PHASE 2: EXPÉRIENCE PERTINENTE (15% du score) ---------
  let experienceScore = 0;
  const candidateYears = candidate.years_experience || 0;
  const minYears = jobOffer.experience_years_min || 0;
  const maxYears = jobOffer.experience_years_max || minYears + 5;
  
  // Analyser la pertinence de l'expérience
  const candidateExperiences = candidate.experiences || [];
  const jobTitle = jobOffer.title?.toLowerCase() || '';
  const jobDescription = jobOffer.description?.toLowerCase() || '';
  
  let relevantExperienceYears = 0;
  let hasRelevantExperience = false;
  
  if (Array.isArray(candidateExperiences)) {
    candidateExperiences.forEach((exp: any) => {
      const expTitle = (exp.title || exp.position || '').toLowerCase();
      const expDescription = (exp.description || '').toLowerCase();
      const expCompany = (exp.company || '').toLowerCase();
      
      // Vérifier la pertinence de l'expérience
      if (isExperienceRelevant(expTitle, expDescription, jobTitle, jobDescription, requiredSkills)) {
        hasRelevantExperience = true;
        const expDuration = calculateExperienceDuration(exp);
        relevantExperienceYears += expDuration;
      }
    });
  }
  
  // Score basé sur l'expérience pertinente
  if (hasRelevantExperience && relevantExperienceYears >= minYears) {
    if (relevantExperienceYears <= maxYears) {
      experienceScore = 15; // Expérience parfaite
    } else if (relevantExperienceYears <= maxYears + 3) {
      experienceScore = 12; // Légèrement surqualifié
    } else {
      experienceScore = 8; // Très surqualifié
    }
  } else if (hasRelevantExperience && relevantExperienceYears >= minYears * 0.7) {
    experienceScore = 10; // Presque suffisant
  } else if (candidateYears >= minYears && minYears > 0) {
    experienceScore = 6; // Expérience générale mais pas pertinente
  } else if (candidateYears > 0) {
    experienceScore = 3; // Peu d'expérience
  } else {
    experienceScore = 0; // Aucune expérience
  }
  
  console.log(`💼 Experience analysis: ${relevantExperienceYears}y relevant vs ${minYears}-${maxYears}y required`);
  console.log(`📊 Experience score: ${experienceScore}/15`);
  
  // --------- PHASE 3: ÉDUCATION PERTINENTE (5% du score) ---------
  let educationScore = 0;
  const candidateEducation = candidate.education || [];
  const requiredEducation = jobOffer.education_level || '';
  
  if (Array.isArray(candidateEducation) && candidateEducation.length > 0) {
    let hasRelevantEducation = false;
    
    candidateEducation.forEach((edu: any) => {
      const degree = (edu.degree || '').toLowerCase();
      const field = (edu.field || edu.field_of_study || '').toLowerCase();
      
      if (isEducationRelevant(degree, field, jobTitle, jobDescription, requiredSkills)) {
        hasRelevantEducation = true;
      }
    });
    
    if (hasRelevantEducation) {
      educationScore = 5;
    } else {
      educationScore = 2; // Éducation mais pas pertinente
    }
  } else {
    educationScore = 1; // Aucune éducation renseignée
  }
  
  console.log(`🎓 Education score: ${educationScore}/5`);
  
  // --------- PHASE 4: LOCALISATION (5% du score) ---------
  let locationScore = 0;
  const candidateLocation = candidate.location?.toLowerCase() || '';
  const jobLocation = jobOffer.location?.toLowerCase() || '';
  
  if (candidateLocation && jobLocation) {
    if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      locationScore = 5; // Même localisation
    } else if (candidate.mobility && candidate.mobility.toLowerCase().includes('oui')) {
      locationScore = 3; // Candidat mobile
    } else {
      locationScore = 1; // Localisations différentes, pas mobile
    }
  } else {
    locationScore = 2; // Informations manquantes
  }
  
  console.log(`📍 Location score: ${locationScore}/5`);
  
  // --------- CALCUL FINAL ---------
  // Pondération: Compétences 75%, Expérience 15%, Éducation 5%, Localisation 5%
  const totalScore = Math.min(
    Math.round(skillsScore * 0.75 + experienceScore * 0.15 + educationScore * 0.05 + locationScore * 0.05),
    100
  );
  
  // Générer l'explication détaillée
  let explanation = `Match ${totalScore}% avec "${jobOffer.title}" - `;
  explanation += `Compétences: ${matchedRequiredSkills}/${requiredSkills.size} requises (${Math.round(skillsMatchPercentage * 100)}%), `;
  explanation += `Exp. pertinente: ${relevantExperienceYears}/${minYears}+ ans, `;
  explanation += `Éducation: ${educationScore > 3 ? 'pertinente' : 'limitée'}, `;
  explanation += `Localisation: ${locationScore > 3 ? 'compatible' : 'à vérifier'}`;
  
  console.log(`🏆 Final score: ${totalScore}% - ${explanation}`);
  
  return {
    score: totalScore,
    explanation,
    breakdown: {
      skills: Math.round(skillsScore / 0.75), // Reconvertir en pourcentage
      experience: Math.round(experienceScore / 0.15),
      education: Math.round(educationScore / 0.05),
      location: Math.round(locationScore / 0.05),
      languages: 0
    }
  };
}

/**
 * Vérifier si deux compétences sont liées
 */
function isSkillRelated(skill1: string, skill2: string): boolean {
  const s1 = skill1.toLowerCase();
  const s2 = skill2.toLowerCase();
  
  // Mapping des compétences similaires étendu
  const skillsMap: Record<string, string[]> = {
    'javascript': ['js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
    'typescript': ['ts', 'javascript', 'js'],
    'react': ['reactjs', 'react.js', 'javascript', 'frontend'],
    'vue': ['vuejs', 'vue.js', 'javascript', 'frontend'],
    'angular': ['angularjs', 'javascript', 'frontend'],
    'python': ['py', 'django', 'flask', 'fastapi'],
    'java': ['spring', 'springboot', 'hibernate'],
    'csharp': ['c#', '.net', 'dotnet', 'asp.net'],
    'sql': ['mysql', 'postgresql', 'oracle', 'mssql'],
    'nosql': ['mongodb', 'cassandra', 'redis'],
    'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
    'azure': ['microsoft azure', 'azure cloud'],
    'docker': ['containerization', 'kubernetes'],
    'kubernetes': ['k8s', 'docker', 'orchestration'],
    'devops': ['ci/cd', 'jenkins', 'gitlab', 'automation'],
    'machine learning': ['ml', 'ai', 'data science', 'tensorflow', 'pytorch'],
    'data science': ['data analysis', 'statistics', 'python', 'r'],
    'project management': ['gestion de projet', 'pmp', 'agile', 'scrum'],
    'agile': ['scrum', 'kanban', 'project management'],
    'scrum': ['agile', 'project management', 'scrum master']
  };
  
  // Vérification des correspondances
  for (const [key, variants] of Object.entries(skillsMap)) {
    if ((s1.includes(key) && variants.some(v => s2.includes(v))) ||
        (s2.includes(key) && variants.some(v => s1.includes(v)))) {
      return true;
    }
  }
  
  // Vérification de similarité basique
  return s1.includes(s2) || s2.includes(s1);
}

/**
 * Vérifier si l'expérience est pertinente pour le poste
 */
function isExperienceRelevant(
  expTitle: string, 
  expDescription: string, 
  jobTitle: string, 
  jobDescription: string,
  requiredSkills: Set<string>
): boolean {
  // Vérifier les titres similaires
  const titleKeywords = ['ingénieur', 'engineer', 'développeur', 'developer', 'chef de projet', 'project manager', 
                         'consultant', 'analyste', 'analyst', 'lead', 'senior', 'junior'];
  
  const expTitleMatch = titleKeywords.some(keyword => 
    expTitle.includes(keyword) && jobTitle.includes(keyword)
  );
  
  // Vérifier les compétences dans la description d'expérience
  const skillsInDescription = Array.from(requiredSkills).some(skill => 
    expDescription.includes(skill) || expTitle.includes(skill)
  );
  
  // Vérifier les domaines similaires
  const domains = ['informatique', 'it', 'software', 'logiciel', 'web', 'mobile', 'data', 'cloud'];
  const domainMatch = domains.some(domain => 
    (expDescription.includes(domain) || expTitle.includes(domain)) &&
    (jobDescription.includes(domain) || jobTitle.includes(domain))
  );
  
  return expTitleMatch || skillsInDescription || domainMatch;
}

/**
 * Calculer la durée d'une expérience
 */
function calculateExperienceDuration(exp: any): number {
  if (exp.duration_years) return exp.duration_years;
  if (exp.start_date && exp.end_date) {
    const start = new Date(exp.start_date);
    const end = new Date(exp.end_date);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }
  return 1; // Durée par défaut si pas d'info
}

/**
 * Vérifier si l'éducation est pertinente
 */
function isEducationRelevant(
  degree: string, 
  field: string, 
  jobTitle: string, 
  jobDescription: string,
  requiredSkills: Set<string>
): boolean {
  const techFields = ['informatique', 'computer science', 'ingénieur', 'engineering', 'software', 
                     'mathematics', 'mathématiques', 'data', 'statistics', 'statistiques'];
  
  const managementFields = ['management', 'gestion', 'business', 'administration', 'mba'];
  
  const isTechJob = jobTitle.includes('ingénieur') || jobTitle.includes('développeur') || 
                   jobTitle.includes('engineer') || jobTitle.includes('developer') ||
                   Array.from(requiredSkills).some(skill => 
                     ['javascript', 'python', 'java', 'react', 'sql'].includes(skill)
                   );
  
  const isManagementJob = jobTitle.includes('manager') || jobTitle.includes('chef') || 
                         jobTitle.includes('directeur') || jobTitle.includes('lead');
  
  if (isTechJob && techFields.some(tf => field.includes(tf) || degree.includes(tf))) {
    return true;
  }
  
  if (isManagementJob && managementFields.some(mf => field.includes(mf) || degree.includes(mf))) {
    return true;
  }
  
  return false;
}
