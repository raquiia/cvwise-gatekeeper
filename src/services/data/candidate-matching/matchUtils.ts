
import { CandidateData } from '../candidateService';
import { JobOffer } from '../job-offers/types';
import type { CandidateJobMatch, MatchDetails } from './types';
import { ensureStringArray } from '@/utils/candidateUtils';
import { findSkillMatches, calculateSkillsMatchScore } from './skillsMatchingUtils';

export const calculateCandidateJobMatch = async (
  candidate: CandidateData,
  jobOffer: JobOffer
): Promise<CandidateJobMatch> => {
  console.log(`[Match Utils] Calculating match for candidate ${candidate.first_name} ${candidate.last_name} against job ${jobOffer.title}`);
  
  // 1. Correspondance des compétences (60% du score global)
  const candidateSkills = ensureStringArray(candidate.skills);
  const jobRequiredSkills = ensureStringArray(jobOffer.required_skills);
  const jobPreferredSkills = ensureStringArray(jobOffer.preferred_skills);
  
  // Combiner les compétences requises et préférées pour l'analyse
  const allJobSkills = [...jobRequiredSkills, ...jobPreferredSkills];
  
  console.log(`[Match Utils] Candidate skills: [${candidateSkills.join(', ')}]`);
  console.log(`[Match Utils] Job required skills: [${jobRequiredSkills.join(', ')}]`);
  console.log(`[Match Utils] Job preferred skills: [${jobPreferredSkills.join(', ')}]`);
  
  const skillsMatch = findSkillMatches(candidateSkills, allJobSkills);
  const skillsScore = calculateSkillsMatchScore(skillsMatch.matched, allJobSkills.length);
  
  console.log(`[Match Utils] Skills match: ${skillsMatch.matched.length}/${allJobSkills.length} (${skillsScore}%)`);
  
  // 2. Correspondance d'expérience (25% du score global)
  let experienceScore = 30; // Score par défaut plus réaliste
  const candidateExp = candidate.years_experience || 0;
  const minExp = jobOffer.experience_years_min || 0;
  const maxExp = jobOffer.experience_years_max;
  
  if (minExp > 0) {
    if (candidateExp >= minExp && (!maxExp || candidateExp <= maxExp)) {
      experienceScore = 100; // Expérience parfaitement dans la fourchette
    } else if (candidateExp >= minExp * 0.8) {
      experienceScore = 80; // Proche de l'expérience minimum
    } else if (candidateExp >= minExp * 0.5) {
      experienceScore = 50; // Au moins la moitié de l'expérience requise
    } else if (candidateExp > 0) {
      experienceScore = Math.max(20, (candidateExp / minExp) * 40); // Proportionnel mais limité
    } else {
      experienceScore = 10; // Aucune expérience
    }
  }
  
  console.log(`[Match Utils] Experience: ${candidateExp} years vs required ${minExp}${maxExp ? `-${maxExp}` : '+'} (${experienceScore}%)`);
  
  // 3. Correspondance de poste/rôle (bonus/malus selon la correspondance)
  let roleMatchScore = 50;
  let roleMatchExplanation = 'Correspondance de rôle standard';
  
  const candidatePosition = (candidate.position || '').toLowerCase();
  const jobTitle = (jobOffer.title || '').toLowerCase();
  
  // Correspondances exactes ou très proches
  if (candidatePosition.includes('fullstack') && jobTitle.includes('fullstack')) {
    roleMatchScore = 100;
    roleMatchExplanation = 'Correspondance parfaite - Développeur fullstack';
  } else if (candidatePosition.includes('développeur') && jobTitle.includes('développeur')) {
    roleMatchScore = 90;
    roleMatchExplanation = 'Correspondance excellente - Même domaine de développement';
  } else if (candidatePosition.includes('project manager') && !jobTitle.includes('manager') && !jobTitle.includes('chef')) {
    roleMatchScore = 20;
    roleMatchExplanation = 'Rôle différent - Manager vs poste technique';
  } else if (candidatePosition.includes('manager') && jobTitle.includes('développeur')) {
    roleMatchScore = 25;
    roleMatchExplanation = 'Rôle très différent - Management vs développement';
  }
  
  console.log(`[Match Utils] Role match: "${candidatePosition}" vs "${jobTitle}" (${roleMatchScore}%) - ${roleMatchExplanation}`);
  
  // 4. Correspondance de localisation (pour le score local)
  let locationScore = 30; // Score par défaut plus sévère
  let needsRelocation = false;
  const candidateLocation = candidate.location?.toLowerCase().trim() || '';
  const jobLocation = jobOffer.location?.toLowerCase().trim() || '';
  
  if (candidateLocation && jobLocation) {
    if (candidateLocation === jobLocation) {
      locationScore = 100;
    } else if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      locationScore = 80;
    } else {
      locationScore = 10; // Forte pénalité pour mauvaise localisation
      needsRelocation = true;
    }
  }
  
  console.log(`[Match Utils] Location: "${candidateLocation}" vs "${jobLocation}" (${locationScore}%) - Relocation needed: ${needsRelocation}`);
  
  // 5. Correspondance d'éducation (15% du score global)
  let educationScore = 40; // Score par défaut plus réaliste
  const candidateEducation = candidate.education;
  const jobEducationLevel = jobOffer.education_level;
  
  if (candidateEducation && Array.isArray(candidateEducation) && candidateEducation.length > 0) {
    educationScore = 60; // Bonus pour avoir des informations d'éducation
    if (jobEducationLevel) {
      educationScore = 75; // Bonus supplémentaire si les deux sont renseignés
    }
  }
  
  console.log(`[Match Utils] Education score: ${educationScore}%`);
  
  // Calcul des différents scores
  
  // Score basé uniquement sur les compétences (pour voir les vrais talents)
  const skillsOnlyScore = skillsScore;
  
  // Score global sans pénalité de localisation (pondération: Skills 60%, Exp 25%, Edu 15%)
  const globalScore = Math.round(
    skillsScore * 0.6 +           // 60% pour les compétences
    experienceScore * 0.25 +      // 25% pour l'expérience
    educationScore * 0.15         // 15% pour l'éducation
  );
  
  // Ajustement du score global selon la correspondance de rôle
  const adjustedGlobalScore = Math.round(globalScore * (roleMatchScore / 100));
  
  // Score local avec pénalité de localisation (même base + 10% localisation)
  const localScore = Math.round(
    skillsScore * 0.55 +          // 55% pour les compétences  
    experienceScore * 0.2 +       // 20% pour l'expérience
    educationScore * 0.15 +       // 15% pour l'éducation
    locationScore * 0.1           // 10% pour la localisation
  );
  
  // Score final affiché (le score local pour compatibilité)
  const overallScore = localScore;
  
  console.log(`[Match Utils] Scores - Skills Only: ${skillsOnlyScore}%, Global: ${adjustedGlobalScore}%, Local: ${localScore}%, Overall: ${overallScore}%`);
  
  const details: MatchDetails = {
    skills: {
      matched: skillsMatch.matched.map(m => m.candidate),
      missing: skillsMatch.missing,
      additional: skillsMatch.additional,
      matchPercentage: skillsScore
    },
    experienceLevel: {
      required: minExp,
      candidate: candidateExp,
      match: experienceScore >= 70,
      score: experienceScore
    },
    location: {
      required: jobOffer.location || '',
      candidate: candidate.location || '',
      match: locationScore >= 70,
      score: locationScore,
      needsRelocation: needsRelocation
    },
    educationLevel: {
      required: jobEducationLevel || '',
      candidate: candidateEducation ? 'Renseigné' : 'Non renseigné',
      match: educationScore >= 60,
      score: educationScore
    },
    roleMatch: {
      score: roleMatchScore,
      explanation: roleMatchExplanation
    },
    overall: overallScore
  };
  
  return {
    score: overallScore,
    globalScore: adjustedGlobalScore,
    localScore: localScore,
    skillsOnlyScore: skillsOnlyScore,
    details
  };
};

export const createDefaultMatchDetails = (candidate: CandidateData): CandidateJobMatch => {
  return {
    score: 0,
    globalScore: 0,
    localScore: 0,
    skillsOnlyScore: 0,
    details: {
      skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
      experienceLevel: { required: 0, candidate: 0, match: false, score: 0 },
      location: { required: '', candidate: '', match: false, score: 0, needsRelocation: false },
      educationLevel: { required: '', candidate: '', match: false, score: 0 },
      roleMatch: { score: 0, explanation: 'Aucune correspondance' },
      overall: 0
    }
  };
};

export const matchDetailsToJson = (details: MatchDetails) => {
  return details;
};
