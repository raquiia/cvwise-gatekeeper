import { supabase } from '@/integrations/supabase/client';
import type { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

export interface StoredCandidateScore {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  match_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  profile_completeness_score: number;
  calculated_at: string;
  updated_at: string;
}

export interface ScoreDetails {
  skills: number;
  experience: number;
  education: number;
  profileCompleteness: number;
  overall: number;
  details: {
    skillsCount: number;
    experienceYears: number;
    educationLevel: string;
    completenessPercentage: number;
  };
}

// Helper function to safely extract education level
const getEducationLevel = (education: any[]): string => {
  if (!education || education.length === 0) {
    return 'Non spécifié';
  }
  
  const firstEducation = education[0];
  if (typeof firstEducation === 'object' && firstEducation !== null) {
    return (firstEducation as any).degree || (firstEducation as any).diploma || 'Non spécifié';
  }
  
  return 'Non spécifié';
};

export const persistentScoringService = {
  /**
   * Get stored general score for a candidate - SIMPLIFIED
   */
  async getCandidateGeneralScore(candidateId: string): Promise<ScoreDetails | null> {
    try {
      console.log(`Fetching general score for candidate ${candidateId}`);
      
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('score, profile_completeness, skills, years_experience, education')
        .eq('id', candidateId)
        .single();

      if (error) {
        console.error('Error fetching candidate score:', error);
        return null;
      }

      if (!candidate) {
        console.warn(`No candidate found with ID ${candidateId}`);
        return null;
      }

      const skillsArray = ensureArray(candidate.skills);
      const educationArray = ensureArray(candidate.education);
      
      // FIXED: Check if score exists and is valid (not 0 or null)
      if (candidate.score === null || candidate.score === undefined || candidate.score === 0) {
        console.log(`Candidate ${candidateId} has no valid score (${candidate.score}), will trigger recalculation`);
        return null;
      }
      
      console.log(`Found general score for candidate ${candidateId}: ${candidate.score}`);
      
      // Return simplified score breakdown based on database score
      return {
        skills: Math.min(Math.round((skillsArray.length / 10) * 100), 100),
        experience: candidate.years_experience ? Math.min(candidate.years_experience * 10, 100) : 0,
        education: educationArray.length > 0 ? 75 : 50,
        profileCompleteness: candidate.profile_completeness || 0,
        overall: candidate.score, // Use the actual database score
        details: {
          skillsCount: skillsArray.length,
          experienceYears: candidate.years_experience || 0,
          educationLevel: getEducationLevel(educationArray),
          completenessPercentage: candidate.profile_completeness || 0
        }
      };
    } catch (error) {
      console.error('Error in getCandidateGeneralScore:', error);
      return null;
    }
  },

  /**
   * Get stored job-specific score for a candidate - SIMPLIFIED
   */
  async getCandidateJobScore(candidateId: string, jobOfferId: string): Promise<ScoreDetails | null> {
    try {
      console.log(`Fetching job score for candidate ${candidateId} and job ${jobOfferId}`);
      
      const { data: jobScore, error } = await supabase
        .from('candidate_job_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('job_offer_id', jobOfferId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No job score found for candidate ${candidateId} and job ${jobOfferId}`);
          return null;
        }
        console.error('Error fetching job score:', error);
        return null;
      }

      // Get candidate details for additional info
      const { data: candidate } = await supabase
        .from('candidates')
        .select('skills, years_experience, education')
        .eq('id', candidateId)
        .single();

      const skillsArray = ensureArray(candidate?.skills);
      const educationArray = ensureArray(candidate?.education);

      console.log(`Found job score for candidate ${candidateId}: ${jobScore.match_score}`);

      return {
        skills: jobScore.skills_score,
        experience: jobScore.experience_score,
        education: jobScore.education_score,
        profileCompleteness: jobScore.profile_completeness_score,
        overall: jobScore.match_score, // Use the actual job match score
        details: {
          skillsCount: skillsArray.length,
          experienceYears: candidate?.years_experience || 0,
          educationLevel: getEducationLevel(educationArray),
          completenessPercentage: jobScore.profile_completeness_score
        }
      };
    } catch (error) {
      console.error('Error in getCandidateJobScore:', error);
      return null;
    }
  },

  /**
   * Calculate and store job-specific score using the database function
   */
  async calculateAndStoreJobScore(candidateId: string, jobOfferId: string): Promise<ScoreDetails | null> {
    try {
      console.log(`Calculating job score for candidate ${candidateId} and job ${jobOfferId}`);
      
      const { data, error } = await supabase.rpc('calculate_and_store_job_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId
      });

      if (error) {
        console.error('Error calculating job score:', error);
        return null;
      }

      console.log(`Job score calculated: ${data}`);
      
      // Fetch the newly calculated score
      return await this.getCandidateJobScore(candidateId, jobOfferId);
    } catch (error) {
      console.error('Error in calculateAndStoreJobScore:', error);
      return null;
    }
  },

  /**
   * Recalculate general score using the database function
   */
  async recalculateGeneralScore(candidateId: string): Promise<number | null> {
    try {
      console.log(`Recalculating general score for candidate ${candidateId}`);
      
      const { data, error } = await supabase.rpc('calculate_and_store_candidate_score', {
        p_candidate_id: candidateId
      });

      if (error) {
        console.error('Error recalculating general score:', error);
        return null;
      }

      console.log(`General score calculated: ${data}`);
      return data;
    } catch (error) {
      console.error('Error in recalculateGeneralScore:', error);
      return null;
    }
  },

  /**
   * Mass recalculate all general scores - NEW FUNCTION
   */
  async massRecalculateAllGeneralScores(): Promise<{ success: number; failed: number }> {
    try {
      console.log('Starting mass recalculation of all general scores');
      
      // Get all candidates for the current user
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error || !candidates) {
        console.error('Error fetching candidates:', error);
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      // Recalculate in batches of 5
      const batchSize = 5;
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(candidate => this.recalculateGeneralScore(candidate.id))
        );
        
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value !== null) {
            success++;
          } else {
            failed++;
          }
        });
        
        // Small delay between batches
        if (i + batchSize < candidates.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Mass recalculation completed: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error('Error in massRecalculateAllGeneralScores:', error);
      return { success: 0, failed: 0 };
    }
  },

  /**
   * Calculate job scores for all candidates for a specific job offer
   */
  async calculateAllCandidatesJobScores(jobOfferId: string): Promise<void> {
    try {
      console.log(`Calculating job scores for all candidates for job ${jobOfferId}`);
      
      // Get all candidates for the current user
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error || !candidates) {
        console.error('Error fetching candidates:', error);
        return;
      }

      // Calculate scores in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(candidate => 
            this.calculateAndStoreJobScore(candidate.id, jobOfferId)
          )
        );
        
        // Small delay between batches
        if (i + batchSize < candidates.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Finished calculating job scores for ${candidates.length} candidates`);
    } catch (error) {
      console.error('Error in calculateAllCandidatesJobScores:', error);
    }
  },

  /**
   * Check if a job score exists and is recent (less than 1 hour old)
   */
  async isJobScoreRecent(candidateId: string, jobOfferId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('candidate_job_scores')
        .select('updated_at')
        .eq('candidate_id', candidateId)
        .eq('job_offer_id', jobOfferId)
        .single();

      if (error || !data) {
        return false;
      }

      const updatedAt = new Date(data.updated_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      return updatedAt > oneHourAgo;
    } catch (error) {
      console.error('Error checking job score recency:', error);
      return false;
    }
  }
};
