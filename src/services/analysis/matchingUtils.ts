
/**
 * Utilities for matching candidates to job positions
 */

/**
 * Calculate skill match percentage between candidate skills and job required skills
 */
export function calculateSkillMatch(candidateSkills: string[], jobSkills: string[]): number {
  if (!jobSkills || jobSkills.length === 0) return 100;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  // Ensure we're working with arrays
  const normCandidateSkills = Array.isArray(candidateSkills) ? candidateSkills : [candidateSkills];
  const normJobSkills = Array.isArray(jobSkills) ? jobSkills : [jobSkills];

  // Normalize skills for comparison (lowercase)
  const normalizedCandidateSkills = normCandidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
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
  // Log the inputs for debugging
  console.log("Calculating match with:", { 
    candidateSkills: candidateData?.skills, 
    jobSkills: jobPosition?.required_skills 
  });

  // Initialize scoring factors with weighted importance
  const skillsWeight = 0.5;     // 50% of the score comes from skills match
  const experienceWeight = 0.3; // 30% from experience
  const otherWeight = 0.2;      // 20% from other factors

  // Check for required data
  if (!candidateData || !jobPosition) {
    console.error("Missing candidate or job position data for match calculation");
    return {
      score: 0,
      details: {
        skillsMatch: 0,
        experienceMatch: 0,
        otherFactorsMatch: 0,
        matchedSkills: [],
        missingSkills: []
      }
    };
  }

  // Ensure skills are arrays
  const candidateSkills = Array.isArray(candidateData.skills) ? candidateData.skills : [];
  const jobSkills = Array.isArray(jobPosition.required_skills) ? 
    jobPosition.required_skills : 
    (typeof jobPosition.required_skills === 'object' && jobPosition.required_skills !== null ? 
      Object.values(jobPosition.required_skills) : 
      []);

  // Calculate skills match
  const skillsMatch = calculateSkillMatch(candidateSkills, jobSkills);
  
  // Experience match - if job requires X years, candidate should have at least X years
  const requiredYearsMin = jobPosition.experience_years_min || jobPosition.required_years_experience || 0;
  const requiredYearsMax = jobPosition.experience_years_max || requiredYearsMin + 3 || 0;
  const candidateYears = candidateData.years_experience || 0;
  
  let experienceMatch = 0;
  
  if (requiredYearsMin <= 0) {
    experienceMatch = 100; // No experience required
  } else if (candidateYears >= requiredYearsMin && candidateYears <= requiredYearsMax) {
    experienceMatch = 100; // Perfect match
  } else if (candidateYears > requiredYearsMax) {
    // Over-qualified but still a good match
    experienceMatch = Math.max(70, 100 - ((candidateYears - requiredYearsMax) * 5));
  } else if (candidateYears > 0) {
    // Some experience but under the minimum
    experienceMatch = Math.round((candidateYears / requiredYearsMin) * 100);
  }
  
  // For location match
  let locationMatch = 50; // Default
  
  if (jobPosition.location && candidateData.location) {
    // Simple match - checks if locations contain each other
    const jobLocation = jobPosition.location.toLowerCase();
    const candidateLocation = candidateData.location.toLowerCase();
    
    if (jobLocation === candidateLocation) {
      locationMatch = 100; // Exact match
    } else if (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation)) {
      locationMatch = 85; // Partial match
    } else {
      // Check for major cities/regions in the same country
      // This is simplistic - in a real system you'd use geography APIs
      const locationParts = jobLocation.split(/[,\s]+/).filter(Boolean);
      const candidateLocationParts = candidateLocation.split(/[,\s]+/).filter(Boolean);
      
      for (const part of locationParts) {
        if (candidateLocationParts.includes(part) && part.length > 2) {
          locationMatch = 70; // Same region/country
          break;
        }
      }
    }
  }
  
  // Other factors match - consider education & cultural fit
  const otherFactorsMatch = 
    calculateEducationMatch(
      Array.isArray(candidateData.education) ? candidateData.education : [], 
      jobPosition.education_level
    ) * 0.7 + 
    (candidateData.score || 75) * 0.3; // Base candidate quality still matters
  
  // Calculate weighted score
  const overallScore = Math.round(
    (skillsMatch * skillsWeight) + 
    (experienceMatch * experienceWeight) + 
    (otherFactorsMatch * otherWeight)
  );
  
  // Log the calculated scores for debugging
  console.log("Match calculation results:", {
    skillsMatch,
    experienceMatch,
    otherFactorsMatch,
    overallScore
  });
  
  return {
    score: overallScore,
    details: {
      skillsMatch: skillsMatch,
      experienceMatch: experienceMatch,
      otherFactorsMatch: otherFactorsMatch,
      matchedSkills: findMatchedSkills(candidateSkills, jobSkills),
      missingSkills: findMissingSkills(candidateSkills, jobSkills)
    }
  };
}

