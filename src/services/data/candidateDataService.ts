
import { MatchDetails } from './candidate-matching/types';
import { candidateService } from './candidateService';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

/**
 * Interface for the result of a candidate-job matching operation
 */
export interface CandidateJobMatch {
  score: number;
  details: MatchDetails;
}

/**
 * Service for candidate data operations
 */
export const candidateDataService = {
  /**
   * Delete a candidate by ID
   */
  deleteCandidate: async (candidateId: string, deleteResume: boolean = true): Promise<boolean> => {
    try {
      return await candidateService.deleteCandidate(candidateId, deleteResume);
    } catch (error: any) {
      console.error('Error in candidateDataService.deleteCandidate:', error);
      throw new Error(`Failed to delete candidate: ${error.message}`);
    }
  },
  
  /**
   * Get all candidates for the current user
   */
  getUserCandidates: async () => {
    try {
      return await candidateService.getUserCandidates();
    } catch (error: any) {
      console.error('Error in candidateDataService.getUserCandidates:', error);
      throw new Error(`Failed to get user candidates: ${error.message}`);
    }
  }
};
