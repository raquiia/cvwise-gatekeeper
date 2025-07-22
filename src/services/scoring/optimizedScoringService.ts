import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/candidateService';
import { toast } from '@/hooks/use-toast';

export interface ScoringBreakdown {
  // Scores de complétude (mode général)
  education_score: number;
  experience_score: number;
  skills_score: number;
  languages_score: number;
  location_mobility_score: number;
  profile_summary_score: number;
  cv_structure_score: number;
  general_score: number;
  
  // Scores de matching (mode job-spécifique)  
  education_match_score?: number;
  skills_tools_score?: number;
  relevant_experience_score?: number;
  location_score?: number;
  languages_match_score?: number;
  cultural_fit_score?: number;
  availability_mobility_score?: number;
  interview_notes_bonus?: number;
  total_matching_score?: number;
  
  // Métadonnées
  calculated_at: string;
  is_job_specific: boolean;
  job_offer_id?: string;
}

// Helper function pour extraire les scores du breakdown AI de manière sûre
const safeGetBreakdownScore = (breakdown: any, key: string, defaultValue: number = 0): number => {
  if (!breakdown || typeof breakdown !== 'object' || Array.isArray(breakdown)) {
    return defaultValue;
  }
  
  const value = breakdown[key];
  if (typeof value === 'number') {
    return value;
  }
  
  return defaultValue;
};

export class OptimizedScoringService {
  
