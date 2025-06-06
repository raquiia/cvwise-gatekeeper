
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
  
  // 1. Correspondance des compétences (50% du score)
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
  
  // 2. Correspondance d'expérience (30% du score)
  let experienceScore = 50; // Score par défaut
  const candidateExp = candidate.years_experience || 0;
  const minExp = jobOffer.experience_years_min || 0;
  const maxExp = jobOffer.experience_years_max;
  
  if (minExp > 0) {
    if (candidateExp >= minExp && (!maxExp || candidateExp <= maxExp)) {
      experienceScore = 100; // Expérience parfaitement dans la fourchette
    } else if (candidateExp >= minExp * 0.8) {
      experienceScore = 80; // Proche de l'expérience minimum
    } else if (candidateExp > 0) {
      experienceScore = Math.max(20, (candidateExp / minExp) * 60); // Proportionnel
    } else {
      experienceScore = 10; // Aucune expérience
    }
  }
  
  console.log(`[Match Utils] Experience: ${candidateExp} years vs required ${minExp}${maxExp ? `-${maxExp}` : '+'} (${experienceScore}%)`);
  
  // 3. Correspondance de localisation (10% du score)
  let locationScore = 50; // Score par défaut
  const candidateLocation = candidate.location?.toLowerCase().trim() || '';
  const jobLocation = jobOffer.location?.toLowerCase().trim() || '';
  
  if (candidateLocation && jobLocation) {
    if (candidateLocation === jobLocation) {
      locationScore = 100;
    } else if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      locationScore = 80;
    } else {
      locationScore = 30;
    }
  }
  
  console.log(`[Match Utils] Location: "${candidateLocation}" vs "${jobLocation}" (${locationScore}%)`);
  
  // 4. Correspondance d'éducation (10% du score) - Simplifié pour l'instant
  let educationScore = 50;
  const candidateEducation = candidate.education;
  const jobEducationLevel = jobOffer.education_level;
  
  if (candidateEducation && Array.isArray(candidateEducation) && candidateEducation.length > 0) {
    educationScore = 70; // Bonus pour avoir des informations d'éducation
  }
  if (jobEducationLevel && candidateEducation) {
    educationScore = 80; // Bonus supplémentaire si les deux sont renseignés
  }
  
  console.log(`[Match Utils] Education score: ${educationScore}%`);
  
  // Calcul du score global avec pondération
  const overallScore = Math.round(
    skillsScore * 0.5 +        // 50% pour les compétences
    experienceScore * 0.3 +    // 30% pour l'expérience
    locationScore * 0.1 +      // 10% pour la localisation
    educationScore * 0.1       // 10% pour l'éducation
  );
  
  console.log(`[Match Utils] Overall score: ${overallScore}% (Skills: ${skillsScore}%, Exp: ${experienceScore}%, Loc: ${locationScore}%, Edu: ${educationScore}%)`);
  
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
      score: locationScore
    },
    educationLevel: {
      required: jobEducationLevel || '',
      candidate: candidateEducation ? 'Renseigné' : 'Non renseigné',
      match: educationScore >= 60,
      score: educationScore
    },
    overall: overallScore
  };
  
  return {
    candidateId: candidate.id!,
    firstName: candidate.first_name || '',
    lastName: candidate.last_name || '',
    position: candidate.position || '',
    company: candidate.company || '',
    score: overallScore,
    details
  };
};

export const createDefaultMatchDetails = (candidate: CandidateData): CandidateJobMatch => {
  return {
    candidateId: candidate.id!,
    firstName: candidate.first_name || '',
    lastName: candidate.last_name || '',
    position: candidate.position || '',
    company: candidate.company || '',
    score: 0,
    details: {
      skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
      experienceLevel: { required: 0, candidate: 0, match: false, score: 0 },
      location: { required: '', candidate: '', match: false, score: 0 },
      educationLevel: { required: '', candidate: '', match: false, score: 0 },
      overall: 0
    }
  };
};

export const matchDetailsToJson = (details: MatchDetails) => {
  return details;
};
