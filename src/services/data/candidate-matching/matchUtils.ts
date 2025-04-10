
import { CandidateData } from '../candidateService';
import { JobOffer } from '../job-offers/types';
import { MatchDetails, SkillsMatchDetails } from './types';
import { CandidateJobMatch } from '../candidateDataService';
import { Json } from '@/integrations/supabase/types';

/**
 * Calculate match between a candidate and a job offer
 */
export const calculateCandidateJobMatch = async (
  candidate: CandidateData,
  jobOffer: JobOffer
): Promise<CandidateJobMatch> => {
  try {
    console.log(`Calculating match for candidate ${candidate.id} against job offer ${jobOffer.id}`);
    
    // Calculate skills match
    const skillsMatch = calculateSkillsMatch(candidate, jobOffer);
    console.log('Skills match result:', skillsMatch);
    
    // Calculate experience level match
    const expLevelMatch = calculateExperienceLevelMatch(candidate, jobOffer);
    console.log('Experience level match:', expLevelMatch);
    
    // Calculate education level match
    const educationMatch = calculateEducationLevelMatch(candidate, jobOffer);
    console.log('Education match:', educationMatch);
    
    // Calculate location match
    const locationMatch = calculateLocationMatch(candidate, jobOffer);
    console.log('Location match:', locationMatch);
    
    // Calculate overall score
    const overallScore = calculateOverallScore({
      skillsMatchPercentage: skillsMatch.matchPercentage,
      experienceMatchScore: expLevelMatch.score || 0,
      educationMatchScore: educationMatch.score || 0,
      locationMatchScore: locationMatch.score || 0
    });
    
    console.log(`Overall match score: ${overallScore}`);
    
    return {
      score: overallScore,
      details: {
        skills: skillsMatch,
        experienceLevel: expLevelMatch,
        educationLevel: educationMatch,
        location: locationMatch,
        overall: overallScore
      }
    };
  } catch (error) {
    console.error('Error calculating candidate job match:', error);
    return {
      score: 0,
      details: {
        skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
        experienceLevel: { required: 0, candidate: 0, match: false, score: 0 },
        educationLevel: { required: '', candidate: '', match: false, score: 0 },
        location: { required: '', candidate: '', match: false, score: 0 },
        overall: 0
      }
    };
  }
};

/**
 * Create default match details for a candidate
 */
export const createDefaultMatchDetails = (candidate: CandidateData): CandidateJobMatch => {
  console.log('Creating default match details for candidate:', candidate.id);
  return {
    score: 0,
    details: {
      skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
      experienceLevel: { required: 0, candidate: 0, match: false, score: 0 },
      educationLevel: { required: '', candidate: '', match: false, score: 0 },
      location: { required: '', candidate: '', match: false, score: 0 },
      overall: 0
    }
  };
};

/**
 * Convert MatchDetails to a database-friendly JSON format
 */
export const matchDetailsToJson = (details: MatchDetails): Json => {
  return details as unknown as Json;
};

/**
 * Calculate skills match between a candidate and a job offer
 */
const calculateSkillsMatch = (candidate: CandidateData, jobOffer: JobOffer): SkillsMatchDetails => {
  const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills.map(skill => skill.toLowerCase()) : [];
  const requiredSkills = Array.isArray(jobOffer.required_skills) ? jobOffer.required_skills.map(skill => skill.toLowerCase()) : [];
  
  const matched = candidateSkills.filter(skill => requiredSkills.includes(skill));
  const missing = requiredSkills.filter(skill => !candidateSkills.includes(skill));
  const additional = candidateSkills.filter(skill => !requiredSkills.includes(skill));
  
  const matchPercentage = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 100 : 100;
  
  return {
    matched,
    missing,
    additional,
    matchPercentage
  };
};

/**
 * Calculate experience level match between a candidate and a job offer
 */
const calculateExperienceLevelMatch = (candidate: CandidateData, jobOffer: JobOffer) => {
  const candidateExp = candidate.years_experience || 0;
  const requiredExpMin = jobOffer.experience_years_min || 0;
  const requiredExpMax = jobOffer.experience_years_max || 100;
  
  const match = candidateExp >= requiredExpMin && candidateExp <= requiredExpMax;
  let score = 0;
  
  if (match) {
    score = 100;
  } else if (candidateExp < requiredExpMin) {
    score = (candidateExp / requiredExpMin) * 50;
  } else {
    score = 50 + ((requiredExpMax - candidateExp) / requiredExpMax) * 50;
  }
  
  return {
    required: requiredExpMin,
    candidate: candidateExp,
    match,
    score
  };
};

/**
 * Calculate education level match between a candidate and a job offer
 */
const calculateEducationLevelMatch = (candidate: CandidateData, jobOffer: JobOffer) => {
  const candidateEducation = Array.isArray(candidate.education) && candidate.education.length > 0 ? candidate.education[0] : '';
  const requiredEducation = jobOffer.education_level || '';
  
  const match = candidateEducation === requiredEducation;
  const score = match ? 100 : 0;
  
  return {
    required: requiredEducation,
    candidate: candidateEducation,
    match,
    score
  };
};

/**
 * Calculate location match between a candidate and a job offer
 */
const calculateLocationMatch = (candidate: CandidateData, jobOffer: JobOffer) => {
  const candidateLocation = candidate.location || '';
  const requiredLocation = jobOffer.location || '';
  
  const match = candidateLocation.toLowerCase() === requiredLocation.toLowerCase();
  const score = match ? 100 : 0;
  
  return {
    required: requiredLocation,
    candidate: candidateLocation,
    match,
    score
  };
};

/**
 * Calculate overall match score
 */
interface OverallScoreParams {
  skillsMatchPercentage: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  locationMatchScore: number;
}

const calculateOverallScore = (params: OverallScoreParams): number => {
  const {
    skillsMatchPercentage,
    experienceMatchScore,
    educationMatchScore,
    locationMatchScore
  } = params;
  
  // You can adjust the weights as needed
  const skillsWeight = 0.4;
  const experienceWeight = 0.3;
  const educationWeight = 0.15;
  const locationWeight = 0.15;
  
  const overallScore = (
    (skillsMatchPercentage * skillsWeight) +
    (experienceMatchScore * experienceWeight) +
    (educationMatchScore * educationWeight) +
    (locationMatchScore * locationWeight)
  );
  
  return Math.round(overallScore);
};