  /**
   * Récupérer le score de complétude d'un candidat depuis la table candidates
   */
  async getCompletenessScore(candidateId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Getting completeness score for candidate from candidates table:', candidateId);
      
      // Récupérer les données AI directement depuis la table candidates
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('ai_score, ai_breakdown, ai_analyzed_at')
        .eq('id', candidateId)
        .single();
      
      if (error) {
        console.error('Error fetching candidate AI data:', error);
        return null;
      }
      
      // Si pas de données AI, calculer un nouveau score
      if (!candidate || candidate.ai_score === null) {
        console.log('No AI data found, calculating new completeness score');
        return await this.calculateCompletenessScore(candidateId);
      }
      
      // Extraire les scores depuis le breakdown AI de manière sûre
      return {
        education_score: safeGetBreakdownScore(candidate.ai_breakdown, 'education'),
        experience_score: safeGetBreakdownScore(candidate.ai_breakdown, 'experience'),
        skills_score: safeGetBreakdownScore(candidate.ai_breakdown, 'skills'),
        languages_score: safeGetBreakdownScore(candidate.ai_breakdown, 'languages'),
        location_mobility_score: safeGetBreakdownScore(candidate.ai_breakdown, 'location'),
        profile_summary_score: safeGetBreakdownScore(candidate.ai_breakdown, 'profileSummary'),
        cv_structure_score: safeGetBreakdownScore(candidate.ai_breakdown, 'cvStructure'),
        general_score: candidate.ai_score,
        calculated_at: candidate.ai_analyzed_at || new Date().toISOString(),
        is_job_specific: false
      };
      
    } catch (error: any) {
      console.error('Error in getCompletenessScore:', error);
      return null;
    }
  }
  
  /**
   * Calculer et stocker le score de complétude directement dans candidates
   * REVISED to be more selective and accurate
   */
  async calculateCompletenessScore(candidateId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Calculating REVISED completeness score for candidate:', candidateId);
      
      // Récupérer les données du candidat pour calculer le score
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
      
      if (error || !candidate) {
        console.error('Error fetching candidate data:', error);
        return null;
      }
      
      // REVISED scoring algorithm with higher standards
      let skillsScore = 0;
      let experienceScore = 0;
      let educationScore = 0;
      let languagesScore = 0;
      let locationScore = 0;
      let profileScore = 0;
      let structureScore = 0;
      
      // Skills scoring - more demanding
      const skills = candidate.skills;
      if (skills && Array.isArray(skills) && skills.length > 0) {
        if (skills.length >= 8) skillsScore = 90;
        else if (skills.length >= 6) skillsScore = 75;  
        else if (skills.length >= 4) skillsScore = 60;
        else if (skills.length >= 2) skillsScore = 40;
        else skillsScore = 20;
        
        // Bonus for technical skills quality
        const technicalSkills = ['javascript', 'python', 'java', 'react', 'sql', 'aws'];
        const hasTechSkills = skills.some((skill: any) => 
          technicalSkills.some(tech => 
            String(skill).toLowerCase().includes(tech)
          )
        );
        if (hasTechSkills) skillsScore = Math.min(100, skillsScore + 10);
      }
      
      // Experience scoring - focus on relevance
      const experiences = candidate.experiences;
      let relevantExpCount = 0;
      let totalExpYears = candidate.years_experience || 0;
      
      if (experiences && Array.isArray(experiences)) {
        // Count experiences with meaningful titles/descriptions
        relevantExpCount = experiences.filter((exp: any) => {
          const title = exp.title || exp.position || '';
          const description = exp.description || '';
          return title.length > 5 || description.length > 20;
        }).length;
      }
      
      // Score based on both quantity and years
      if (totalExpYears >= 5 && relevantExpCount >= 2) {
        experienceScore = 90;
      } else if (totalExpYears >= 3 && relevantExpCount >= 1) {
        experienceScore = 70;
      } else if (totalExpYears >= 1) {
        experienceScore = 50;
      } else if (relevantExpCount >= 1) {
        experienceScore = 30;
      } else {
        experienceScore = 10;
      }
      
      // Education scoring - more nuanced
      const education = candidate.education;
      if (education && Array.isArray(education) && education.length > 0) {
        const hasDetailedEducation = education.some((edu: any) => 
          (edu.degree && edu.degree.length > 3) || 
          (edu.institution && edu.institution.length > 3)
        );
        
        if (hasDetailedEducation) {
          educationScore = 85;
        } else {
          educationScore = 60;
        }
      } else {
        educationScore = 25; // Penalty for missing education
      }
      
      // Languages scoring
      const languages = candidate.languages;
      if (languages && Array.isArray(languages) && languages.length > 0) {
        const detailedLanguages = languages.filter((lang: any) => 
          lang.language || lang.name || (typeof lang === 'string' && lang.length > 1)
        );
        
        if (detailedLanguages.length >= 3) languagesScore = 90;
        else if (detailedLanguages.length >= 2) languagesScore = 70;
        else if (detailedLanguages.length >= 1) languagesScore = 50;
      } else {
        languagesScore = 20;
      }
      
      // Location and mobility
      if (candidate.location && candidate.location.length > 2) {
        locationScore = 70;
        if (candidate.mobility && candidate.mobility.toLowerCase().includes('oui')) {
          locationScore = 90;
        }
      } else {
        locationScore = 30;
      }
      
      // Profile completeness
      const profileFields = [
        candidate.career_objectives,
        candidate.phone,
        candidate.email,
        candidate.availability,
        candidate.salary_expectations
      ].filter(Boolean);
      
      profileScore = Math.min(90, profileFields.length * 15);
      
      // CV structure and presentation
      const structureFields = [
        candidate.interests,
        candidate.professional_references && Array.isArray(candidate.professional_references) && candidate.professional_references.length > 0,
        candidate.certifications && Array.isArray(candidate.certifications) && candidate.certifications.length > 0,
        candidate.projects && Array.isArray(candidate.projects) && candidate.projects.length > 0
      ].filter(Boolean);
      
      structureScore = Math.min(80, structureFields.length * 20);
      
      // Calculate general score with REVISED weighting
      // Emphasize skills and experience more
      const generalScore = Math.round(
        (skillsScore * 0.3) +           // 30% skills
        (experienceScore * 0.25) +     // 25% experience  
        (educationScore * 0.2) +       // 20% education
        (profileScore * 0.15) +        // 15% profile
        (languagesScore * 0.05) +      // 5% languages
        (locationScore * 0.03) +       // 3% location
        (structureScore * 0.02)        // 2% structure
      );
      
      console.log(`📊 REVISED Completeness breakdown for ${candidate.first_name}:`, {
        skills: `${skillsScore}% (${Array.isArray(skills) ? skills.length : 0} skills)`,
        experience: `${experienceScore}% (${totalExpYears}y, ${relevantExpCount} detailed)`,
        education: `${educationScore}% (${Array.isArray(education) ? education.length : 0} entries)`,
        languages: `${languagesScore}% (${Array.isArray(languages) ? languages.length : 0} languages)`,
        location: `${locationScore}%`,
        profile: `${profileScore}%`,
        structure: `${structureScore}%`,
        general: `${generalScore}%`
      });
      
      // Mettre à jour le candidat avec le score calculé
      await supabase
        .from('candidates')
        .update({
          ai_score: generalScore,
          ai_breakdown: {
            skills: skillsScore,
            experience: experienceScore,
            education: educationScore,
            languages: languagesScore,
            location: locationScore,
            profileSummary: profileScore,
            cvStructure: structureScore
          },
          ai_analyzed_at: new Date().toISOString()
        })
        .eq('id', candidateId);
      
      return {
        education_score: educationScore,
        experience_score: experienceScore,
        skills_score: skillsScore,
        languages_score: languagesScore,
        location_mobility_score: locationScore,
        profile_summary_score: profileScore,
        cv_structure_score: structureScore,
        general_score: generalScore,
        calculated_at: new Date().toISOString(),
        is_job_specific: false
      };
      
    } catch (error: any) {
      console.error('Error in calculateCompletenessScore:', error);
      toast({
        title: "Erreur de calcul",
        description: "Impossible de calculer le score de complétude",
        variant: "destructive",
      });
      return null;
    }
  }
  
  /**
   * Calculer le score de matching avec une offre d'emploi
   * COMPLETELY REVISED to focus on skills relevance
   */
  async calculateMatchingScore(candidateId: string, jobOfferId: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('🎯 Calculating REVISED matching score for candidate:', candidateId, 'and job:', jobOfferId);
      
      // Get candidate data
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (candidateError || !candidate) {
        console.error('Error fetching candidate:', candidateError);
        return null;
      }
      
      // Get job offer data  
      const { data: jobOffer, error: jobError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
        
      if (jobError || !jobOffer) {
        console.error('Error fetching job offer:', jobError);
        return null;
      }
      
      // REVISED matching algorithm with skills-focused approach
      const candidateSkills = candidate.skills || [];
      const requiredSkills = jobOffer.required_skills || [];
      const preferredSkills = jobOffer.preferred_skills || [];
      
      console.log(`🔍 Matching ${candidate.first_name} vs "${jobOffer.title}"`);
      console.log(`👤 Candidate skills:`, candidateSkills);
      console.log(`🎯 Required skills:`, requiredSkills);
      console.log(`⭐ Preferred skills:`, preferredSkills);
      
      // SKILLS MATCH (75% of total score)
      let skillsMatchScore = 0;
      let exactMatches = 0;
      let partialMatches = 0;
      
      // Normalize skills for comparison
      const normalizedCandidateSkills = Array.isArray(candidateSkills) ? candidateSkills.map((skill: any) => 
        String(skill).toLowerCase().trim()
      ) : [];
      const normalizedRequiredSkills = Array.isArray(requiredSkills) ? requiredSkills.map((skill: any) => 
        String(skill).toLowerCase().trim()
      ) : [];
      const normalizedPreferredSkills = Array.isArray(preferredSkills) ? preferredSkills.map((skill: any) => 
        String(skill).toLowerCase().trim()
      ) : [];
      
      // Check required skills matches
      for (const reqSkill of normalizedRequiredSkills) {
        const hasExactMatch = normalizedCandidateSkills.some(candSkill => 
          candSkill === reqSkill
        );
        const hasPartialMatch = !hasExactMatch && normalizedCandidateSkills.some(candSkill => 
          this.isSkillRelated(candSkill, reqSkill)
        );
        
        if (hasExactMatch) {
          exactMatches++;
        } else if (hasPartialMatch) {
          partialMatches++;
        }
      }
      
      // Check preferred skills matches
      let preferredMatches = 0;
      for (const prefSkill of normalizedPreferredSkills) {
        if (normalizedCandidateSkills.some(candSkill => 
          candSkill === prefSkill || this.isSkillRelated(candSkill, prefSkill)
        )) {
          preferredMatches++;
        }
      }
      
      // Calculate skills match score (out of 75)
      if (normalizedRequiredSkills.length > 0) {
        const requiredMatchPercentage = (exactMatches + partialMatches * 0.5) / normalizedRequiredSkills.length;
        skillsMatchScore = Math.round(requiredMatchPercentage * 60); // 60 points for required skills
        
        // CRITICAL THRESHOLD: If less than 30% required skills matched, cap at 20 points
        if (requiredMatchPercentage < 0.3) {
          skillsMatchScore = Math.min(20, skillsMatchScore);
          console.log(`⚠️ CRITICAL: Only ${Math.round(requiredMatchPercentage * 100)}% required skills matched`);
        }
      } else {
        skillsMatchScore = 30; // Default if no required skills specified
      }
      
      // Add preferred skills bonus (up to 15 points)
      if (normalizedPreferredSkills.length > 0) {
        const preferredBonus = Math.round((preferredMatches / normalizedPreferredSkills.length) * 15);
        skillsMatchScore += preferredBonus;
      }
      
      skillsMatchScore = Math.min(75, skillsMatchScore); // Cap at 75
      
      // EXPERIENCE MATCH (15% of total score)
      let experienceMatchScore = 0;
      const candidateYears = candidate.years_experience || 0;
      const minRequired = jobOffer.experience_years_min || 0;
      const maxRequired = jobOffer.experience_years_max || minRequired + 5;
      
      if (minRequired === 0) {
        experienceMatchScore = 15; // No experience required
      } else if (candidateYears >= minRequired && candidateYears <= maxRequired) {
        experienceMatchScore = 15; // Perfect match
      } else if (candidateYears >= minRequired * 0.8) {
        experienceMatchScore = 12; // Close enough
      } else if (candidateYears > 0) {
        experienceMatchScore = 8; // Some experience
      } else {
        experienceMatchScore = 3; // No experience
      }
      
      // EDUCATION MATCH (5% of total score)
      let educationMatchScore = 0;
      const candidateEducation = candidate.education || [];
      
      if (Array.isArray(candidateEducation) && candidateEducation.length > 0) {
        // Basic education score - can be enhanced with relevance analysis
        educationMatchScore = 4;
        
        // Bonus for detailed education
        const hasDetailedEducation = candidateEducation.some((edu: any) => 
          edu.degree && edu.institution
        );
        if (hasDetailedEducation) {
          educationMatchScore = 5;
        }
      } else {
        educationMatchScore = 2; // Penalty for missing education
      }
      
      // LOCATION MATCH (5% of total score)
      let locationMatchScore = 0;
      const candidateLocation = candidate.location?.toLowerCase() || '';
      const jobLocation = jobOffer.location?.toLowerCase() || '';
      
      if (candidateLocation && jobLocation) {
        if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
          locationMatchScore = 5; // Same location
        } else if (candidate.mobility?.toLowerCase().includes('oui')) {
          locationMatchScore = 4; // Mobile candidate
        } else {
          locationMatchScore = 2; // Different locations
        }
      } else {
        locationMatchScore = 3; // Missing info
      }
      
      // TOTAL SCORE CALCULATION
      const totalMatchingScore = skillsMatchScore + experienceMatchScore + educationMatchScore + locationMatchScore;
      
      console.log(`🎯 REVISED MATCHING RESULTS for ${candidate.first_name}:`);
      console.log(`   Skills: ${skillsMatchScore}/75 (${exactMatches} exact + ${partialMatches} partial / ${normalizedRequiredSkills.length} required)`);
      console.log(`   Experience: ${experienceMatchScore}/15 (${candidateYears}y vs ${minRequired}-${maxRequired}y)`);
      console.log(`   Education: ${educationMatchScore}/5`);
      console.log(`   Location: ${locationMatchScore}/5`);
      console.log(`   TOTAL: ${totalMatchingScore}/100`);
      
      return {
        // Base scores for compatibility with existing code
        education_score: educationMatchScore * 20,
        experience_score: experienceMatchScore * 6.67,
        skills_score: skillsMatchScore * 1.33,
        languages_score: 50, // Default
        location_mobility_score: locationMatchScore * 20,
        profile_summary_score: 50, // Default
        cv_structure_score: 50, // Default
        general_score: totalMatchingScore,
        
        // Job-specific matching scores
        education_match_score: educationMatchScore * 20,
        skills_tools_score: skillsMatchScore * 1.33,
        relevant_experience_score: experienceMatchScore * 6.67,
        location_score: locationMatchScore * 20,
        languages_match_score: 50,
        cultural_fit_score: 50,
        availability_mobility_score: locationMatchScore * 20,
        interview_notes_bonus: 0,
        total_matching_score: totalMatchingScore,
        
        calculated_at: new Date().toISOString(),
        is_job_specific: true,
        job_offer_id: jobOfferId
      };
      
    } catch (error: any) {
      console.error('Error in calculateMatchingScore:', error);
      return null;
    }
  }
  
  /**
   * Check if two skills are related - enhanced semantic matching
   */
  private isSkillRelated(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();
    
    // Enhanced skill relationships
    const skillRelations: Record<string, string[]> = {
      'javascript': ['js', 'node.js', 'nodejs', 'react', 'vue', 'angular', 'typescript'],
      'typescript': ['ts', 'javascript', 'js', 'react', 'angular'],
      'react': ['reactjs', 'react.js', 'javascript', 'frontend', 'jsx'],
      'vue': ['vuejs', 'vue.js', 'javascript', 'frontend'],
      'angular': ['angularjs', 'javascript', 'frontend', 'typescript'],
      'python': ['py', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
      'java': ['spring', 'springboot', 'hibernate', 'jvm'],
      'csharp': ['c#', '.net', 'dotnet', 'asp.net'],
      'sql': ['mysql', 'postgresql', 'oracle', 'mssql', 'database'],
      'nosql': ['mongodb', 'cassandra', 'redis', 'dynamodb'],
      'aws': ['amazon web services', 'ec2', 's3', 'lambda', 'cloud'],
      'azure': ['microsoft azure', 'cloud'],
      'docker': ['containerization', 'kubernetes', 'devops'],
      'kubernetes': ['k8s', 'docker', 'orchestration'],
      'devops': ['ci/cd', 'jenkins', 'gitlab', 'automation'],
      'machine learning': ['ml', 'ai', 'data science', 'tensorflow'],
      'project management': ['gestion de projet', 'pmp', 'agile', 'scrum'],
      'agile': ['scrum', 'kanban', 'project management'],
      'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript'],
      'backend': ['api', 'server', 'database', 'node.js', 'python', 'java']
    };
    
    // Check bidirectional relationships
    for (const [key, variants] of Object.entries(skillRelations)) {
      if ((s1.includes(key) && variants.some(v => s2.includes(v))) ||
          (s2.includes(key) && variants.some(v => s1.includes(v))) ||
          (variants.some(v => s1.includes(v)) && s2.includes(key)) ||
          (variants.some(v => s2.includes(v)) && s1.includes(key))) {
        return true;
      }
    }
    
    // Basic similarity check
    return s1.includes(s2) || s2.includes(s1);
  }
  
  /**
   * Forcer le recalcul d'un score (supprimer les données AI existantes)
   */
  async forceRecalculate(candidateId: string, jobOfferId?: string): Promise<ScoringBreakdown | null> {
    try {
      console.log('Force recalculating score for candidate:', candidateId);
      
      // Supprimer les données AI existantes dans candidates
      await supabase
        .from('candidates')
        .update({
          ai_score: null,
          ai_explanation: null,
          ai_breakdown: null,
          ai_strengths: null,
          ai_weaknesses: null,
          ai_recommendations: null,
          ai_analyzed_at: null
        })
        .eq('id', candidateId);
      
      // Recalculer le score
      if (jobOfferId) {
        return await this.calculateMatchingScore(candidateId, jobOfferId);
      } else {
        return await this.calculateCompletenessScore(candidateId);
      }
      
    } catch (error: any) {
      console.error('Error in forceRecalculate:', error);
      return null;
    }
  }
  
  /**
   * Invalider tous les scores d'un candidat
   */
  async invalidateAllScores(candidateId: string): Promise<void> {
    try {
      // Supprimer les données AI pour ce candidat
      await supabase
        .from('candidates')
        .update({
          ai_score: null,
          ai_explanation: null,
          ai_breakdown: null,
          ai_strengths: null,
          ai_weaknesses: null,
          ai_recommendations: null,
          ai_analyzed_at: null
        })
        .eq('id', candidateId);
      
      console.log('All AI scores invalidated for candidate:', candidateId);
    } catch (error: any) {
      console.error('Error invalidating scores:', error);
    }
  }
}

export const optimizedScoringService = new OptimizedScoringService();
