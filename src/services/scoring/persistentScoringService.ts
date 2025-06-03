
import { supabase } from '@/integrations/supabase/client';
import type { CandidateData } from '@/services/data/candidateService';

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

export const persistentScoringService = {
  /**
   * Get stored general score for a candidate
   */
  async getCandidateGeneralScore(candidateId: string): Promise<ScoreDetails | null> {
    try {
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('score, profile_completeness, skills, years_experience, education')
        .eq('id', candidateId)
        .single();

      if (error || !candidate) {
        console.error('Error fetching candidate score:', error);
        return null;
      }

      const skillsArray = Array.isArray(candidate.skills) ? candidate.skills : [];
      const educationArray = Array.isArray(candidate.education) ? candidate.education : [];
      
      return {
        skills: Math.round((skillsArray.length / 10) * 100), // Approximate based on skills count
        experience: candidate.years_experience ? Math.min(candidate.years_experience * 10, 100) : 0,
        education: educationArray.length > 0 ? 75 : 50, // Simplified
        profileCompleteness: candidate.profile_completeness || 0,
        overall: candidate.score || 0,
        details: {
          skillsCount: skillsArray.length,
          experienceYears: candidate.years_experience || 0,
          educationLevel: educationArray.length > 0 ? educationArray[0]?.degree || 'Non spécifié' : 'Non spécifié',
          completenessPercentage: candidate.profile_completeness || 0
        }
      };
    } catch (error) {
      console.error('Error in getCandidateGeneralScore:', error);
      return null;
    }
  },

  /**
   * Get stored job-specific score for a candidate
   */
  async getCandidateJobScore(candidateId: string, jobOfferId: string): Promise<ScoreDetails | null> {
    try {
      const { data: jobScore, error } = await supabase
        .from('candidate_job_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('job_offer_id', jobOfferId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No score found, we need to calculate it
          return await this.calculateAndStoreJobScore(candidateId, jobOfferId);
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

      const skillsArray = Array.isArray(candidate?.skills) ? candidate.skills : [];
      const educationArray = Array.isArray(candidate?.education) ? candidate.education : [];

      return {
        skills: jobScore.skills_score,
        experience: jobScore.experience_score,
        education: jobScore.education_score,
        profileCompleteness: jobScore.profile_completeness_score,
        overall: jobScore.match_score,
        details: {
          skillsCount: skillsArray.length,
          experienceYears: candidate?.years_experience || 0,
          educationLevel: educationArray.length > 0 ? educationArray[0]?.degree || 'Non spécifié' : 'Non spécifié',
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
