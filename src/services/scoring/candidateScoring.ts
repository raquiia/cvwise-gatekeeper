
import type { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray, ensureArray } from '@/utils/candidateUtils';

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
  const skillsScore = calculateSkillsScore(candidate);
  const experienceScore = calculateExperienceScore(candidate);
  const educationScore = calculateEducationScore(candidate);
  const completenessScore = calculateProfileCompleteness(candidate);

  // Pondération des scores (total = 100%)
  const weights = {
    skills: 0.4,      // 40%
    experience: 0.3,  // 30%
    education: 0.2,   // 20%
    completeness: 0.1 // 10%
  };

  const overall = Math.round(
    (skillsScore.score * weights.skills) +
    (experienceScore.score * weights.experience) +
    (educationScore.score * weights.education) +
    (completenessScore.score * weights.completeness)
  );

  return {
    skills: skillsScore.score,
    experience: experienceScore.score,
    education: educationScore.score,
    profileCompleteness: completenessScore.score,
    overall,
    details: {
      skillsCount: skillsScore.count,
      experienceYears: experienceScore.years,
      educationLevel: educationScore.level,
      completenessPercentage: completenessScore.percentage
    }
  };
};

/**
 * Score basé sur les compétences (40% du score total)
 */
const calculateSkillsScore = (candidate: CandidateData) => {
  const skills = ensureStringArray(candidate.skills);
  const skillsCount = skills.length;

  // Score basé sur le nombre et la qualité des compétences
  let score = 0;
  
  if (skillsCount === 0) {
    score = 0;
  } else if (skillsCount <= 3) {
    score = 40;
  } else if (skillsCount <= 6) {
    score = 60;
  } else if (skillsCount <= 10) {
    score = 80;
  } else {
    score = 95;
  }

  // Bonus pour des compétences techniques populaires
  const technicalSkills = skills.filter(skill => 
    /javascript|python|react|vue|angular|node|java|sql|docker|aws|azure|kubernetes/i.test(skill)
  ).length;

  if (technicalSkills > 0) {
    score = Math.min(100, score + (technicalSkills * 5));
  }

  return { score: Math.round(score), count: skillsCount };
};

/**
 * Score basé sur l'expérience (30% du score total)
 */
const calculateExperienceScore = (candidate: CandidateData) => {
  const experience = candidate.years_experience || 0;
  let score = 0;

  // Courbe de valeur de l'expérience
  if (experience === 0) {
    score = 20; // Junior peut être intéressant
  } else if (experience <= 2) {
    score = 50;
  } else if (experience <= 5) {
    score = 75;
  } else if (experience <= 10) {
    score = 90;
  } else if (experience <= 15) {
    score = 95;
  } else {
    score = 85; // Très expérimenté mais peut être surqualifié
  }

  return { score: Math.round(score), years: experience };
};

/**
 * Score basé sur l'éducation (20% du score total)
 */
const calculateEducationScore = (candidate: CandidateData) => {
  const education = ensureArray(candidate.education);
  let score = 50; // Score de base
  let highestLevel = 'Non spécifié';

  if (education.length === 0) {
    return { score: 30, level: highestLevel };
  }

  // Extraction du niveau d'éducation le plus élevé
  const educationLevels: Record<string, number> = {
    'bac': 40,
    'bac+2': 55, 
    'dut': 55, 
    'bts': 55,
    'licence': 65, 
    'bac+3': 65,
    'master': 85, 
    'bac+5': 85, 
    'ingénieur': 90,
    'doctorat': 95, 
    'phd': 95, 
    'bac+8': 95
  };

  let maxScore = 50;
  
  education.forEach((edu: any) => {
    let eduText = '';
    if (typeof edu === 'string') {
      eduText = edu;
    } else if (edu && typeof edu === 'object') {
      eduText = edu.degree || edu.diploma || edu.level || '';
    }

    for (const [level, levelScore] of Object.entries(educationLevels)) {
      if (eduText.toLowerCase().includes(level.toLowerCase()) && levelScore > maxScore) {
        maxScore = levelScore;
        highestLevel = level;
      }
    }
  });

  return { score: Math.round(maxScore), level: highestLevel };
};

/**
 * Score basé sur la complétude du profil (10% du score total)
 */
const calculateProfileCompleteness = (candidate: CandidateData) => {
  const fields = [
    candidate.first_name,
    candidate.last_name,
    candidate.email,
    candidate.phone,
    candidate.position,
    candidate.location,
    candidate.company,
    candidate.skills && candidate.skills.length > 0 ? 'skills' : null,
    candidate.education && candidate.education.length > 0 ? 'education' : null,
    candidate.experiences && candidate.experiences.length > 0 ? 'experiences' : null,
    candidate.years_experience,
    candidate.availability,
    candidate.salary_expectations,
    candidate.contract_type,
    candidate.remote_preference
  ];

  const filledFields = fields.filter(field => 
    field !== null && field !== undefined && field !== ''
  ).length;

  const percentage = Math.round((filledFields / fields.length) * 100);
  const score = Math.round(percentage * 0.8); // Max 80 points pour la complétude

  return { score, percentage };
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
