
import { CandidateData } from '../candidateService';
import { JobOffer } from '../job-offers/types';
import type { CandidateJobMatch, MatchDetails } from './types';
import { ensureStringArray } from '@/utils/candidateUtils';
import { findSkillMatches, calculateSkillsMatchScore } from './skillsMatchingUtils';

export const calculateCandidateJobMatch = async (
  candidate: CandidateData,
  jobOffer: JobOffer
): Promise<CandidateJobMatch> => {
  const debugMode = typeof window !== 'undefined' && (window as any).DEBUG_MATCHING;
  
  if (debugMode) {
    console.log(`[PMO Debug] 🔍 === ANALYZING CANDIDATE: ${candidate.first_name} ${candidate.last_name} ===`);
    console.log(`[PMO Debug] Job: "${jobOffer.title}" | Candidate Position: "${candidate.position}"`);
  }
  
  // 1. Correspondance des compétences (70% du score global)
  const candidateSkills = ensureStringArray(candidate.skills);
  const jobRequiredSkills = ensureStringArray(jobOffer.required_skills);
  const jobPreferredSkills = ensureStringArray(jobOffer.preferred_skills);
  
  if (debugMode) {
    console.log(`[PMO Debug] 🎯 SKILLS ANALYSIS:`);
    console.log(`[PMO Debug] Candidate skills: [${candidateSkills.join(', ')}]`);
    console.log(`[PMO Debug] Job required: [${jobRequiredSkills.join(', ')}]`);
    console.log(`[PMO Debug] Job preferred: [${jobPreferredSkills.join(', ')}]`);
  }
  
  const skillsMatch = findSkillMatches(candidateSkills, jobRequiredSkills, jobPreferredSkills);
  const skillsScoreData = calculateSkillsMatchScore(skillsMatch.matched, jobRequiredSkills.length, jobPreferredSkills.length);
  const skillsScore = skillsScoreData.overall;
  
  if (debugMode) {
    console.log(`[PMO Debug] Skills matched: ${skillsMatch.matched.length}/${jobRequiredSkills.length + jobPreferredSkills.length}`);
    console.log(`[PMO Debug] Skills score: ${skillsScore}%`);
    console.log(`[PMO Debug] Matched skills: [${skillsMatch.matched.map(m => m.candidate).join(', ')}]`);
    console.log(`[PMO Debug] Missing skills: [${skillsMatch.missing.map(m => m.skill).join(', ')}]`);
  }
  
  // SEUIL CRITIQUE pour compétences insuffisantes
  if (skillsScore < 15 && jobRequiredSkills.length > 0) {
    if (debugMode) {
      console.log(`[PMO Debug] ❌ CRITICAL FAILURE - Skills too low: ${skillsScore}% - CAPPING at 15%`);
    }
    
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
      roleMatch: { score: 5, explanation: 'Compétences insuffisantes' },
      overall: Math.min(15, skillsScore)
    };
    
    return {
      score: Math.min(15, skillsScore),
      globalScore: Math.min(15, skillsScore),
      localScore: Math.min(15, skillsScore),
      skillsOnlyScore: skillsScore,
      details: criticalDetails
    };
  }
  
  // 2. Correspondance d'expérience (15% du score global - réduit)
  let experienceScore = 30; // Score par défaut plus généreux
  const candidateExp = candidate.years_experience || 0;
  const minExp = jobOffer.experience_years_min || 0;
  const maxExp = jobOffer.experience_years_max;
  
  if (minExp > 0) {
    if (candidateExp >= minExp && (!maxExp || candidateExp <= maxExp)) {
      experienceScore = 100;
    } else if (candidateExp >= minExp * 0.8) {
      experienceScore = 90;
    } else if (candidateExp >= minExp * 0.6) {
      experienceScore = 70;
    } else if (candidateExp >= minExp * 0.4) {
      experienceScore = 50;
    } else if (candidateExp > 0) {
      experienceScore = Math.max(30, (candidateExp / minExp) * 60);
    }
    
    // Pénalité surqualification modérée
    if (maxExp && candidateExp > maxExp * 1.5) {
      experienceScore = Math.max(50, experienceScore * 0.8);
      if (debugMode) {
        console.log(`[PMO Debug] ⚠️ Slight overqualification penalty: ${candidateExp} >> ${maxExp}`);
      }
    }
  } else {
    experienceScore = candidateExp > 0 ? 90 : 60;
  }
  
  if (debugMode) {
    console.log(`[PMO Debug] 📈 EXPERIENCE: ${candidateExp}y vs required ${minExp}${maxExp ? `-${maxExp}` : '+'} → ${experienceScore}%`);
  }
  
  // 3. Correspondance de rôle/poste (CRITIQUE - impact multiplicateur)
  let roleMatchScore = 10; // Score par défaut très bas
  let roleMatchExplanation = 'Correspondance de rôle à évaluer';
  
  const candidatePosition = (candidate.position || '').toLowerCase().trim();
  const jobTitle = (jobOffer.title || '').toLowerCase().trim();
  
  if (debugMode) {
    console.log(`[PMO Debug] 🎯 ROLE MATCHING ANALYSIS:`);
    console.log(`[PMO Debug] Candidate: "${candidatePosition}"`);
    console.log(`[PMO Debug] Job: "${jobTitle}"`);
  }
  
  // Détection PMO/Project Management AMÉLIORÉE
  const pmoKeywords = ['pmo', 'project manager', 'chef de projet', 'ingénieur projet', 'directeur de projet', 'responsable projet', 'project leader', 'planisware', 'microsoft project'];
  const skillsPMOKeywords = ['project management', 'gestion de projet', 'gestion projet', 'pmp', 'prince2', 'scrum master', 'agile', 'planification'];
  
  const isPMOJob = pmoKeywords.some(keyword => jobTitle.includes(keyword)) || 
                  skillsPMOKeywords.some(skill => jobRequiredSkills.some(req => req.toLowerCase().includes(skill)));
  
  const candidateIsPMO = pmoKeywords.some(keyword => candidatePosition.includes(keyword)) ||
                        skillsPMOKeywords.some(skill => candidateSkills.some(cSkill => cSkill.toLowerCase().includes(skill)));
  
  if (debugMode) {
    console.log(`[PMO Debug] Job is PMO: ${isPMOJob}`);
    console.log(`[PMO Debug] Candidate is PMO: ${candidateIsPMO}`);
  }
  
  // Détection technique
  const technicalKeywords = ['développeur', 'developer', 'ingénieur logiciel', 'software engineer', 'fullstack', 'frontend', 'backend', 'architect'];
  const isTechnicalJob = technicalKeywords.some(keyword => jobTitle.includes(keyword));
  const candidateIsTechnical = technicalKeywords.some(keyword => candidatePosition.includes(keyword));
  
  if (debugMode) {
    console.log(`[PMO Debug] Job is Technical: ${isTechnicalJob}`);
    console.log(`[PMO Debug] Candidate is Technical: ${candidateIsTechnical}`);
  }
  
  // CORRESPONDANCES SPÉCIFIQUES PMO (PRIORITÉ ABSOLUE)
  if (candidateIsPMO && isPMOJob) {
    // Correspondances exactes PMO
    if (candidatePosition.includes('pmo') && jobTitle.includes('pmo')) {
      roleMatchScore = 100;
      roleMatchExplanation = '🎯 Correspondance PMO parfaite';
    } else if (candidatePosition.includes('project manager') && jobTitle.includes('project manager')) {
      roleMatchScore = 95;
      roleMatchExplanation = '🎯 Correspondance Project Manager excellente';
    } else if (candidatePosition.includes('project leader') && (jobTitle.includes('pmo') || jobTitle.includes('project'))) {
      roleMatchScore = 90;
      roleMatchExplanation = '🎯 Project Leader → PMO (excellent)';
    } else if (candidatePosition.includes('chef de projet') && jobTitle.includes('ingénieur projet')) {
      roleMatchScore = 85;
      roleMatchExplanation = '🎯 Chef de projet → Ingénieur projet (très bon)';
    } else if (candidatePosition.includes('consultant') && candidatePosition.includes('planisware')) {
      roleMatchScore = 80;
      roleMatchExplanation = '🎯 Consultant Planisware → PMO (solide)';
    } else {
      roleMatchScore = 75;
      roleMatchExplanation = '🎯 Profil PMO général (bon)';
    }
  } 
  // Incompatibilités majeures
  else if (candidateIsTechnical && isPMOJob) {
    roleMatchScore = 5; // Très forte pénalité
    roleMatchExplanation = '❌ INCOMPATIBLE: Technique → PMO';
  } else if (candidateIsPMO && isTechnicalJob) {
    roleMatchScore = 20; // Pénalité PMO → technique  
    roleMatchExplanation = '⚠️ Transition difficile: PMO → Technique';
  } 
  // Correspondances techniques
  else if (candidateIsTechnical && isTechnicalJob) {
    if (candidatePosition.includes('fullstack') && jobTitle.includes('fullstack')) {
      roleMatchScore = 100;
      roleMatchExplanation = '🎯 Correspondance Fullstack parfaite';
    } else {
      roleMatchScore = 70;
      roleMatchExplanation = '🎯 Correspondance technique solide';
    }
  }
  // Correspondance générale par mots-clés
  else if (candidatePosition && jobTitle) {
    const candidateWords = candidatePosition.split(/\s+/).filter(w => w.length > 2);
    const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 2);
    const commonWords = candidateWords.filter(word => 
      jobWords.some(jobWord => jobWord.includes(word) || word.includes(jobWord))
    );
    
    if (commonWords.length > 0) {
      roleMatchScore = Math.min(60, 25 + (commonWords.length * 15));
      roleMatchExplanation = `Correspondance partielle - ${commonWords.length} mot(s) commun(s)`;
    } else {
      roleMatchScore = 15;
      roleMatchExplanation = 'Aucune correspondance de rôle détectée';
    }
  }
  
  // Bonus pour expertise PMO (certifications, expérience)
  if (isPMOJob && candidateIsPMO) {
    const candidateDescription = (candidate.career_objectives || '').toLowerCase() + ' ' + 
                                (candidate.professional_values || '').toLowerCase();
    
    if (candidateDescription.includes('pmp') || candidateDescription.includes('prince2')) {
      roleMatchScore = Math.min(100, roleMatchScore + 10);
      roleMatchExplanation += ' + Certification PMO';
    }
    
    if (candidateDescription.includes('migso') || candidateDescription.includes('pcubed')) {
      roleMatchScore = Math.min(100, roleMatchScore + 8);
      roleMatchExplanation += ' + Exp. Conseil';
    }
  }
  
  if (debugMode) {
    console.log(`[PMO Debug] 🎯 ROLE SCORE: ${roleMatchScore}% - ${roleMatchExplanation}`);
  }
  
  // 4. Correspondance de localisation (5% du score global)
  let locationScore = 60; // Score par défaut plus généreux
  let needsRelocation = false;
  const candidateLocation = candidate.location?.toLowerCase().trim() || '';
  const jobLocation = jobOffer.location?.toLowerCase().trim() || '';
  
  if (candidateLocation && jobLocation) {
    if (candidateLocation === jobLocation) {
      locationScore = 100;
    } else if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      locationScore = 85;
    } else {
      locationScore = 40;
      needsRelocation = true;
    }
  } else if (!jobLocation) {
    locationScore = 90;
  }
  
  if (debugMode) {
    console.log(`[PMO Debug] 📍 LOCATION: "${candidateLocation}" vs "${jobLocation}" → ${locationScore}% (Relocation: ${needsRelocation})`);
  }
  
  // 5. Correspondance d'éducation (5% du score global)
  let educationScore = 40; // Score par défaut plus généreux
  const candidateEducation = candidate.education;
  const jobEducationLevel = jobOffer.education_level;
  
  if (candidateEducation && Array.isArray(candidateEducation) && candidateEducation.length > 0) {
    educationScore = 60;
    
    const educationLevels = candidateEducation.map((edu: any) => (edu.degree || '').toLowerCase());
    const educationFields = candidateEducation.map((edu: any) => (edu.field || edu.field_of_study || '').toLowerCase());
    
    if (jobEducationLevel) {
      const requiredLevel = jobEducationLevel.toLowerCase();
      
      if (educationLevels.some(level => level.includes('ingénieur') || level.includes('engineer')) && 
          (jobTitle.includes('ingénieur') || isPMOJob)) {
        educationScore = 95;
      } else if (educationLevels.some(level => level.includes('master') || level.includes('mba')) && 
                 requiredLevel.includes('master')) {
        educationScore = 90;
      } else if (educationFields.some(field => field.includes('gestion') || field.includes('management') || 
                                             field.includes('projet') || field.includes('project')) && isPMOJob) {
        educationScore = 85;
      } else if (educationLevels.some(level => level.includes('phd') || level.includes('doctorat'))) {
        educationScore = 90;
      } else {
        educationScore = 70;
      }
    }
  }
  
  if (debugMode) {
    console.log(`[PMO Debug] 🎓 EDUCATION: ${educationScore}%`);
  }
  
  // Calcul des scores avec nouveaux poids optimisés
  const skillsOnlyScore = skillsScore;
  
  // Score global: Skills 75%, Role 15%, Exp 5%, Edu 3%, Location 2%
  let globalScore = Math.round(
    skillsScore * 0.75 +           // 75% compétences
    (roleMatchScore * 0.15) +      // 15% rôle (critique)
    experienceScore * 0.05 +       // 5% expérience
    educationScore * 0.03 +        // 3% éducation
    locationScore * 0.02           // 2% localisation
  );
  
  // Multiplicateur critique basé sur la correspondance de rôle
  const roleMultiplier = roleMatchScore >= 70 ? 1.0 : 
                        roleMatchScore >= 50 ? 0.9 :
                        roleMatchScore >= 30 ? 0.7 : 0.4;
  
  const adjustedGlobalScore = Math.round(globalScore * roleMultiplier);
  const localScore = adjustedGlobalScore;
  const overallScore = adjustedGlobalScore;
  
  if (debugMode) {
    console.log(`[PMO Debug] 📊 FINAL SCORES:`);
    console.log(`[PMO Debug] Pre-role adjustment: ${globalScore}%`);
    console.log(`[PMO Debug] Role multiplier: ${roleMultiplier}`);
    console.log(`[PMO Debug] Final score: ${overallScore}%`);
    console.log(`[PMO Debug] Skills-only: ${skillsOnlyScore}%`);
    console.log(`[PMO Debug] === END ANALYSIS ===\n`);
  }
  
  // Seuil d'affichage : ne pas afficher les candidats avec moins de 25%
  if (overallScore < 25) {
    if (debugMode) {
      console.log(`[PMO Debug] ❌ CANDIDATE FILTERED OUT - Score too low: ${overallScore}%`);
    }
  }
  
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
