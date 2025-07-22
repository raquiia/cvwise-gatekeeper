
/**
 * Utilities for matching candidates to job positions - COMPLETELY REVISED
 */

/**
 * Calculate skill match percentage with improved semantic matching
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
  
  // Count matching skills with improved semantic matching
  let matchScore = 0;
  const totalJobSkills = normalizedJobSkills.length;
  
  for (const jobSkill of normalizedJobSkills) {
    // Check for different levels of matching
    const exactMatch = normalizedCandidateSkills.some(candidateSkill => candidateSkill === jobSkill);
    const semanticMatch = !exactMatch && normalizedCandidateSkills.some(candidateSkill => 
      isSkillSemanticallyRelated(candidateSkill, jobSkill)
    );
    const partialMatch = !exactMatch && !semanticMatch && normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    );
    
    // Weight matches appropriately
    if (exactMatch) {
      matchScore += 1.0; // Full point for exact match
    } else if (semanticMatch) {
      matchScore += 0.8; // High score for semantic match
    } else if (partialMatch) {
      matchScore += 0.3; // Lower score for partial match
    }
  }
  
  // Calculate percentage with minimum threshold
  const percentage = Math.min(100, Math.round((matchScore / totalJobSkills) * 100));
  
  return percentage;
}

/**
 * Improved semantic skill matching
 */
