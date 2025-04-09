
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
 * Calculate a smarter candidate score that considers quality factors
 * rather than just profile completeness
 */
export function calculateCandidateQualityScore(candidateData: any): number {
  if (!candidateData) return 0;
  
  // Base score starts at 50
  let baseScore = 50;
  
  // Skills quality - award points for relevant/in-demand skills
  // This is a simplified version - in a real system, you would have a list of in-demand skills
  const inDemandSkills = [
    'javascript', 'python', 'react', 'nodejs', 'typescript', 'aws', 'azure', 
    'docker', 'kubernetes', 'machine learning', 'data science', 'devops',
    'product management', 'ui/ux', 'agile', 'scrum', 'java', 'c#', '.net',
    'sql', 'nosql', 'mongodb', 'postgresql', 'leadership'
  ];
  
  const candidateSkills = candidateData.skills || [];
  const normalizedCandidateSkills = candidateSkills.map((skill: string) => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // Count in-demand skills (with partial matching)
  let inDemandSkillCount = 0;
  for (const skill of normalizedCandidateSkills) {
    if (inDemandSkills.some(inDemandSkill => 
      skill === inDemandSkill || 
      skill.includes(inDemandSkill) || 
      inDemandSkill.includes(skill)
    )) {
      inDemandSkillCount++;
    }
  }
  
  // Award up to 20 points for in-demand skills (capped at 20 points)
  const skillsScore = Math.min(20, inDemandSkillCount * 2);
  
  // Experience quality - award points for years of experience
  const experienceYears = candidateData.years_experience || 0;
  // 0-15 points based on years of experience (capped at 15 years)
  const experienceScore = Math.min(15, experienceYears);
  
  // Education quality - award points for education level
  let educationScore = 0;
  const education = candidateData.education || [];
  
  // Check for highest education level
  if (education.length > 0) {
    // Award points based on highest education (simplified)
    // In a real system, you'd parse and categorize degrees more intelligently
    const degrees = education.map((edu: any) => 
      (edu.degree || '').toLowerCase()
    );
    
    if (degrees.some(d => d.includes('phd') || d.includes('doctorate'))) {
      educationScore = 15;
    } else if (degrees.some(d => d.includes('master') || d.includes('mba'))) {
      educationScore = 12;
    } else if (degrees.some(d => d.includes('bachelor') || d.includes('license'))) {
      educationScore = 10;
    } else if (degrees.some(d => d.includes('associate') || d.includes('certificate'))) {
      educationScore = 7;
    } else {
      educationScore = 5; // Some education listed but not recognized
    }
  }
  
  // Calculate final score
  const finalScore = Math.min(95, 
    baseScore + skillsScore + experienceScore + educationScore
  );
  
  return Math.round(finalScore);
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
