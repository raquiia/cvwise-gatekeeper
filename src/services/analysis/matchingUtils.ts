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
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  // Count matching skills with weighted importance
  let matchScore = 0;
  const totalJobSkills = normalizedJobSkills.length;
  
  for (const jobSkill of normalizedJobSkills) {
    // Check for different levels of matching
    const exactMatch = normalizedCandidateSkills.some(candidateSkill => candidateSkill === jobSkill);
    const containsMatch = !exactMatch && normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    );
    
    // Weight exact matches higher than partial matches
    if (exactMatch) {
      matchScore += 1.0; // Full point for exact match
    } else if (containsMatch) {
      matchScore += 0.7; // Partial point for partial match
    }
  }
  
  // Calculate percentage with higher precision
  return Math.round((matchScore / totalJobSkills) * 100);
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
    jobSkills: jobPosition?.required_skills,
    candidateExp: candidateData?.years_experience,
    jobExpMin: jobPosition?.experience_years_min,
    jobExpMax: jobPosition?.experience_years_max,
    candidateLocation: candidateData?.location,
    jobLocation: jobPosition?.location
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
  const candidateSkills = Array.isArray(candidateData.skills) ? candidateData.skills : 
                         (typeof candidateData.skills === 'object' && candidateData.skills !== null ? 
                          Object.values(candidateData.skills) : []);
                          
  const jobSkills = Array.isArray(jobPosition.required_skills) ? 
    jobPosition.required_skills : 
    (typeof jobPosition.required_skills === 'object' && jobPosition.required_skills !== null ? 
      Object.values(jobPosition.required_skills) : 
      []);

  // Calculate skills match
  const skillsMatch = calculateSkillMatch(candidateSkills, jobSkills);
  
  // Experience match - if job requires X years, candidate should have at least X years
  const requiredYearsMin = jobPosition.experience_years_min || jobPosition.required_years_experience || 0;
  const requiredYearsMax = jobPosition.experience_years_max || requiredYearsMin + 5 || 0;
  const candidateYears = candidateData.years_experience || 0;
  
  let experienceMatch = 0;
  
  if (requiredYearsMin <= 0) {
    experienceMatch = 100; // No experience required
  } else if (candidateYears >= requiredYearsMin && candidateYears <= requiredYearsMax) {
    // Perfect match with a gradient for exact matches
    const idealYears = (requiredYearsMin + requiredYearsMax) / 2;
    const distanceFromIdeal = Math.abs(candidateYears - idealYears);
    const rangeSize = (requiredYearsMax - requiredYearsMin) / 2;
    
    // Higher score the closer they are to the ideal years
    experienceMatch = 100 - Math.round((distanceFromIdeal / rangeSize) * 15);
    experienceMatch = Math.max(85, experienceMatch); // Minimum 85% if within range
  } else if (candidateYears > requiredYearsMax) {
    // Over-qualified with a more significant penalty
    experienceMatch = Math.max(60, 100 - ((candidateYears - requiredYearsMax) * 7));
  } else if (candidateYears > 0) {
    // Some experience but under the minimum - more distinctive scoring
    experienceMatch = Math.min(80, Math.round((candidateYears / requiredYearsMin) * 85));
  }
  
  // For location match - make more distinctive
  let locationMatch = 30; // Default - lower to create more differentiation
  
  if (jobPosition.location && candidateData.location) {
    // Use more nuanced location matching
    const jobLocation = jobPosition.location.toLowerCase().trim();
    const candidateLocation = candidateData.location.toLowerCase().trim();
    
    if (jobLocation === candidateLocation) {
      locationMatch = 100; // Exact match
    } else if (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation)) {
      // Partial string match - more granular
      const shortestLength = Math.min(jobLocation.length, candidateLocation.length);
      const longestLength = Math.max(jobLocation.length, candidateLocation.length);
      const similarityRatio = shortestLength / longestLength;
      
      locationMatch = Math.round(85 * similarityRatio);
    } else {
      // Check for parts matching (city/region/country)
      const locationParts = jobLocation.split(/[,\s]+/).filter(Boolean);
      const candidateLocationParts = candidateLocation.split(/[,\s]+/).filter(Boolean);
      
      let partMatches = 0;
      for (const part of locationParts) {
        if (candidateLocationParts.includes(part) && part.length > 2) {
          partMatches++;
        }
      }
      
      if (partMatches > 0) {
        locationMatch = Math.min(70, 40 + (partMatches * 15)); // Base 40% + 15% per matching part
      }
    }
  }
  
  // Other factors match - consider education & cultural fit
  const educationMatch = calculateEducationMatch(
    Array.isArray(candidateData.education) ? candidateData.education : [], 
    jobPosition.education_level
  );
  
  // Base candidate quality still matters but with lower weight to differentiate more
  const baseQualityFactor = (candidateData.score || 75) * 0.2;
  
  const otherFactorsMatch = educationMatch * 0.8 + baseQualityFactor;
  
  // Calculate weighted score - ensure we round only at the end for more differentiation
  const overallScore = Math.round(
    (skillsMatch * skillsWeight) + 
    (experienceMatch * experienceWeight) + 
    (otherFactorsMatch * otherWeight)
  );
  
  // Find matched and missing skills
  const matchedSkills = findMatchedSkills(candidateSkills, jobSkills);
  const missingSkills = findMissingSkills(candidateSkills, jobSkills);
  
  // Log the calculated scores for debugging
  console.log("Match calculation results:", {
    skillsMatch,
    experienceMatch,
    educationMatch,
    locationMatch,
    otherFactorsMatch,
    overallScore,
    matchedSkills: matchedSkills.length,
    missingSkills: missingSkills.length
  });
  
  return {
    score: overallScore,
    details: {
      skillsMatch: skillsMatch,
      experienceMatch: experienceMatch,
      otherFactorsMatch: otherFactorsMatch,
      matchedSkills: matchedSkills,
      missingSkills: missingSkills
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
    'associate', 'bachelor', 'license', 'undergraduate', 'bac+3', 'bac+4',
    'master', 'mba', 'graduate', 'bac+5',
    'phd', 'doctorate', 'doctoral'
  ];
  
  // Education level weights - to create more differentiation
  const educationWeights: {[key: string]: number} = {
    'high school': 10,
    'secondary': 20,
    'associate': 40,
    'bachelor': 60,
    'license': 60,
    'undergraduate': 55,
    'bac+3': 60,
    'bac+4': 70,
    'master': 80,
    'mba': 85,
    'graduate': 80,
    'bac+5': 85,
    'phd': 100,
    'doctorate': 100,
    'doctoral': 100
  };
  
  // Determine required education level index
  const normalizedJobLevel = jobEducationLevel.toLowerCase();
  let requiredLevelIndex = -1;
  let requiredLevelWeight = 50;
  
  for (let i = 0; i < educationLevels.length; i++) {
    if (normalizedJobLevel.includes(educationLevels[i])) {
      requiredLevelIndex = i;
      requiredLevelWeight = educationWeights[educationLevels[i]] || 50;
      break;
    }
  }
  
  if (requiredLevelIndex === -1) {
    return 50; // Could not determine level
  }
  
  // Find candidate's highest education level
  let highestLevelIndex = -1;
  let highestLevelWeight = 0;
  
  for (const edu of candidateEducation) {
    const degree = (edu.degree || '').toLowerCase();
    
    for (let i = 0; i < educationLevels.length; i++) {
      if (degree.includes(educationLevels[i]) && i > highestLevelIndex) {
        highestLevelIndex = i;
        highestLevelWeight = educationWeights[educationLevels[i]] || highestLevelWeight;
      }
    }
  }
  
  if (highestLevelIndex === -1) {
    return 30; // No recognized education
  }
  
  // Calculate match based on difference between required and actual level
  if (highestLevelIndex >= requiredLevelIndex) {
    // Exceed or meets requirements - but don't give full 100% for excessive qualifications
    const overQualifiedPenalty = highestLevelIndex > requiredLevelIndex + 2 ? 10 : 0;
    return 100 - overQualifiedPenalty;
  } else {
    // Partial match - more nuanced calculation
    const levelDifference = requiredLevelIndex - highestLevelIndex;
    const weightRatio = highestLevelWeight / requiredLevelWeight;
    
    return Math.round(Math.min(90, weightRatio * 100 * (1 - (levelDifference * 0.15))));
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
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
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
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
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
  [key: string]: any; // Index signature for JSON compatibility
}

export interface MatchResult {
  score: number;
  details: MatchDetails;
}
