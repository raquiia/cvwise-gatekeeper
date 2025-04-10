
import { supabase } from '@/integrations/supabase/client';
import type { CandidateData } from '../candidateService';
import type { CandidateMatch, CandidateJobMatch } from './types';
import { processJobOfferData } from '@/utils/candidateUtils';
import { calculateCandidateJobMatch, createDefaultMatchDetails } from './matchUtils';
import { matchDbService } from './matchDbService';
import { jobSuggestionService } from './jobSuggestionService';

/**
 * Main service for candidate matching functionality
 */
export const candidateMatchingService = {
  // Storage for active job offer
  _activeJobOfferId: null as string | null,
  
  // Set the active job offer for the session
  setActiveJobOffer: async (jobOfferId: string | null): Promise<boolean> => {
    try {
      if (jobOfferId) {
        const { data: jobOffer, error } = await supabase
          .from('job_offers')
          .select('*')
          .eq('id', jobOfferId)
          .single();
          
        if (error || !jobOffer) {
          console.error('Error fetching job offer:', error);
          throw new Error('Job offer not found');
        }
      }
      
      candidateMatchingService._activeJobOfferId = jobOfferId;
      return true;
    } catch (error) {
      console.error('Error setting active job offer:', error);
      return false;
    }
  },
  
  // Get the active job offer ID
  getActiveJobOfferId: (): string | null => {
    return candidateMatchingService._activeJobOfferId;
  },
  
  // Calculate the match score and details for a candidate against the active job offer
  calculateCandidateActiveJobScore: async (candidate: CandidateData): Promise<CandidateJobMatch> => {
    try {
      console.log('Calculating active job score for candidate:', candidate.id);
      const jobOfferId = candidateMatchingService._activeJobOfferId;
      
      if (!jobOfferId) {
        console.log('No active job offer, returning standard candidate score');
        return createDefaultMatchDetails(candidate);
      }
      
      // Fetch the job offer
      const { data: rawJobOffer, error: jobOfferError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
        
      if (jobOfferError || !rawJobOffer) {
        console.error('Error fetching job offer:', jobOfferError);
        throw new Error('Job offer not found');
      }
      
      const jobOffer = processJobOfferData(rawJobOffer);
      
      // Calculate match details between the candidate and job offer
      return await calculateCandidateJobMatch(candidate, jobOffer);
    } catch (error) {
      console.error('Error calculating candidate active job score:', error);
      return createDefaultMatchDetails(candidate);
    }
  },
  
  // Re-export methods from other services for backward compatibility
  getCandidateJobMatch: calculateCandidateJobMatch,
  calculateMatchesForJobOffer: matchDbService.calculateMatchesForJobOffer,
  getTopCandidatesForJobOffer: matchDbService.getTopCandidatesForJobOffer,
  getMatchesForJobOffer: matchDbService.getMatchesForJobOffer,
  generateJobOfferSuggestions: jobSuggestionService.generateJobOfferSuggestions
};
