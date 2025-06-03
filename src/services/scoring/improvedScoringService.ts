
import type { CandidateData } from '@/services/data/candidateService';
import type { JobOffer } from '@/services/data/job-offers/types';
import { ensureStringArray, ensureArray } from '@/utils/candidateUtils';

export interface ImprovedScoreBreakdown {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  profileCompleteness: number;
  isJobSpecific: boolean;
  details: {
    skillsMatched: string[];
    skillsMissing: string[];
    skillsCount: number;
    experienceYears: number;
    experienceBreakdown: {
      total: number;
      professional: number;
      internships: number;
      alternance: number;
    };
    educationLevel: string;
    educationScore: number;
    certifications: string[];
    completenessPercentage: number;
  };
  matchContext?: string;
}

/**
 * Calcule l'expérience réelle à partir des données d'expérience
 */
function calculateRealExperience(experiences: any[]): {
  total: number;
  professional: number;
  internships: number;
  alternance: number;
} {
  if (!Array.isArray(experiences) || experiences.length === 0) {
    return { total: 0, professional: 0, internships: 0, alternance: 0 };
  }

  let totalMonths = 0;
  let professionalMonths = 0;
  let internshipMonths = 0;
  let alternanceMonths = 0;

  for (const exp of experiences) {
    if (!exp || typeof exp !== 'object') continue;

    const startDate = exp.start_date || exp.startDate;
    const endDate = exp.end_date || exp.endDate || new Date().toISOString();
    const title = (exp.title || exp.position || '').toLowerCase();
    const description = (exp.description || '').toLowerCase();

    if (!startDate) continue;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const months = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

      // Classifier le type d'expérience
      const isInternship = title.includes('stage') || title.includes('intern') || 
                          description.includes('stage') || description.includes('stagiaire');
      const isAlternance = title.includes('alternance') || title.includes('apprenti') || 
                          description.includes('alternance') || description.includes('apprentissage');

      totalMonths += months;

      if (isInternship) {
        internshipMonths += months;
      } else if (isAlternance) {
        alternanceMonths += months;
      } else {
        professionalMonths += months;
      }
    } catch (error) {
      console.warn('Error parsing experience dates:', error);
    }
  }

  return {
    total: Math.round((totalMonths / 12) * 10) / 10,
    professional: Math.round((professionalMonths / 12) * 10) / 10,
    internships: Math.round((internshipMonths / 12) * 10) / 10,
    alternance: Math.round((alternanceMonths / 12) * 10) / 10
  };
}

/**
 * Calcule le score d'éducation basé sur une hiérarchie claire
 */
function calculateEducationScore(education: any[], certifications: any[]): {
  score: number;
  level: string;
  certificationNames: string[];
} {
  const educationArray = ensureArray(education);
  const certificationsArray = ensureArray(certifications);

  // Hiérarchie des niveaux d'éducation
  const educationLevels: Record<string, number> = {
    'bac': 30,
    'baccalauréat': 30,
    'bts': 45,
    'dut': 45,
    'bac+2': 45,
    'licence': 60,
    'bachelor': 60,
    'bac+3': 60,
    'master': 85,
    'mba': 85,
    'ingénieur': 85,
    'bac+5': 85,
    'doctorat': 95,
    'phd': 95,
    'docteur': 95,
    'bac+8': 95
  };

  let highestScore = 0;
  let highestLevel = 'Non spécifié';

  // Analyser chaque formation
  for (const edu of educationArray) {
    if (!edu || typeof edu !== 'object') continue;

    const degree = (edu.degree || edu.diploma || edu.level || '').toLowerCase();
    
    for (const [level, score] of Object.entries(educationLevels)) {
      if (degree.includes(level)) {
        if (score > highestScore) {
          highestScore = score;
          highestLevel = edu.degree || edu.diploma || edu.level || level;
        }
      }
    }
  }

  // Bonus pour les certifications (max 15 points)
  const certificationNames = certificationsArray
    .map(cert => {
      if (typeof cert === 'string') return cert;
      return cert?.name || cert?.title || '';
    })
    .filter(Boolean);

  const certificationBonus = Math.min(15, certificationNames.length * 3);

  return {
    score: Math.min(100, highestScore + certificationBonus),
    level: highestLevel,
    certificationNames
  };
}