function isSkillSemanticallyRelated(skill1: string, skill2: string): boolean {
  const s1 = skill1.toLowerCase();
  const s2 = skill2.toLowerCase();
  
  // Enhanced skill relationships mapping
  const skillsMap: Record<string, string[]> = {
    'javascript': ['js', 'node.js', 'nodejs', 'react', 'vue', 'angular', 'typescript'],
    'typescript': ['ts', 'javascript', 'js', 'react', 'angular'],
    'react': ['reactjs', 'react.js', 'javascript', 'frontend', 'jsx'],
    'vue': ['vuejs', 'vue.js', 'javascript', 'frontend'],
    'angular': ['angularjs', 'javascript', 'frontend', 'typescript'],
    'python': ['py', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
    'java': ['spring', 'springboot', 'hibernate', 'jvm', 'kotlin'],
    'csharp': ['c#', '.net', 'dotnet', 'asp.net', 'visual studio'],
    'sql': ['mysql', 'postgresql', 'oracle', 'mssql', 'database'],
    'nosql': ['mongodb', 'cassandra', 'redis', 'dynamodb'],
    'aws': ['amazon web services', 'ec2', 's3', 'lambda', 'cloud'],
    'azure': ['microsoft azure', 'azure cloud', 'cloud'],
    'docker': ['containerization', 'kubernetes', 'devops'],
    'kubernetes': ['k8s', 'docker', 'orchestration', 'devops'],
    'devops': ['ci/cd', 'jenkins', 'gitlab', 'automation', 'docker'],
    'machine learning': ['ml', 'ai', 'data science', 'tensorflow', 'pytorch'],
    'data science': ['data analysis', 'statistics', 'python', 'r', 'machine learning'],
    'project management': ['gestion de projet', 'pmp', 'agile', 'scrum'],
    'agile': ['scrum', 'kanban', 'project management'],
    'scrum': ['agile', 'project management', 'scrum master'],
    'frontend': ['react', 'vue', 'angular', 'javascript', 'html', 'css'],
    'backend': ['api', 'server', 'database', 'microservices'],
    'fullstack': ['frontend', 'backend', 'react', 'node.js']
  };
  
  // Check bidirectional relationships
  for (const [key, variants] of Object.entries(skillsMap)) {
    if ((s1.includes(key) && variants.some(v => s2.includes(v))) ||
        (s2.includes(key) && variants.some(v => s1.includes(v))) ||
        (variants.some(v => s1.includes(v)) && s2.includes(key)) ||
        (variants.some(v => s2.includes(v)) && s1.includes(key))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate an overall match score with COMPLETELY REVISED ALGORITHM
 */
export function calculateOverallMatch(
  candidateData: any, 
  jobPosition: any
): { score: number; details: MatchDetails } {
  console.log("🔍 REVISED MATCHING - Calculating match with:", { 
    candidateSkills: candidateData?.skills, 
    jobSkills: jobPosition?.required_skills,
    candidateExp: candidateData?.years_experience,
    jobExpMin: jobPosition?.experience_years_min,
    jobExpMax: jobPosition?.experience_years_max,
    candidateLocation: candidateData?.location,
    jobLocation: jobPosition?.location
  });

  // NEW WEIGHTING: Skills become the dominant factor
  const skillsWeight = 0.75;     // 75% of the score comes from skills match (UP from 45%)
  const experienceWeight = 0.15; // 15% from experience (DOWN from 35%)
  const educationWeight = 0.05;  // 5% from education (DOWN from 15%)
  const locationWeight = 0.05;   // 5% from location (DOWN from 20%)

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

  // CRITICAL: Calculate skills match with MUCH higher weight
  const skillsMatch = calculateSkillMatch(candidateSkills, jobSkills);
  
  // CRITICAL THRESHOLD: If skills match is below 30%, cap the overall score at 25%
  if (skillsMatch < 30) {
    console.warn(`⚠️ CRITICAL: Skills match below threshold (${skillsMatch}%) - capping overall score`);
    
    const cappedDetails = {
      skillsMatch: skillsMatch,
      experienceMatch: 0,
      otherFactorsMatch: 20,
      matchedSkills: findMatchedSkills(candidateSkills, jobSkills),
      missingSkills: findMissingSkills(candidateSkills, jobSkills)
    };
    
    return {
      score: Math.min(25, skillsMatch),
      details: cappedDetails
    };
  }
  
  // Experience match - with RELEVANCE analysis
  const requiredYearsMin = jobPosition.experience_years_min || jobPosition.required_years_experience || 0;
  const requiredYearsMax = jobPosition.experience_years_max || requiredYearsMin + 5 || 0;
  const candidateYears = candidateData.years_experience || 0;
  
  let experienceMatch = 0;
  let relevantExperienceYears = 0;
  
  // Analyze experience RELEVANCE
  const candidateExperiences = candidateData.experiences || [];
  const jobTitle = jobPosition.title?.toLowerCase() || '';
  const jobDescription = jobPosition.description?.toLowerCase() || '';
  
  if (Array.isArray(candidateExperiences)) {
    relevantExperienceYears = candidateExperiences.reduce((total: number, exp: any) => {
      const expTitle = (exp.title || exp.position || '').toLowerCase();
      const expDescription = (exp.description || '').toLowerCase();
      
      // Check if experience is relevant to the job
      if (isExperienceRelevant(expTitle, expDescription, jobTitle, jobDescription, jobSkills)) {
        return total + (exp.duration_years || 1);
      }
      return total;
    }, 0);
  }
  
  // Score based on RELEVANT experience, not just total years
  if (requiredYearsMin <= 0) {
    experienceMatch = 100; // No experience required
  } else if (relevantExperienceYears >= requiredYearsMin) {
    if (relevantExperienceYears <= requiredYearsMax) {
      experienceMatch = 100; // Perfect relevant experience
    } else {
      experienceMatch = 85; // Over-qualified but relevant
    }
  } else if (relevantExperienceYears > 0) {
    experienceMatch = Math.min(70, (relevantExperienceYears / requiredYearsMin) * 80);
  } else if (candidateYears >= requiredYearsMin) {
    experienceMatch = 40; // Has years but not relevant experience
  } else {
    experienceMatch = Math.min(30, (candidateYears / requiredYearsMin) * 40);
  }
  
  // Education match - with RELEVANCE analysis
  const educationMatch = calculateEducationRelevance(
    candidateData.education || [], 
    jobTitle,
    jobDescription,
    jobSkills
  );
  
  // Location match - REDUCED importance
  let locationMatch = 50; // Default - higher baseline
  
  if (jobPosition.location && candidateData.location) {
    const jobLocation = jobPosition.location.toLowerCase().trim();
    const candidateLocation = candidateData.location.toLowerCase().trim();
    
    if (jobLocation === candidateLocation) {
      locationMatch = 100; // Exact match
    } else if (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation)) {
      locationMatch = 80; // Partial match
    } else if (candidateData.mobility && candidateData.mobility.toLowerCase().includes('oui')) {
      locationMatch = 70; // Mobile candidate
    } else {
      locationMatch = 30; // Different locations, not mobile
    }
  }
  
  // Calculate weighted score with NEW weights
  const overallScore = Math.round(
    (skillsMatch * skillsWeight) + 
    (experienceMatch * experienceWeight) + 
    (educationMatch * educationWeight) + 
    (locationMatch * locationWeight)
  );
  
  // Find matched and missing skills
  const matchedSkills = findMatchedSkills(candidateSkills, jobSkills);
  const missingSkills = findMissingSkills(candidateSkills, jobSkills);
  
  // Log the calculated scores for debugging
  console.log("🎯 REVISED MATCH RESULTS:", {
    skillsMatch: `${skillsMatch}% (weight: ${skillsWeight})`,
    experienceMatch: `${experienceMatch}% (${relevantExperienceYears}y relevant, weight: ${experienceWeight})`,
    educationMatch: `${educationMatch}% (weight: ${educationWeight})`,
    locationMatch: `${locationMatch}% (weight: ${locationWeight})`,
    overallScore: `${overallScore}%`,
    matchedSkills: matchedSkills.length,
    missingSkills: missingSkills.length
  });
  
  return {
    score: overallScore,
    details: {
      skillsMatch: skillsMatch,
      experienceMatch: experienceMatch,
      otherFactorsMatch: Math.round((educationMatch * educationWeight + locationMatch * locationWeight) / (educationWeight + locationWeight)),
      matchedSkills: matchedSkills,
      missingSkills: missingSkills
    }
  };
}

/**
 * Analyze if experience is relevant to the job
 */
function isExperienceRelevant(
  expTitle: string, 
  expDescription: string, 
  jobTitle: string, 
  jobDescription: string,
  jobSkills: string[]
): boolean {
  // Check for similar job titles
  const titleWords = jobTitle.split(/\s+/).filter(word => word.length > 2);
  const expTitleWords = expTitle.split(/\s+/).filter(word => word.length > 2);
  
  const titleSimilarity = titleWords.some(word => 
    expTitleWords.some(expWord => 
      expWord.includes(word) || word.includes(expWord)
    )
  );
  
  // Check for job skills mentioned in experience
  const skillsInExperience = jobSkills.some(skill => 
    expDescription.includes(skill.toLowerCase()) || 
    expTitle.includes(skill.toLowerCase())
  );
  
  // Check for domain similarity
  const techDomains = ['développement', 'development', 'software', 'web', 'application', 'système', 'it', 'informatique'];
  const managementDomains = ['projet', 'project', 'équipe', 'team', 'management', 'lead', 'chef'];
  
  const isDomainRelevant = (
    (techDomains.some(domain => jobTitle.includes(domain)) && 
     techDomains.some(domain => expTitle.includes(domain) || expDescription.includes(domain))) ||
    (managementDomains.some(domain => jobTitle.includes(domain)) && 
     managementDomains.some(domain => expTitle.includes(domain) || expDescription.includes(domain)))
  );
  
  return titleSimilarity || skillsInExperience || isDomainRelevant;
}

/**
 * Calculate education relevance to the job
 */
function calculateEducationRelevance(
  candidateEducation: any[], 
  jobTitle: string,
  jobDescription: string,
  jobSkills: string[]
): number {
  if (!candidateEducation || candidateEducation.length === 0) {
    return 30; // Penalty for no education info
  }
  
  let relevanceScore = 40; // Base score for having education
  
  const techFields = ['informatique', 'computer science', 'ingénieur', 'engineering', 'software', 
                     'mathématiques', 'mathematics', 'data', 'statistics'];
  const managementFields = ['management', 'gestion', 'business', 'administration', 'commerce'];
  
  const isTechJob = jobTitle.includes('ingénieur') || jobTitle.includes('développeur') || 
                   jobSkills.some(skill => ['javascript', 'python', 'java', 'react'].includes(skill.toLowerCase()));
  
  const isManagementJob = jobTitle.includes('manager') || jobTitle.includes('chef') || 
                         jobTitle.includes('directeur');
  
  for (const edu of candidateEducation) {
    const degree = (edu.degree || '').toLowerCase();
    const field = (edu.field || edu.field_of_study || '').toLowerCase();
    
    if (isTechJob && techFields.some(tf => field.includes(tf) || degree.includes(tf))) {
      relevanceScore = 90; // Highly relevant technical education
      break;
    } else if (isManagementJob && managementFields.some(mf => field.includes(mf) || degree.includes(mf))) {
      relevanceScore = 85; // Relevant management education
      break;
    } else if (techFields.some(tf => field.includes(tf)) || managementFields.some(mf => field.includes(mf))) {
      relevanceScore = 60; // Somewhat relevant
    }
  }
  
  return relevanceScore;
}

/**
 * Find skills that match between candidate and job position - IMPROVED
 */
export function findMatchedSkills(candidateSkills: string[], jobSkills: string[]): string[] {
  if (!jobSkills || jobSkills.length === 0 || !candidateSkills || candidateSkills.length === 0) {
    return [];
  }
  
  const normCandidateSkills = Array.isArray(candidateSkills) ? candidateSkills : [candidateSkills];
  const normJobSkills = Array.isArray(jobSkills) ? jobSkills : [jobSkills];
  
  const normalizedCandidateSkills = normCandidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  // Find matching job skills with improved matching
  return normJobSkills.filter((skill, index) => 
    normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill === normalizedJobSkills[index] ||
      isSkillSemanticallyRelated(candidateSkill, normalizedJobSkills[index])
    )
  );
}

/**
 * Find skills that are required by job but missing from candidate - IMPROVED
 */
export function findMissingSkills(candidateSkills: string[], jobSkills: string[]): string[] {
  if (!jobSkills || jobSkills.length === 0) {
    return [];
  }
  
  const normCandidateSkills = Array.isArray(candidateSkills) ? candidateSkills : [candidateSkills];
  const normJobSkills = Array.isArray(jobSkills) ? jobSkills : [jobSkills];
  
  if (normCandidateSkills.length === 0) {
    return [...normJobSkills];
  }
  
  const normalizedCandidateSkills = normCandidateSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  const normalizedJobSkills = normJobSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase().trim() : String(skill).toLowerCase().trim()
  );
  
  // Find missing skills with improved matching
  return normJobSkills.filter((skill, index) => 
    !normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill === normalizedJobSkills[index] ||
      isSkillSemanticallyRelated(candidateSkill, normalizedJobSkills[index])
    )
  );
}

