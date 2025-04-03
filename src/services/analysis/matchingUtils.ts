
/**
 * Utilities for matching candidates to job positions
 */

/**
 * Calculate skill match percentage between candidate skills and job required skills
 */
export function calculateSkillMatch(candidateSkills: string[], jobSkills: string[]): number {
  if (!jobSkills || jobSkills.length === 0) return 100;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  // Normalize skills for comparison (lowercase)
  const normalizedCandidateSkills = candidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  const normalizedJobSkills = jobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // Count matching skills
  let matchCount = 0;
  for (const jobSkill of normalizedJobSkills) {
    // Check for exact match or partial match (e.g. "JavaScript" matches "JavaScript (ES6)")
    if (normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill === jobSkill || 
      candidateSkill.includes(jobSkill) || 
      jobSkill.includes(candidateSkill)
    )) {
      matchCount++;
    }
  }
  
  // Calculate percentage
  return Math.round((matchCount / normalizedJobSkills.length) * 100);
}

/**
 * Calculate an overall match score between a candidate and a job position
 */
export function calculateOverallMatch(
  candidateData: any, 
  jobPosition: any
): { score: number; details: MatchDetails } {
  // Initialize scoring factors
  const skillsWeight = 0.5;     // 50% of the score comes from skills match
  const experienceWeight = 0.3; // 30% from experience
  const otherWeight = 0.2;      // 20% from other factors

  // Calculate skills match
  const skillsMatch = calculateSkillMatch(
    candidateData.skills || [], 
    jobPosition.skills || []
  );
  
  // Experience match - if job requires X years, candidate should have at least X years
  const requiredYears = jobPosition.required_years_experience || 0;
  const candidateYears = candidateData.years_experience || 0;
  const experienceMatch = requiredYears <= 0 
    ? 100 
    : Math.min(100, Math.round((candidateYears / requiredYears) * 100));
  
  // For now, other factors are just a bonus score based on candidate's general score
  const otherFactorsMatch = candidateData.score || 75;
  
  // Calculate weighted score
  const overallScore = Math.round(
    (skillsMatch * skillsWeight) + 
    (experienceMatch * experienceWeight) + 
    (otherFactorsMatch * otherWeight)
  );
  
  return {
    score: overallScore,
    details: {
      skillsMatch: skillsMatch,
      experienceMatch: experienceMatch,
      otherFactorsMatch: otherFactorsMatch,
      matchedSkills: findMatchedSkills(candidateData.skills || [], jobPosition.skills || []),
      missingSkills: findMissingSkills(candidateData.skills || [], jobPosition.skills || [])
    }
  };
}

/**
 * Find skills that match between candidate and job position
 */
export function findMatchedSkills(candidateSkills: string[], jobSkills: string[]): string[] {
  if (!jobSkills || jobSkills.length === 0 || !candidateSkills || candidateSkills.length === 0) {
    return [];
  }
  
  // Normalize skills
  const normalizedCandidateSkills = candidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  const normalizedJobSkills = jobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // Find matching job skills (using original format)
  return jobSkills.filter((skill, index) => 
    normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill === normalizedJobSkills[index] ||
      candidateSkill.includes(normalizedJobSkills[index]) || 
      normalizedJobSkills[index].includes(candidateSkill)
    )
  );
}

/**
 * Find skills that are required by job but missing from candidate
 */
export function findMissingSkills(candidateSkills: string[], jobSkills: string[]): string[] {
  if (!jobSkills || jobSkills.length === 0) {
    return [];
  }
  
  if (!candidateSkills || candidateSkills.length === 0) {
    return [...jobSkills];
  }
  
  // Normalize skills
  const normalizedCandidateSkills = candidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  const normalizedJobSkills = jobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // Find missing skills (using original format)
  return jobSkills.filter((skill, index) => 
    !normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill === normalizedJobSkills[index] ||
      candidateSkill.includes(normalizedJobSkills[index]) || 
      normalizedJobSkills[index].includes(candidateSkill)
    )
  );
}

/**
 * Types for match results
 */
export interface MatchDetails {
  skillsMatch: number;
  experienceMatch: number;
  otherFactorsMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface MatchResult {
  score: number;
  details: MatchDetails;
}