/**
 * Calcule le score de compétences pour le matching d'offre
 */
function calculateSkillsMatchScore(
  candidateSkills: string[], 
  requiredSkills: string[]
): {
  score: number;
  matched: string[];
  missing: string[];
} {
  if (requiredSkills.length === 0) {
    return { score: candidateSkills.length > 0 ? 80 : 50, matched: [], missing: [] };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const requiredSkill of requiredSkills) {
    const isMatched = candidateSkills.some(candidateSkill => 
      candidateSkill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
      requiredSkill.toLowerCase().includes(candidateSkill.toLowerCase())
    );

    if (isMatched) {
      matched.push(requiredSkill);
    } else {
      missing.push(requiredSkill);
    }
  }

  const matchPercentage = (matched.length / requiredSkills.length) * 100;
  
  // Score basé sur le pourcentage de compétences matchées
  let score = matchPercentage;
  
  // Bonus pour avoir des compétences supplémentaires pertinentes
  const additionalRelevantSkills = candidateSkills.filter(skill => 
    !requiredSkills.some(reqSkill => 
      skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  const additionalBonus = Math.min(10, additionalRelevantSkills.length * 2);
  score = Math.min(100, score + additionalBonus);

  return { score: Math.round(score), matched, missing };
}

/**
 * Calcule le score d'expérience pour le matching d'offre
 */
function calculateExperienceMatchScore(
  experienceBreakdown: { total: number; professional: number; internships: number; alternance: number },
  minRequired: number = 0,
  maxRequired?: number
): number {
  // Calculer l'expérience pondérée (stages et alternance comptent moins)
  const weightedExperience = 
    experienceBreakdown.professional + 
    (experienceBreakdown.alternance * 0.8) + 
    (experienceBreakdown.internships * 0.3);

  if (minRequired === 0) {
    // Si pas d'expérience requise, scorer sur la présence d'expérience
    return Math.min(100, 50 + (weightedExperience * 10));
  }

  if (weightedExperience >= minRequired) {
    if (!maxRequired || weightedExperience <= maxRequired) {
      return 100; // Parfait match
    } else {
      // Surqualifié mais acceptable
      const overQualification = weightedExperience - maxRequired;
      return Math.max(70, 100 - (overQualification * 5));
    }
  } else {
    // Sous-qualifié
    const ratio = weightedExperience / minRequired;
    return Math.round(ratio * 80); // Max 80 points si sous-qualifié
  }
}

/**
 * Calcule le score général d'un candidat (sans contexte d'offre)
 */
export function calculateGeneralCandidateScore(candidate: CandidateData): ImprovedScoreBreakdown {
  const skills = ensureStringArray(candidate.skills);
  const experiences = ensureArray(candidate.experiences);
  const education = ensureArray(candidate.education);
  const certifications = ensureArray(candidate.certifications);

  // Calcul de l'expérience réelle
  const experienceBreakdown = calculateRealExperience(experiences);
  
  // Score d'expérience basé sur l'expérience réelle
  let experienceScore = 20; // Base score
  if (experienceBreakdown.total > 0) {
    if (experienceBreakdown.total <= 1) experienceScore = 40;
    else if (experienceBreakdown.total <= 3) experienceScore = 60;
    else if (experienceBreakdown.total <= 5) experienceScore = 75;
    else if (experienceBreakdown.total <= 10) experienceScore = 90;
    else experienceScore = 95;

    // Bonus pour expérience professionnelle vs stages
    const professionalRatio = experienceBreakdown.professional / experienceBreakdown.total;
    experienceScore = Math.round(experienceScore * (0.7 + 0.3 * professionalRatio));
  }

  // Score d'éducation amélioré
  const educationResult = calculateEducationScore(education, certifications);

  // Score de compétences basé sur la quantité et qualité
  let skillsScore = 0;
  if (skills.length === 0) skillsScore = 0;
  else if (skills.length <= 3) skillsScore = 40;
  else if (skills.length <= 6) skillsScore = 65;
  else if (skills.length <= 10) skillsScore = 80;
  else skillsScore = 90;

  // Score de complétude
  let completenessScore = 0;
  const fields = [
    candidate.first_name, candidate.last_name, candidate.email, candidate.phone,
    candidate.position, candidate.location, candidate.company
  ];
  const filledBasicFields = fields.filter(field => field && field.trim()).length;
  const hasSkills = skills.length > 0;
  const hasEducation = education.length > 0;
  const hasExperience = experiences.length > 0;
  
  completenessScore = Math.round(
    (filledBasicFields / 7) * 40 + // 40% pour les champs de base
    (hasSkills ? 20 : 0) + // 20% pour les compétences
    (hasEducation ? 20 : 0) + // 20% pour l'éducation
    (hasExperience ? 20 : 0) // 20% pour l'expérience
  );

  // Score global avec pondération pour profil général
  const overallScore = Math.round(
    (skillsScore * 0.35) +
    (experienceScore * 0.35) +
    (educationResult.score * 0.20) +
    (completenessScore * 0.10)
  );

  return {
    overall: overallScore,
    skills: skillsScore,
    experience: experienceScore,
    education: educationResult.score,
    profileCompleteness: completenessScore,
    isJobSpecific: false,
    details: {
      skillsMatched: [],
      skillsMissing: [],
      skillsCount: skills.length,
      experienceYears: experienceBreakdown.total,
      experienceBreakdown,
      educationLevel: educationResult.level,
      educationScore: educationResult.score,
      certifications: educationResult.certificationNames,
      completenessPercentage: completenessScore
    }
  };
}

/**
 * Calcule le score de matching avec une offre d'emploi
 */
export function calculateJobMatchScore(
  candidate: CandidateData, 
  jobOffer: JobOffer
): ImprovedScoreBreakdown {
  const candidateSkills = ensureStringArray(candidate.skills);
  const requiredSkills = ensureStringArray(jobOffer.required_skills);
  const experiences = ensureArray(candidate.experiences);
  const education = ensureArray(candidate.education);
  const certifications = ensureArray(candidate.certifications);

  // Calcul de l'expérience réelle
  const experienceBreakdown = calculateRealExperience(experiences);

  // Score de compétences pour le matching
  const skillsResult = calculateSkillsMatchScore(candidateSkills, requiredSkills);

  // Score d'expérience pour le matching
  const experienceScore = calculateExperienceMatchScore(
    experienceBreakdown,
    jobOffer.experience_years_min || 0,
    jobOffer.experience_years_max
  );

  // Score d'éducation
  const educationResult = calculateEducationScore(education, certifications);

  // Score de complétude (même logique que général)
  const fields = [
    candidate.first_name, candidate.last_name, candidate.email, candidate.phone,
    candidate.position, candidate.location, candidate.company
  ];
  const filledBasicFields = fields.filter(field => field && field.trim()).length;
  const completenessScore = Math.round(
    (filledBasicFields / 7) * 40 +
    (candidateSkills.length > 0 ? 20 : 0) +
    (education.length > 0 ? 20 : 0) +
    (experiences.length > 0 ? 20 : 0)
  );

  // Score global avec pondération pour matching d'offre
  const overallScore = Math.round(
    (skillsResult.score * 0.50) + // Les compétences sont cruciales pour le matching
    (experienceScore * 0.25) +
    (educationResult.score * 0.15) +
    (completenessScore * 0.10)
  );

  return {
    overall: overallScore,
    skills: skillsResult.score,
    experience: experienceScore,
    education: educationResult.score,
    profileCompleteness: completenessScore,
    isJobSpecific: true,
    details: {
      skillsMatched: skillsResult.matched,
      skillsMissing: skillsResult.missing,
      skillsCount: candidateSkills.length,
      experienceYears: experienceBreakdown.total,
      experienceBreakdown,
      educationLevel: educationResult.level,
      educationScore: educationResult.score,
      certifications: educationResult.certificationNames,
      completenessPercentage: completenessScore
    },
    matchContext: `Correspondance avec "${jobOffer.title}"`
  };
}