/**
 * Calculate education match score
 */
function calculateEducationMatch(candidateEducation: any[], jobEducationLevel: string | null): number {
  if (!jobEducationLevel || !candidateEducation || candidateEducation.length === 0) {
    return 50; // Default match when no specific requirements
  }
  
  // Education levels in ascending order
  const educationLevels = [
    'high school', 'secondary', 
    'associate', 'bachelor', 'license', 'undergraduate',
    'master', 'mba', 'graduate',
    'phd', 'doctorate', 'doctoral'
  ];
  
  // Determine required education level index
  const normalizedJobLevel = jobEducationLevel.toLowerCase();
  let requiredLevelIndex = -1;
  
  for (let i = 0; i < educationLevels.length; i++) {
    if (normalizedJobLevel.includes(educationLevels[i])) {
      requiredLevelIndex = i;
      break;
    }
  }
  
  if (requiredLevelIndex === -1) {
    return 50; // Could not determine level
  }
  
  // Find candidate's highest education level
  let highestLevelIndex = -1;
  
  for (const edu of candidateEducation) {
    const degree = (edu.degree || '').toLowerCase();
    
    for (let i = 0; i < educationLevels.length; i++) {
      if (degree.includes(educationLevels[i]) && i > highestLevelIndex) {
        highestLevelIndex = i;
      }
    }
  }
  
  if (highestLevelIndex === -1) {
    return 30; // No recognized education
  }
  
  // Calculate match based on difference between required and actual level
  if (highestLevelIndex >= requiredLevelIndex) {
    return 100; // Meets or exceeds requirements
  } else {
    // Partial match based on how close the candidate is to required level
    return Math.round((highestLevelIndex / requiredLevelIndex) * 100);
  }
}

/**
 * Find skills that match between candidate and job position
 */
export function findMatchedSkills(candidateSkills: string[], jobSkills: string[]): string[] {
  if (!jobSkills || jobSkills.length === 0 || !candidateSkills || candidateSkills.length === 0) {
    return [];
  }
  
  // Ensure we're working with arrays
  const normCandidateSkills = Array.isArray(candidateSkills) ? candidateSkills : [candidateSkills];
  const normJobSkills = Array.isArray(jobSkills) ? jobSkills : [jobSkills];
  
  // Normalize skills
  const normalizedCandidateSkills = normCandidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // Find matching job skills (using original format)
  return normJobSkills.filter((skill, index) => 
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
  
  // Ensure we're working with arrays
  const normCandidateSkills = Array.isArray(candidateSkills) ? candidateSkills : [candidateSkills];
  const normJobSkills = Array.isArray(jobSkills) ? jobSkills : [jobSkills];
  
  if (normCandidateSkills.length === 0) {
    return [...normJobSkills];
  }
  
  // Normalize skills
  const normalizedCandidateSkills = normCandidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // Find missing skills (using original format)
  return normJobSkills.filter((skill, index) => 
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
