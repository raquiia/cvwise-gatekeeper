
import type { JobOffer } from '../job-offers/types';
import type { CandidateData } from '../candidateService';
import { semanticMatchingService } from '../../semantic/semanticMatchingService';
import { ensureArray, ensureStringArray, hasProperty, isUndefinedObject } from '@/utils/candidateUtils';
import { CandidateJobMatch, MatchDetails } from './types';

/**
 * Calculates match between a candidate's skills and required job skills
 */
export function calculateSkillsMatch(
  candidateSkills: string[],
  jobSkills: string[]
): {
  matchedSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  matchPercentage: number;
} {
  // Ensure inputs are valid arrays
  const safeJobSkills = Array.isArray(jobSkills) ? jobSkills : [];
  const safeCandidateSkills = Array.isArray(candidateSkills) ? candidateSkills : [];
  
  // Match skills
  const matchedSkills = safeCandidateSkills.filter(skill => 
    safeJobSkills.some(jobSkill => {
      // Direct match
      if (jobSkill === skill) return true;
      
      // Partial match with job skill containing candidate skill or vice versa
      if (jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(jobSkill.toLowerCase())) return true;
      
      // Try semantic matching for complex matches
      return semanticMatchingService.isSemanticMatch({
        query: jobSkill,
        candidateText: skill
      });
    })
  );
  
  const missingSkills = safeJobSkills.filter(skill => 
    !matchedSkills.some(matched => 
      matched.toLowerCase() === skill.toLowerCase() || 
      matched.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(matched.toLowerCase())
    )
  );
  
  const additionalSkills = safeCandidateSkills.filter(skill => 
    !safeJobSkills.some(jobSkill => 
      jobSkill.toLowerCase() === skill.toLowerCase() || 
      jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );
  
  const matchPercentage = safeJobSkills.length > 0
    ? (matchedSkills.length / safeJobSkills.length) * 100
    : 0;

  return {
    matchedSkills,
    missingSkills,
    additionalSkills,
    matchPercentage: Math.round(matchPercentage) // Round to nearest integer
  };
}

/**
 * Calculate match score between a candidate and a job offer
 */
export async function calculateCandidateJobMatch(
  candidate: CandidateData, 
  jobOffer: JobOffer
): Promise<CandidateJobMatch> {
  try {
    console.log('Calculating match between candidate and job offer:', 
      candidate.id, jobOffer.id);
    
    // Extract skills, ensuring they are arrays
    const candidateSkills = ensureStringArray(candidate.skills);
    const jobSkills = ensureStringArray(jobOffer.required_skills);
    
    // Calculate skills match
    const { 
      matchedSkills, 
      missingSkills, 
      additionalSkills, 
      matchPercentage: skillMatchPercentage 
    } = calculateSkillsMatch(candidateSkills, jobSkills);
    
    // Match experience - improve calculation with more precise scoring
    const candidateExperience = candidate.years_experience || 0;
    const minExperience = jobOffer.experience_years_min || 0;
    const maxExperience = jobOffer.experience_years_max || minExperience + 5;
    
    // Calculate experience match score on a scale of 0-100
    let experienceScore = 0;
    
    if (candidateExperience >= minExperience) {
      // Candidate meets minimum requirement
      if (candidateExperience <= maxExperience) {
        // Candidate is within the ideal range
        experienceScore = 100;
      } else {
        // Candidate is overqualified but still a match
        // Score decreases as experience exceeds max, but never below 70
        const overQualifiedPenalty = Math.min(30, (candidateExperience - maxExperience) * 5);
        experienceScore = 100 - overQualifiedPenalty;
      }
    } else if (minExperience > 0) {
      // Candidate doesn't meet minimum, but might be close
      experienceScore = Math.min(70, (candidateExperience / minExperience) * 80);
    }
    
    const experienceMatch = {
      required: minExperience,
      candidate: candidateExperience,
      match: candidateExperience >= minExperience,
      score: experienceScore
    };
    
    // Match location with improved semantic matching
    const jobLocation = jobOffer.location || '';
    const candidateLocation = candidate.location || '';
    
    // Calculate location match score
    let locationScore = 0;
    let locationMatches = false;
    
    if (jobLocation && candidateLocation) {
      // Direct match
      if (jobLocation.toLowerCase() === candidateLocation.toLowerCase()) {
        locationMatches = true;
        locationScore = 100;
      } 
      // Location contains each other
      else if (jobLocation.toLowerCase().includes(candidateLocation.toLowerCase()) ||
          candidateLocation.toLowerCase().includes(jobLocation.toLowerCase())) {
        locationMatches = true;
        locationScore = 90;
      }
      // Try semantic matching
      else if (semanticMatchingService.isSemanticMatch({
        query: jobLocation,
        candidateText: candidateLocation
      })) {
        locationMatches = true;
        locationScore = 80;
      }
      // Partial match with city/region
      else {
        const jobTokens = jobLocation.toLowerCase().split(/[,\s]+/);
        const candidateTokens = candidateLocation.toLowerCase().split(/[,\s]+/);
        
        const commonTokens = jobTokens.filter(token => 
          candidateTokens.some(candidateToken => candidateToken.includes(token) || token.includes(candidateToken))
        );
        
        if (commonTokens.length > 0) {
          locationMatches = true;
          locationScore = 70 + (commonTokens.length / Math.max(jobTokens.length, candidateTokens.length)) * 30;
        }
      }
    }
    
    const locationMatch = {
      required: jobLocation,
      candidate: candidateLocation,
      match: locationMatches,
      score: locationScore
    };
    
    // Match education level with improved scoring
    const jobEducation = jobOffer.education_level || '';
    let educationMatches = false;
    let educationScore = 0;
    let candidateHighestEducation = '';
    
    const candidateEducation = ensureArray(candidate.education);
    
    // Education level mapping (higher number = higher level)
    const educationLevels: Record<string, number> = {
      'bac': 1,
      'bac+2': 2, 
      'dut': 2, 
      'bts': 2,
      'licence': 3, 
      'bac+3': 3,
      'master': 5, 
      'bac+5': 5, 
      'ingénieur': 5,
      'doctorat': 8, 
      'phd': 8, 
      'bac+8': 8
    };
    
    if (candidateEducation.length > 0) {
      // Extract highest education level from candidate
      const candidateEduStrings = candidateEducation.map(edu => {
        if (typeof edu === 'string') return edu;
        if (hasProperty(edu, 'degree') && typeof edu.degree === 'string') return edu.degree;
        if (hasProperty(edu, 'diploma') && typeof edu.diploma === 'string') return edu.diploma;
        if (hasProperty(edu, 'level') && typeof edu.level === 'string') return edu.level;
        return '';
      }).filter(Boolean);
      
      candidateHighestEducation = candidateEduStrings.join(' ');
      
      if (jobEducation && candidateHighestEducation) {
        // Direct match
        if (candidateHighestEducation.toLowerCase().includes(jobEducation.toLowerCase())) {
          educationMatches = true;
          educationScore = 100;
        } 
        // Try to match education levels
        else {
          let jobLevel = 0;
          let candidateLevel = 0;
          
          // Find job education level
          for (const [level, value] of Object.entries(educationLevels)) {
            if (jobEducation.toLowerCase().includes(level.toLowerCase())) {
              jobLevel = value;
              break;
            }
          }
          
          // Find candidate's highest education level
          for (const [level, value] of Object.entries(educationLevels)) {
            if (candidateHighestEducation.toLowerCase().includes(level.toLowerCase())) {
              candidateLevel = Math.max(candidateLevel, value);
            }
          }
          
          if (jobLevel > 0 && candidateLevel > 0) {
            if (candidateLevel >= jobLevel) {
              // Candidate meets or exceeds required education
              educationMatches = true;
              educationScore = 100;
            } else {
              // Candidate has some education but not enough
              educationScore = (candidateLevel / jobLevel) * 80;
            }
          } else if (semanticMatchingService.isSemanticMatch({
            query: jobEducation,
            candidateText: candidateHighestEducation
          })) {
            // Try semantic matching as fallback
            educationMatches = true;
            educationScore = 85;
          }
        }
      }
    }
    
    const educationMatch = {
      required: jobEducation,
      candidate: candidateHighestEducation,
      match: educationMatches,
      score: educationScore
    };
    
    // Calculate overall match score with weighted components
    // Adjust weights based on importance
    const skillsWeight = 0.5;      // Skills are most important
    const experienceWeight = 0.25;  // Experience is very important
    const locationWeight = 0.15;    // Location has moderate importance
    const educationWeight = 0.1;    // Education has less importance
    
    const overallScore = Math.round(
      (skillMatchPercentage * skillsWeight) +
      (experienceMatch.score * experienceWeight) +
      (locationMatch.score * locationWeight) +
      (educationMatch.score * educationWeight)
    );
    
    return {
      score: overallScore,
      details: {
        skills: {
          matched: matchedSkills,
          missing: missingSkills,
          additional: additionalSkills,
          matchPercentage: skillMatchPercentage
        },
        experienceLevel: {
          required: minExperience,
          candidate: candidateExperience,
          match: experienceMatch.match,
          score: experienceMatch.score
        },
        location: {
          required: jobLocation,
          candidate: candidateLocation,
          match: locationMatch.match,
          score: locationMatch.score
        },
        educationLevel: {
          required: jobEducation,
          candidate: candidateHighestEducation,
          match: educationMatch.match,
          score: educationMatch.score
        },
        overall: overallScore
      }
    };
  } catch (error) {
    console.error('Error calculating job match:', error);
    return {
      score: 0,
      details: {
        skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
        experienceLevel: { required: 0, candidate: 0, match: false, score: 0 },
        location: { required: '', candidate: '', match: false, score: 0 },
        educationLevel: { required: '', candidate: '', match: false, score: 0 },
        overall: 0
      }
    };
  }
}

/**
 * Create a default/empty match details when no active job offer is present
 */
export function createDefaultMatchDetails(candidate: CandidateData): CandidateJobMatch {
  return {
    score: candidate.score || 0,
    details: {
      skills: {
        matched: [],
        missing: [],
        additional: [],
        matchPercentage: 0
      },
      experienceLevel: {
        required: 0,
        candidate: candidate.years_experience || 0,
        match: false,
        score: 0
      },
      location: {
        required: '',
        candidate: candidate.location || '',
        match: false,
        score: 0
      },
      educationLevel: {
        required: '',
        candidate: '',
        match: false,
        score: 0
      },
      overall: candidate.score || 0
    }
  };
}

/**
 * Convert MatchDetails to JSON format for database storage
 */
export function matchDetailsToJson(details: MatchDetails): any {
  return {
    skills: details.skills || { matched: [], missing: [], additional: [], matchPercentage: 0 },
    experienceLevel: details.experienceLevel || { required: 0, candidate: 0, match: false, score: 0 },
    location: details.location || { required: '', candidate: '', match: false, score: 0 },
    educationLevel: details.educationLevel || { required: '', candidate: '', match: false, score: 0 },
    overall: details.overall || 0
  };
}
