
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
      if (jobSkill.includes(skill) || skill.includes(jobSkill)) return true;
      
      // Try semantic matching for complex matches
      return semanticMatchingService.isSemanticMatch({
        query: jobSkill,
        candidateText: skill
      });
    })
  );
  
  const missingSkills = safeJobSkills.filter(skill => 
    !matchedSkills.some(matched => 
      matched === skill || 
      matched.includes(skill) || 
      skill.includes(matched)
    )
  );
  
  const additionalSkills = safeCandidateSkills.filter(skill => 
    !safeJobSkills.some(jobSkill => 
      jobSkill === skill || 
      jobSkill.includes(skill) || 
      skill.includes(jobSkill)
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
    
    // Match experience
    const experienceMatch = {
      required: jobOffer.experience_years_min || 0,
      candidate: candidate.years_experience || 0,
      match: (candidate.years_experience || 0) >= (jobOffer.experience_years_min || 0)
    };
    
    // Match location
    const locationMatch = {
      required: jobOffer.location || '',
      candidate: candidate.location || '',
      match: false
    };
    
    if (jobOffer.location && candidate.location) {
      // Direct match
      if (jobOffer.location.toLowerCase() === candidate.location.toLowerCase()) {
        locationMatch.match = true;
      } else {
        // Check if locations contain each other (e.g., "Paris" in "Paris, France")
        locationMatch.match = 
          jobOffer.location.toLowerCase().includes(candidate.location.toLowerCase()) ||
          candidate.location.toLowerCase().includes(jobOffer.location.toLowerCase());
      }
    }
    
    // Match education level
    const educationMatch = {
      required: jobOffer.education_level || '',
      candidate: '',
      match: false
    };
    
    const candidateEducation = ensureArray(candidate.education);
    
    if (candidateEducation.length > 0) {
      // Extract highest education level from candidate
      const candidateEduString = candidateEducation.map(edu => {
        if (typeof edu === 'string') return edu;
        if (hasProperty(edu, 'degree') && typeof edu.degree === 'string') return edu.degree;
        if (hasProperty(edu, 'diploma') && typeof edu.diploma === 'string') return edu.diploma;
        return '';
      }).join(' ');
      
      educationMatch.candidate = candidateEduString;
      
      if (jobOffer.education_level) {
        educationMatch.match = candidateEduString.toLowerCase().includes(
          jobOffer.education_level.toLowerCase()
        );
      }
    }
    
    // Calculate overall match score (weighted)
    const skillsWeight = 0.5;
    const experienceWeight = 0.3;
    const locationWeight = 0.1;
    const educationWeight = 0.1;
    
    const overallScore = Math.round(
      (skillMatchPercentage * skillsWeight) +
      (experienceMatch.match ? 100 : Math.min(100, (candidate.years_experience || 0) / (jobOffer.experience_years_min || 1) * 100)) * experienceWeight +
      (locationMatch.match ? 100 : 0) * locationWeight +
      (educationMatch.match ? 100 : 0) * educationWeight
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
        experienceLevel: experienceMatch,
        location: locationMatch,
        educationLevel: educationMatch,
        overall: overallScore
      }
    };
  } catch (error) {
    console.error('Error calculating job match:', error);
    return {
      score: 0,
      details: {
        skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
        experienceLevel: { required: 0, candidate: 0, match: false },
        location: { required: '', candidate: '', match: false },
        educationLevel: { required: '', candidate: '', match: false },
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
        match: false
      },
      location: {
        required: '',
        candidate: candidate.location || '',
        match: false
      },
      educationLevel: {
        required: '',
        candidate: '',
        match: false
      },
      overall: candidate.score || 0
    }
  };
}
