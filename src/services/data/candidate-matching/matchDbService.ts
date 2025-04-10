
import { supabase } from '@/integrations/supabase/client';
import { CandidateMatch } from './types';
import { processCandidateData, processJobOfferData } from '@/utils/candidateUtils';
import { calculateCandidateJobMatch, matchDetailsToJson } from './matchUtils';
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
          console.log('No candidates found to match with this job offer');
          return [];
        }
        
        const candidates = rawCandidates.map(processCandidateData);
        console.log(`Found ${candidates.length} candidates to evaluate`);
        
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
        console.log('Successfully fetched job offer for matching:', jobOffer.title);
        
        // Calculate match scores for each candidate
        const matches: CandidateMatch[] = [];
        
        for (const candidate of candidates) {
          console.log(`Calculating match for candidate: ${candidate.first_name} ${candidate.last_name}`);
          const match = await calculateCandidateJobMatch(candidate as CandidateData, jobOffer as JobOffer);
          
          // Store the match result in the database
          try {
            const matchDetailsJson = matchDetailsToJson(match.details);
            
            const { data: savedMatch, error: insertError } = await supabase
              .from('candidate_job_matches')
              .upsert({
                candidate_id: candidate.id,
                job_offer_id: jobOfferId,
                match_score: match.score,
                skills_match_score: match.details.skills.matchPercentage,
                experience_match_score: match.details.experienceLevel.score || 0,
                education_match_score: match.details.educationLevel.score || 0,
                location_match_score: match.details.location.score || 0,
                match_details: matchDetailsJson
              }, {
                onConflict: 'candidate_id,job_offer_id'
              })
              .select()
              .single();
              
            if (insertError) {
              console.error('Error saving match results:', insertError);
            } else {
              console.log(`Match result saved for candidate ${candidate.id} with score ${match.score}`);
            }
          } catch (saveError) {
            console.error('Error during match save operation:', saveError);
          }
          
          matches.push({
            id: `${candidate.id}-${jobOfferId}`,
            candidate_id: candidate.id,
            job_offer_id: jobOfferId,
            match_score: match.score,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            position: candidate.position,
            company: candidate.company,
            match_details: match.details,
            // Also include frontend-compatible properties
            candidateId: candidate.id,
            firstName: candidate.first_name,
            lastName: candidate.last_name,
            score: match.score,
            details: match.details
          });
        }
        
        // Sort by score (descending)
        matches.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        
        console.log(`Generated ${matches.length} matches for job offer`);
        return matches;
      }
      
      // Process the match data if we got it successfully through RPC
      if (matchData) {
        const matches: CandidateMatch[] = matchData.map((item: any) => {
          const candidate = processCandidateData(item.candidate || {});
          const matchDetails = item.match || {};
          
          return {
            id: `${candidate.id}-${jobOfferId}`,
            candidate_id: candidate.id,
            job_offer_id: jobOfferId,
            match_score: matchDetails.match_score || 0,
            // Include frontend-compatible properties
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
        matches.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        
        console.log(`Retrieved ${matches.length} matches for job offer from RPC`);
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
