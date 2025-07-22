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
  
  // 1. Correspondance des compétences (70% du score global - augmenté)
  const candidateSkills = ensureStringArray(candidate.skills);
  const jobRequiredSkills = ensureStringArray(jobOffer.required_skills);
  const jobPreferredSkills = ensureStringArray(jobOffer.preferred_skills);
  
  console.log(`[Match Utils] Candidate skills: [${candidateSkills.join(', ')}]`);
  console.log(`[Match Utils] Job required skills: [${jobRequiredSkills.join(', ')}]`);
  console.log(`[Match Utils] Job preferred skills: [${jobPreferredSkills.join(', ')}]`);
  
  // Utiliser la nouvelle API avec compétences séparées
  const skillsMatch = findSkillMatches(candidateSkills, jobRequiredSkills, jobPreferredSkills);
  const skillsScoreData = calculateSkillsMatchScore(skillsMatch.matched, jobRequiredSkills.length, jobPreferredSkills.length);
  const skillsScore = skillsScoreData.overall;
  
  console.log(`[Match Utils] Skills match: ${skillsMatch.matched.length}/${jobRequiredSkills.length + jobPreferredSkills.length} (${skillsScore}%)`);
  
  // SEUIL CRITIQUE : Si moins de 20% de correspondance skills ET aucune compétence requise, score max 20%
  if (skillsScore < 20 && jobRequiredSkills.length > 0) {
    console.warn(`⚠️ CRITICAL: Skills score too low (${skillsScore}%) - capping overall match`);
    
    const criticalDetails: MatchDetails = {
      skills: {
        matched: skillsMatch.matched.map(m => m.candidate),
        missing: skillsMatch.missing.map(m => m.skill),
        additional: skillsMatch.additional,
        matchPercentage: skillsScore
      },
      experienceLevel: { required: 0, candidate: 0, match: false, score: 0 },
      location: { required: '', candidate: '', match: false, score: 0, needsRelocation: false },
      educationLevel: { required: '', candidate: '', match: false, score: 0 },
      roleMatch: { score: 10, explanation: 'Compétences insuffisantes' },
      overall: Math.min(20, skillsScore)
    };
    
    return {
      score: Math.min(20, skillsScore),
      globalScore: Math.min(20, skillsScore),
      localScore: Math.min(20, skillsScore),
      skillsOnlyScore: skillsScore,
      details: criticalDetails
    };
  }
  
  // 2. Correspondance d'expérience (20% du score global - réduit)
  let experienceScore = 5; // Score par défaut très bas
  const candidateExp = candidate.years_experience || 0;
  const minExp = jobOffer.experience_years_min || 0;
  const maxExp = jobOffer.experience_years_max;
  
  if (minExp > 0) {
    const expRatio = candidateExp / minExp;
    
    if (candidateExp >= minExp && (!maxExp || candidateExp <= maxExp)) {
      experienceScore = 100; // Expérience parfaitement dans la fourchette
    } else if (candidateExp >= minExp * 0.8) {
      experienceScore = 85; // Très proche de l'expérience minimum
    } else if (candidateExp >= minExp * 0.6) {
      experienceScore = 60; // Acceptable mais en dessous
    } else if (candidateExp >= minExp * 0.4) {
      experienceScore = 35; // Insuffisant mais pas catastrophique
    } else if (candidateExp > 0) {
      experienceScore = Math.max(10, expRatio * 25); // Proportionnel mais faible
    } else {
      experienceScore = 5; // Aucune expérience vs expérience requise
    }
    
    // Pénalité pour surqualification excessive (>200% de l'expérience max)
    if (maxExp && candidateExp > maxExp * 2) {
      experienceScore = 40; // Pénalité surqualification
      console.log(`[Match Utils] Overqualification penalty applied: ${candidateExp} >> ${maxExp}`);
    }
  } else {
    // Pas d'expérience requise
    experienceScore = candidateExp > 0 ? 80 : 50;
  }
  
  console.log(`[Match Utils] Experience: ${candidateExp} years vs required ${minExp}${maxExp ? `-${maxExp}` : '+'} (${experienceScore}%)`);
  
  // 3. Correspondance de poste/rôle (impact multiplicateur crucial) - AMÉLIORÉ POUR PMO
  let roleMatchScore = 20; // Score par défaut plus sévère
  let roleMatchExplanation = 'Correspondance de rôle à évaluer';
  
  const candidatePosition = (candidate.position || '').toLowerCase().trim();
  const jobTitle = (jobOffer.title || '').toLowerCase().trim();
  
  // Détection PMO/Project Management améliorée
  const isPMOJob = jobTitle.includes('pmo') || jobTitle.includes('project manager') || 
                  jobTitle.includes('chef de projet') || jobTitle.includes('ingénieur projet') ||
                  jobTitle.includes('directeur de projet') || jobTitle.includes('responsable projet') ||
                  jobRequiredSkills.some(skill => 
                    ['project management', 'gestion de projet', 'pmp', 'prince2', 'scrum master'].includes(skill.toLowerCase())
                  );
  
  const candidateIsPMO = candidatePosition.includes('pmo') || candidatePosition.includes('project manager') ||
                        candidatePosition.includes('chef de projet') || candidatePosition.includes('ingénieur projet') ||
                        candidatePosition.includes('directeur de projet') || candidatePosition.includes('responsable projet') ||
                        candidatePosition.includes('project management') || candidatePosition.includes('gestion de projet');
  
  // Détection de rôles techniques vs management (mise à jour)
  const isTechnicalJob = jobTitle.includes('développeur') || jobTitle.includes('ingénieur logiciel') || 
                        jobTitle.includes('analyst') || jobTitle.includes('architect') ||
                        jobRequiredSkills.some(skill => 
                          ['javascript', 'python', 'java', 'react', 'vue', 'angular', 'sql', 'aws', 'docker'].includes(skill.toLowerCase())
                        );
  
  const candidateIsTechnical = candidatePosition.includes('développeur') || candidatePosition.includes('ingénieur logiciel') ||
                              candidatePosition.includes('analyst') || candidatePosition.includes('architect') ||
                              candidatePosition.includes('software engineer');
  
  // Correspondances spécifiques PMO (PRIORITÉ ABSOLUE)
  if (candidateIsPMO && isPMOJob) {
    roleMatchScore = 95;
    roleMatchExplanation = 'Correspondance excellente - PMO/Project Management';
  } else if (candidatePosition.includes('pmo') && jobTitle.includes('pmo')) {
    roleMatchScore = 100;
    roleMatchExplanation = 'Correspondance parfaite - PMO';
  } else if (candidatePosition.includes('project manager') && jobTitle.includes('project manager')) {
    roleMatchScore = 95;
    roleMatchExplanation = 'Correspondance excellente - Project Manager';
  } else if (candidatePosition.includes('chef de projet') && (jobTitle.includes('chef de projet') || jobTitle.includes('ingénieur projet'))) {
    roleMatchScore = 90;
    roleMatchExplanation = 'Correspondance excellente - Chef de projet';
  } else if (candidatePosition.includes('ingénieur projet') && jobTitle.includes('ingénieur projet')) {
    roleMatchScore = 95;
    roleMatchExplanation = 'Correspondance excellente - Ingénieur projet';
  } 
  // Correspondances techniques
  else if (candidatePosition.includes('fullstack') && jobTitle.includes('fullstack')) {
    roleMatchScore = 100;
    roleMatchExplanation = 'Correspondance parfaite - Développeur fullstack';
  } else if (candidateIsTechnical && isTechnicalJob) {
    roleMatchScore = 80;
    roleMatchExplanation = 'Correspondance technique solide';
  } 
  // Incompatibilités majeures
  else if (candidateIsTechnical && isPMOJob) {
    roleMatchScore = 15; // Très forte pénalité technique -> PMO
    roleMatchExplanation = 'Rôle incompatible - Technique vers PMO/Management';
  } else if (candidateIsPMO && isTechnicalJob) {
    roleMatchScore = 25; // Pénalité PMO -> technique (possible mais rare)
    roleMatchExplanation = 'Transition PMO vers technique';
  } else if (candidatePosition && jobTitle) {
    // Correspondance générale basée sur les mots-clés
    const positionWords = candidatePosition.split(/\s+/).filter(w => w.length > 2);
    const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 2);
    const commonWords = positionWords.filter(word => 
      jobWords.some(jobWord => jobWord.includes(word) || word.includes(jobWord))
    );
    
    if (commonWords.length > 0) {
      roleMatchScore = 40 + (commonWords.length * 10);
      roleMatchExplanation = `Correspondance partielle - ${commonWords.length} mot(s) commun(s)`;
    }
  }
  
  // Bonus pour expertise PMO (certifications, etc.)
  if (isPMOJob && candidateIsPMO) {
    const candidateDescription = (candidate.career_objectives || '').toLowerCase() + ' ' + 
                                (candidate.summary || '').toLowerCase();
    
    if (candidateDescription.includes('pmp') || candidateDescription.includes('prince2') || 
        candidateDescription.includes('scrum master') || candidateDescription.includes('project management professional')) {
      roleMatchScore = Math.min(100, roleMatchScore + 10);
      roleMatchExplanation += ' + Certification PMO';
    }
    
    if (candidateDescription.includes('migso') || candidateDescription.includes('pcubed') || 
        candidateDescription.includes('conseil') || candidateDescription.includes('consulting')) {
      roleMatchScore = Math.min(100, roleMatchScore + 5);
      roleMatchExplanation += ' + Expérience conseil';
    }
  }
  
  console.log(`[Match Utils] Role match: "${candidatePosition}" vs "${jobTitle}" (${roleMatchScore}%) - ${roleMatchExplanation}`);
  
  // 4. Correspondance de localisation (5% du score global - fortement réduit)
  let locationScore = 5; // Score par défaut très sévère
  let needsRelocation = false;
  const candidateLocation = candidate.location?.toLowerCase().trim() || '';
  const jobLocation = jobOffer.location?.toLowerCase().trim() || '';
  
  if (candidateLocation && jobLocation) {
    if (candidateLocation === jobLocation) {
      locationScore = 100;
    } else if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      locationScore = 70;
    } else {
      locationScore = 5; // Très forte pénalité pour mauvaise localisation
      needsRelocation = true;
    }
  } else if (!jobLocation) {
    locationScore = 80; // Pas de contrainte de localisation
  }
  
  console.log(`[Match Utils] Location: "${candidateLocation}" vs "${jobLocation}" (${locationScore}%) - Relocation needed: ${needsRelocation}`);
  
  // 5. Correspondance d'éducation (5% du score global - fortement réduit)
  let educationScore = 5; // Score par défaut très sévère
  const candidateEducation = candidate.education;
  const jobEducationLevel = jobOffer.education_level;
  
  if (candidateEducation && Array.isArray(candidateEducation) && candidateEducation.length > 0) {
    educationScore = 30; // Bonus pour avoir des informations d'éducation
    
    const educationLevels = candidateEducation.map((edu: any) => (edu.degree || '').toLowerCase());
    const educationFields = candidateEducation.map((edu: any) => (edu.field || edu.field_of_study || '').toLowerCase());
    
    if (jobEducationLevel) {
      const requiredLevel = jobEducationLevel.toLowerCase();
      
      // Correspondances spécifiques avec bonus pour ingénieur/PMO
      if (educationLevels.some(level => level.includes('ingénieur') || level.includes('engineer')) && 
          (jobTitle.includes('ingénieur') || isPMOJob)) {
        educationScore = 95; // Bonus élevé pour diplôme d'ingénieur sur poste ingénieur/PMO
      } else if (educationLevels.some(level => level.includes('master') || level.includes('mba')) && 
                 requiredLevel.includes('master')) {
        educationScore = 90;
      } else if (educationFields.some(field => field.includes('gestion') || field.includes('management') || 
                                             field.includes('projet') || field.includes('project')) && isPMOJob) {
        educationScore = 85; // Bonus pour formation en gestion/management sur poste PMO
      } else if (educationLevels.some(level => level.includes('bachelor') || level.includes('license')) && 
                 requiredLevel.includes('bachelor')) {
        educationScore = 75;
      } else if (educationLevels.some(level => level.includes('phd') || level.includes('doctorat'))) {
        educationScore = 90; // Bonus pour niveau élevé
      } else {
        educationScore = 50; // Éducation présente mais pas parfaitement alignée
      }
    }
  }
  
  console.log(`[Match Utils] Education score: ${educationScore}%`);
  
  // Calcul des différents scores avec nouveaux poids
  
  // Score basé uniquement sur les compétences (pour voir les vrais talents)
  const skillsOnlyScore = skillsScore;
  
  // Score global avec nouveaux poids: Skills 70%, Exp 20%, Edu 5%, Location 5%
  let globalScore = Math.round(
    skillsScore * 0.70 +           // 70% pour les compétences (augmenté)
    experienceScore * 0.20 +       // 20% pour l'expérience (réduit)
    educationScore * 0.05 +        // 5% pour l'éducation (fortement réduit)
    locationScore * 0.05           // 5% pour la localisation (fortement réduit)
  );
  
  // Ajustement multiplicateur selon la correspondance de rôle (CRITIQUE)
  const roleMultiplier = roleMatchScore / 100;
  const adjustedGlobalScore = Math.round(globalScore * roleMultiplier);
  
  // Score local identique au global (simplification)
  const localScore = adjustedGlobalScore;
  
  // Score final affiché
  const overallScore = adjustedGlobalScore;
  
  console.log(`[Match Utils] Scores - Skills Only: ${skillsOnlyScore}%, Pre-role: ${globalScore}%, Role Multiplier: ${roleMultiplier}, Final: ${overallScore}%`);
  
  const details: MatchDetails = {
    skills: {
      matched: skillsMatch.matched.map(m => m.candidate),
      missing: skillsMatch.missing.map(m => m.skill),
      additional: skillsMatch.additional,
      matchPercentage: skillsScore
    },
    experienceLevel: {
      required: minExp,
      candidate: candidateExp,
      match: experienceScore >= 60,
      score: experienceScore
    },
    location: {
      required: jobOffer.location || '',
      candidate: candidate.location || '',
      match: locationScore >= 50,
      score: locationScore,
      needsRelocation: needsRelocation
    },
    educationLevel: {
      required: jobEducationLevel || '',
      candidate: candidateEducation ? 'Renseigné' : 'Non renseigné',
      match: educationScore >= 40,
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