/**
 * Calculate a revised candidate quality score
 */
export function calculateCandidateQualityScore(candidateData: any): number {
  if (!candidateData) return 0;
  
  let baseScore = 30; // Lower base for more differentiation
  
  // Skills quality with semantic analysis
  const candidateSkills = candidateData.skills || [];
  const normalizedCandidateSkills = candidateSkills.map((skill: string) => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // High-value skills get more points
  const highValueSkills = [
    'javascript', 'python', 'react', 'nodejs', 'typescript', 'aws', 'azure', 
    'docker', 'kubernetes', 'machine learning', 'data science', 'devops',
    'product management', 'ui/ux', 'agile', 'scrum', 'java', 'c#', '.net',
    'sql', 'postgresql', 'mongodb', 'leadership', 'project management'
  ];
  
  let skillsScore = 0;
  for (const skill of normalizedCandidateSkills) {
    if (highValueSkills.some(hvSkill => 
      skill === hvSkill || 
      skill.includes(hvSkill) || 
      isSkillSemanticallyRelated(skill, hvSkill)
    )) {
      skillsScore += 3; // Higher points for valuable skills
    } else {
      skillsScore += 1; // Basic points for any skill
    }
  }
  
  skillsScore = Math.min(30, skillsScore); // Cap at 30 points
  
  // Experience quality with relevance check
  const experienceYears = candidateData.years_experience || 0;
  const experiences = candidateData.experiences || [];
  
  let experienceScore = Math.min(20, Math.sqrt(experienceYears) * 4);
  
  // Bonus for diverse/relevant experience
  if (Array.isArray(experiences) && experiences.length >= 3) {
    experienceScore += 5;
  }
  
  // Education with relevance
  let educationScore = 0;
  const education = candidateData.education || [];
  
  if (education.length > 0) {
    const degrees = education.map((edu: any) => (edu.degree || '').toLowerCase());
    
    if (degrees.some(d => d.includes('phd') || d.includes('doctorate'))) {
      educationScore = 15;
    } else if (degrees.some(d => d.includes('master') || d.includes('mba'))) {
      educationScore = 12;
    } else if (degrees.some(d => d.includes('bachelor') || d.includes('license'))) {
      educationScore = 10;
    } else {
      educationScore = 5;
    }
  }
  
  // Profile completeness bonus
  const completenessFactors = [
    candidateData.location,
    candidateData.phone,
    candidateData.email,
    candidateData.career_objectives,
    candidateData.languages && candidateData.languages.length > 0
  ].filter(Boolean).length;
  
  const completenessScore = completenessFactors * 2;
  
  const finalScore = Math.min(95, baseScore + skillsScore + experienceScore + educationScore + completenessScore);
  
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
  [key: string]: any;
}

export interface MatchResult {
  score: number;
  details: MatchDetails;
}
