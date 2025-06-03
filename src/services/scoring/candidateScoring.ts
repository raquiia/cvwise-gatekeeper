import type { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray, ensureArray } from '@/utils/candidateUtils';
import { persistentScoringService } from './persistentScoringService';

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  profileCompleteness: number;
  overall: number;
  details: {
    skillsCount: number;
    experienceYears: number;
    educationLevel: string;
    completenessPercentage: number;
  };
}

/**
 * Calcule un score intelligent pour un candidat basé sur plusieurs critères
 */
export const calculateCandidateScore = (candidate: CandidateData): ScoreBreakdown => {
  // This function is now primarily used as a fallback
  // The main scoring is done by the database functions
  
  let skillsScore = 0;
  let experienceScore = 0;
  let educationScore = 50; // Default
  let completenessScore = 0;

  // Calculate skills score based on number of skills
  const skillsArray = Array.isArray(candidate.skills) ? candidate.skills : [];
  const skillsCount = skillsArray.length;
  
  if (skillsCount === 0) {
    skillsScore = 0;
  } else if (skillsCount <= 3) {
    skillsScore = 40;
  } else if (skillsCount <= 6) {
    skillsScore = 60;
  } else if (skillsCount <= 10) {
    skillsScore = 80;
  } else {
    skillsScore = 95;
  }

  // Calculate experience score
  const yearsExp = candidate.years_experience || 0;
  if (yearsExp === 0) {
    experienceScore = 20;
  } else if (yearsExp <= 2) {
    experienceScore = 50;
  } else if (yearsExp <= 5) {
    experienceScore = 75;
  } else if (yearsExp <= 10) {
    experienceScore = 90;
  } else if (yearsExp <= 15) {
    experienceScore = 95;
  } else {
    experienceScore = 85;
  }

  // Calculate profile completeness
  let filledFields = 0;
  const totalFields = 15;

  if (candidate.first_name?.trim()) filledFields++;
  if (candidate.last_name?.trim()) filledFields++;
  if (candidate.email?.trim()) filledFields++;
  if (candidate.phone?.trim()) filledFields++;
  if (candidate.position?.trim()) filledFields++;
  if (candidate.location?.trim()) filledFields++;
  if (candidate.company?.trim()) filledFields++;
  if (skillsArray.length > 0) filledFields++;
  if (Array.isArray(candidate.education) && candidate.education.length > 0) filledFields++;
  if (Array.isArray(candidate.experiences) && candidate.experiences.length > 0) filledFields++;
  if (candidate.years_experience !== null && candidate.years_experience !== undefined) filledFields++;
  if (candidate.availability?.trim()) filledFields++;
  if (candidate.salary_expectations?.trim()) filledFields++;
  if (candidate.contract_type?.trim()) filledFields++;
  if (candidate.remote_preference?.trim()) filledFields++;

  completenessScore = Math.round((filledFields / totalFields) * 80); // Max 80 points

  // Calculate overall score with weights
  const overallScore = Math.round(
    (skillsScore * 0.4) +
    (experienceScore * 0.3) +
    (educationScore * 0.2) +
    (completenessScore * 0.1)
  );

  const educationArray = Array.isArray(candidate.education) ? candidate.education : [];

  return {
    skills: skillsScore,
    experience: experienceScore,
    education: educationScore,
    profileCompleteness: completenessScore,
    overall: overallScore,
    details: {
      skillsCount,
      experienceYears: yearsExp,
      educationLevel: educationArray.length > 0 ? 
        (educationArray[0] as any)?.degree || 'Non spécifié' : 'Non spécifié',
      completenessPercentage: completenessScore
    }
  };
};

/**
 * Obtient une évaluation textuelle du score
 */
export const getScoreEvaluation = (score: number): { 
  label: string; 
  color: string; 
  bgColor: string;
} => {
  if (score >= 85) {
    return { 
      label: 'Excellent candidat', 
      color: 'text-emerald-800', 
      bgColor: 'bg-emerald-100' 
    };
  } else if (score >= 70) {
    return { 
      label: 'Très bon candidat', 
      color: 'text-green-800', 
      bgColor: 'bg-green-100' 
    };
  } else if (score >= 55) {
    return { 
      label: 'Bon candidat', 
      color: 'text-amber-800', 
      bgColor: 'bg-amber-100' 
    };
  } else if (score >= 40) {
    return { 
      label: 'Candidat à potentiel', 
      color: 'text-orange-800', 
      bgColor: 'bg-orange-100' 
    };
  } else {
    return { 
      label: 'Candidat à développer', 
      color: 'text-red-800', 
      bgColor: 'bg-red-100' 
    };
  }
};

/**
 * Calcule un score de correspondance contextuel avec une offre d'emploi
 */
export const calculateJobMatchScore = (
  candidate: CandidateData, 
  jobOffer: any
): ScoreBreakdown & { matchContext: string } => {
  const baseScore = calculateCandidateScore(candidate);
  
  // Si pas d'offre active, retourner le score de base
  if (!jobOffer) {
    return { ...baseScore, matchContext: 'Score général' };
  }

  // Ajustements contextuels basés sur l'offre
  const candidateSkills = ensureStringArray(candidate.skills);
  const jobSkills = ensureStringArray(jobOffer.required_skills);
  
  // Bonus/malus pour la correspondance des compétences
  const matchedSkills = candidateSkills.filter(skill =>
    jobSkills.some(jobSkill => 
      jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );

  const skillMatchRatio = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0;
  const skillsAdjustment = (skillMatchRatio - 0.5) * 20; // +/- 10 points max

  // Ajustement pour l'expérience
  const candidateExp = candidate.years_experience || 0;
  const minExp = jobOffer.experience_years_min || 0;
  const maxExp = jobOffer.experience_years_max || minExp + 5;
  
  let experienceAdjustment = 0;
  if (candidateExp >= minExp && candidateExp <= maxExp) {
    experienceAdjustment = 5; // Bonus parfait match
  } else if (candidateExp < minExp) {
    experienceAdjustment = -10; // Pénalité sous-expérience
  } else if (candidateExp > maxExp + 5) {
    experienceAdjustment = -5; // Léger malus surqualification
  }

  const adjustedOverall = Math.max(0, Math.min(100, 
    baseScore.overall + skillsAdjustment + experienceAdjustment
  ));

  return {
    ...baseScore,
    overall: Math.round(adjustedOverall),
    matchContext: `Score de correspondance avec "${jobOffer.title}"`
  };
};

// New function to get persistent score
export const getPersistentCandidateScore = async (candidateId: string): Promise<ScoreBreakdown | null> => {
  return await persistentScoringService.getCandidateGeneralScore(candidateId);
};

// New function to get job-specific persistent score
export const getPersistentJobScore = async (candidateId: string, jobOfferId: string): Promise<ScoreBreakdown | null> => {
  return await persistentScoringService.getCandidateJobScore(candidateId, jobOfferId);
};
