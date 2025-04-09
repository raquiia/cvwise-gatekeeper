
import { supabase } from '@/integrations/supabase/client';
import { CandidateMatch } from './types';
import { processCandidateData, processJobOfferData } from '@/utils/candidateUtils';
import { calculateCandidateJobMatch } from './matchUtils';
import type { CandidateData } from '../candidateService';
import type { JobOffer } from '../job-offers/types';

/**
 * Service for database operations related to candidate matching
 */
export const matchDbService = {
  /**
   * Calculate match scores for all candidates against a job offer
   */
  calculateMatchesForJobOffer: async (jobOfferId: string): Promise<CandidateMatch[]> => {
    try {
      console.log('Calculating matches for job offer:', jobOfferId);
      
      // Use a direct SQL query with get_matches_for_job_offer to avoid recursion issues
      const { data: matchData, error: matchError } = await supabase
        .rpc('get_matches_for_job_offer', { p_job_offer_id: jobOfferId });
        
      if (matchError) {
        console.error('Error fetching matches:', matchError);
        
        // Fallback to direct candidates fetching if RPC fails
        const { data: rawCandidates, error: candidatesError } = await supabase
          .from('candidates')
          .select('*');
          
        if (candidatesError) {
          console.error('Error fetching candidates:', candidatesError);
          throw candidatesError;
        }
        
        if (!rawCandidates || rawCandidates.length === 0) {
          return [];
        }
        
        const candidates = rawCandidates.map(processCandidateData);
        
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
        
        // Calculate match scores for each candidate
        const matches: CandidateMatch[] = [];
        
        for (const candidate of candidates) {
          const match = await calculateCandidateJobMatch(candidate as CandidateData, jobOffer as JobOffer);
          
          matches.push({
            candidateId: candidate.id,
            firstName: candidate.first_name,
            lastName: candidate.last_name,
            position: candidate.position,
            company: candidate.company,
            score: match.score,
            details: match.details
          });
        }
        
        // Sort by score (descending)
        matches.sort((a, b) => b.score - a.score);
        
        return matches;
      }
      
      // Process the match data if we got it successfully through RPC
      if (matchData) {
        const matches: CandidateMatch[] = matchData.map((item: any) => {
          const candidate = processCandidateData(item.candidate || {});
          const matchDetails = item.match || {};
          
          return {
            candidateId: candidate.id,
            firstName: candidate.first_name,
            lastName: candidate.last_name,
            position: candidate.position,
            company: candidate.company,
            score: matchDetails.match_score || 0,
            details: matchDetails.match_details || {
              skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
              experienceLevel: { required: 0, candidate: 0, match: false },
              location: { required: '', candidate: '', match: false },
              educationLevel: { required: '', candidate: '', match: false },
              overall: 0
            }
          };
        });
        
        // Sort by score (descending)
        matches.sort((a, b) => b.score - a.score);
        
        return matches;
      }
      
      return [];
    } catch (error) {
      console.error('Error calculating matches for job offer:', error);
      return [];
    }
  },
  
  /**
   * Get top candidates for a job offer
   */
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 5): Promise<CandidateMatch[]> => {
    try {
      const matches = await matchDbService.calculateMatchesForJobOffer(jobOfferId);
      return matches.slice(0, limit);
    } catch (error) {
      console.error('Error getting top candidates:', error);
      return [];
    }
  },
  
  /**
   * Get all matches for a job offer with details
   */
  getMatchesForJobOffer: async (jobOfferId: string): Promise<CandidateMatch[]> => {
    try {
      return await matchDbService.calculateMatchesForJobOffer(jobOfferId);
    } catch (error) {
      console.error('Error getting matches for job offer:', error);
      return [];
    }
  }
};
