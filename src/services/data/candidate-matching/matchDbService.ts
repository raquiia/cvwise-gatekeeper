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
   * Calculate match scores for candidates against a job offer with intelligent caching
   * @param jobOfferId - ID of the job offer
   * @param globalMode - If true, includes all candidates from all users
   */
  calculateMatchesForJobOffer: async (jobOfferId: string, globalMode: boolean = false): Promise<CandidateMatch[]> => {
    try {
      console.log(`[Match DB Service] Starting intelligent score calculation for job offer: ${jobOfferId} (Global mode: ${globalMode})`);
      
      // Try the RPC function first
      let matchData;
      try {
        const rpcFunction = globalMode ? 'get_all_matches_for_job_offer' : 'get_matches_for_job_offer';
        
        const { data: rpcData, error: rpcError } = await supabase
          .rpc(rpcFunction, { p_job_offer_id: jobOfferId });
          
        if (rpcError) {
          console.warn(`[Match DB Service] RPC function ${rpcFunction} failed:`, rpcError);
          throw rpcError;
        }
        
        matchData = rpcData;
        console.log(`[Match DB Service] RPC function ${rpcFunction} succeeded with ${matchData?.length || 0} results`);
      } catch (rpcError) {
        console.warn(`[Match DB Service] RPC approach failed, trying direct query:`, rpcError);
        
        // Fallback to direct query
        try {
          if (globalMode) {
            // For global mode, get all candidates with owner info
            const { data: allCandidates, error: candidatesError } = await supabase
              .from('candidates')
              .select(`
                *,
                profiles!candidates_user_id_fkey (
                  first_name,
                  last_name
                )
              `);
              
            if (candidatesError) throw candidatesError;
            
            // Get existing matches for this job offer
            const { data: existingMatches, error: matchesError } = await supabase
              .from('candidate_job_matches')
              .select('*')
              .eq('job_offer_id', jobOfferId);
              
            if (matchesError) throw matchesError;
            
            // Combine data
            matchData = allCandidates?.map(candidate => {
              const match = existingMatches?.find(m => m.candidate_id === candidate.id);
              const profile = Array.isArray(candidate.profiles) ? candidate.profiles[0] : candidate.profiles;
              
              return {
                candidate: {
                  ...candidate,
                  owner_first_name: profile?.first_name,
                  owner_last_name: profile?.last_name,
                  is_own_candidate: candidate.user_id === (globalMode ? undefined : candidate.user_id) // Will be set properly below
                },
                match: match || {}
              };
            }) || [];
          } else {
            // For private mode, get only user's candidates
            const { data: userCandidates, error: candidatesError } = await supabase
              .from('candidates')
              .select('*')
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
              
            if (candidatesError) throw candidatesError;
            
            // Get existing matches for this job offer
            const { data: existingMatches, error: matchesError } = await supabase
              .from('candidate_job_matches')
              .select('*')
              .eq('job_offer_id', jobOfferId);
              
            if (matchesError) throw matchesError;
            
            // Combine data
            matchData = userCandidates?.map(candidate => ({
              candidate: {
                ...candidate,
                is_own_candidate: true
              },
              match: existingMatches?.find(m => m.candidate_id === candidate.id) || {}
            })) || [];
          }
          
          console.log(`[Match DB Service] Direct query succeeded with ${matchData?.length || 0} candidates`);
        } catch (directError) {
          console.error(`[Match DB Service] Direct query also failed:`, directError);
          return [];
        }
      }
      
      if (!matchData || matchData.length === 0) {
        console.log(`[Match DB Service] No candidates found for job offer (${globalMode ? 'global' : 'private'} mode)`);
        return [];
      }
      
      console.log(`[Match DB Service] Found ${matchData.length} candidates to process (${globalMode ? 'global' : 'private'} mode)`);
      console.log(`[Match DB Service] Raw data sample:`, matchData.slice(0, 2));
      
      // Get job offer details with timestamp
      const { data: rawJobOffer, error: jobOfferError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
        
      if (jobOfferError || !rawJobOffer) {
        console.error('[Match DB Service] Error fetching job offer:', jobOfferError);
        throw new Error('Job offer not found');
      }
      
      const jobOffer = processJobOfferData(rawJobOffer);
      const jobOfferUpdatedAt = new Date(rawJobOffer.updated_at);
      
      console.log(`[Match DB Service] Processing matches against job: ${jobOffer.title} (updated: ${jobOfferUpdatedAt.toISOString()})`);
      
      // Identify candidates that need recalculation
      const candidatesNeedingRecalculation = [];
      const candidatesUsingCache = [];
      
      for (const item of matchData) {
        const itemData = item as any;
        const candidateData = itemData?.candidate;
        
        console.log(`[Match DB Service] Processing item:`, {
          hasCandidate: !!candidateData,
          candidateId: candidateData?.id,
          candidateName: candidateData ? `${candidateData.first_name || ''} ${candidateData.last_name || ''}` : 'N/A'
        });
        
        if (!candidateData || !candidateData.id) {
          console.warn('[Match DB Service] Missing candidate data, skipping:', itemData);
          continue;
        }
        
        const candidate = processCandidateData(candidateData);
        const existingMatch = itemData?.match || {};
        const candidateUpdatedAt = new Date(candidate.updated_at || candidate.created_at || new Date());
        
        // Check if we can use the cache
        const canUseCache = matchDbService.canUseCachedScore(
          existingMatch,
          candidateUpdatedAt,
          jobOfferUpdatedAt
        );
        
        if (canUseCache) {
          candidatesUsingCache.push({ candidate, existingMatch, item: itemData });
          console.log(`[Match DB Service] Using cached score for ${candidate.first_name || 'Unknown'} ${candidate.last_name || 'Unknown'}: ${existingMatch.match_score}%`);
        } else {
          candidatesNeedingRecalculation.push({ candidate, existingMatch, item: itemData });
          console.log(`[Match DB Service] Needs recalculation: ${candidate.first_name || 'Unknown'} ${candidate.last_name || 'Unknown'} (${canUseCache ? 'cached' : 'stale/missing score'})`);
        }
      }
      
      console.log(`[Match DB Service] Cache efficiency: ${candidatesUsingCache.length} cached, ${candidatesNeedingRecalculation.length} to recalculate`);
      
      // Process cached candidates
      const matches: CandidateMatch[] = [];
      
      for (const { candidate, existingMatch, item } of candidatesUsingCache) {
        const candidateInfo = item?.candidate;
        const ownerInfo = globalMode && candidateInfo ? {
          owner_first_name: candidateInfo.owner_first_name,
          owner_last_name: candidateInfo.owner_last_name,
          is_own_candidate: candidateInfo.is_own_candidate
        } : {};
        
        matches.push(matchDbService.createCandidateMatch(
          candidate,
          jobOfferId,
          existingMatch,
          globalMode,
          ownerInfo
        ));
      }
      
      // Recalculate only candidates that need it
      for (const { candidate, existingMatch, item } of candidatesNeedingRecalculation) {
        const candidateInfo = item?.candidate;
        const ownerInfo = globalMode && candidateInfo ? {
          owner_first_name: candidateInfo.owner_first_name,
          owner_last_name: candidateInfo.owner_last_name,
          is_own_candidate: candidateInfo.is_own_candidate
        } : {};
        
        try {
          const newMatch = await calculateCandidateJobMatch(candidate as CandidateData, jobOffer as JobOffer);
          console.log(`[Match DB Service] Recalculated scores for ${candidate.first_name || 'Unknown'} ${candidate.last_name || 'Unknown'}: Global=${newMatch.globalScore}%, Local=${newMatch.localScore}%, Skills=${newMatch.skillsOnlyScore}%`);
          
          // Save the new score with timestamps (only for own candidates)
          const shouldSaveMatch = !globalMode || (candidateInfo && candidateInfo.is_own_candidate);
          
          if (shouldSaveMatch && candidate.id) {
            const candidateUpdatedAt = new Date(candidate.updated_at || candidate.created_at || new Date());
            const jobOfferUpdatedAt = new Date(rawJobOffer.updated_at);
            const matchDetailsData = matchDetailsToJson(newMatch.details);
            
            const { error: insertError } = await supabase
              .from('candidate_job_matches')
              .upsert({
                candidate_id: candidate.id,
                job_offer_id: jobOfferId,
                match_score: newMatch.score,
                global_score: newMatch.globalScore,
                local_score: newMatch.localScore,
                skills_only_score: newMatch.skillsOnlyScore,
                skills_match_score: newMatch.details.skills.matchPercentage,
                experience_match_score: newMatch.details.experienceLevel.score || 0,
                education_match_score: newMatch.details.educationLevel.score || 0,
                location_match_score: newMatch.details.location.score || 0,
                match_details: matchDetailsData as any,
                candidate_updated_at: candidateUpdatedAt.toISOString(),
                job_offer_updated_at: jobOfferUpdatedAt.toISOString(),
                calculation_version: 1
              }, {
                onConflict: 'candidate_id,job_offer_id'
              });
              
            if (insertError) {
              console.error('[Match DB Service] Error saving match results:', insertError);
            } else {
              console.log(`[Match DB Service] Successfully cached new score for candidate ${candidate.id}`);
            }
          }
          
          // Use the new data to create the match
          const updatedMatchData = {
            ...existingMatch,
            match_score: newMatch.score,
            global_score: newMatch.globalScore,
            local_score: newMatch.localScore,
            skills_only_score: newMatch.skillsOnlyScore,
            match_details: matchDetailsToJson(newMatch.details)
          };
          
          matches.push(matchDbService.createCandidateMatch(
            candidate,
            jobOfferId,
            updatedMatchData,
            globalMode,
            ownerInfo,
            newMatch.details
          ));
          
        } catch (matchError) {
          console.error(`[Match DB Service] Error calculating match for candidate ${candidate.id}:`, matchError);
          
          // Use existing data in case of error
          matches.push(matchDbService.createCandidateMatch(
            candidate,
            jobOfferId,
            existingMatch,
            globalMode,
            ownerInfo
          ));
        }
      }
      
      // Sort by score (descending) - use local score by default
      matches.sort((a, b) => (b.local_score || b.match_score || 0) - (a.local_score || a.match_score || 0));
      
      console.log(`[Match DB Service] Completed intelligent scoring: ${matches.length} matches (${candidatesUsingCache.length} from cache, ${candidatesNeedingRecalculation.length} recalculated)`);
      console.log(`[Match DB Service] Performance improvement: ${candidatesUsingCache.length > 0 ? Math.round((candidatesUsingCache.length / matches.length) * 100) : 0}% cache hit rate`);
      
      return matches;
      
    } catch (error) {
      console.error('[Match DB Service] Error in intelligent score calculation:', error);
      return [];
    }
  },

  /**
   * Check if we can use the cached score based on timestamps and data freshness
   */
  canUseCachedScore: (
    existingMatch: any,
    candidateUpdatedAt: Date,
    jobOfferUpdatedAt: Date
  ): boolean => {
    // If no existing score, need to calculate
    if (!existingMatch?.match_score && existingMatch?.match_score !== 0) {
      return false;
    }
    
    // If no cache timestamps, need to recalculate
    if (!existingMatch?.candidate_updated_at || !existingMatch?.job_offer_updated_at) {
      return false;
    }
    
    const cachedCandidateTime = new Date(existingMatch.candidate_updated_at);
    const cachedJobOfferTime = new Date(existingMatch.job_offer_updated_at);
    
    // Check if data hasn't changed since last calculation
    const candidateUnchanged = candidateUpdatedAt <= cachedCandidateTime;
    const jobOfferUnchanged = jobOfferUpdatedAt <= cachedJobOfferTime;
    
    // Check calculation version (to force recalculation when algorithm improves)
    const currentVersion = 1;
    const cachedVersion = existingMatch.calculation_version || 0;
    const versionUpToDate = cachedVersion >= currentVersion;
    
    return candidateUnchanged && jobOfferUnchanged && versionUpToDate;
  },

  /**
   * Create a standardized CandidateMatch object
   */
  createCandidateMatch: (
    candidate: any,
    jobOfferId: string,
    matchData: any,
    globalMode: boolean,
    ownerInfo: any,
    calculatedDetails?: any
  ): CandidateMatch => {
    return {
      id: `${candidate?.id || 'unknown'}-${jobOfferId}`,
      candidate_id: candidate?.id || '',
      job_offer_id: jobOfferId,
      match_score: matchData?.match_score || 0,
      global_score: matchData?.global_score || 0,
      local_score: matchData?.local_score || 0,
      skills_only_score: matchData?.skills_only_score || 0,
      first_name: candidate?.first_name || '',
      last_name: candidate?.last_name || '',
      position: candidate?.position || '',
      company: candidate?.company || '',
      match_details: matchData?.match_details || {},
      // Frontend-compatible properties
      candidateId: candidate?.id || '',
      firstName: candidate?.first_name || '',
      lastName: candidate?.last_name || '',
      score: matchData?.local_score || matchData?.match_score || 0, // Use local_score as main score
      details: calculatedDetails || matchData?.match_details || {
        skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
        experienceLevel: { required: 0, candidate: 0, match: false },
        location: { required: '', candidate: '', match: false },
        educationLevel: { required: '', candidate: '', match: false },
        overall: 0
      },
      // Properties for global mode
      isOwnCandidate: globalMode ? (ownerInfo?.is_own_candidate ?? true) : true,
      ownerFirstName: globalMode ? ownerInfo?.owner_first_name : undefined,
      ownerLastName: globalMode ? ownerInfo?.owner_last_name : undefined
    };
  },
  
  /**
   * Get top candidates for a job offer
   */
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 5, globalMode: boolean = false): Promise<CandidateMatch[]> => {
    try {
      const matches = await matchDbService.calculateMatchesForJobOffer(jobOfferId, globalMode);
      return matches.slice(0, limit);
    } catch (error) {
      console.error('[Match DB Service] Error getting top candidates:', error);
      return [];
    }
  },
  
  /**
   * Get all matches for a job offer with details
   */
  getMatchesForJobOffer: async (jobOfferId: string, globalMode: boolean = false): Promise<CandidateMatch[]> => {
    try {
      return await matchDbService.calculateMatchesForJobOffer(jobOfferId, globalMode);
    } catch (error) {
      console.error('[Match DB Service] Error getting matches for job offer:', error);
      return [];
    }
  },

  /**
   * Force recalculation of all scores for a job offer (bypass cache)
   */
  forceRecalculateAllScores: async (jobOfferId: string, globalMode: boolean = false): Promise<CandidateMatch[]> => {
    try {
      console.log(`[Match DB Service] Force recalculating ALL scores for job offer: ${jobOfferId}`);
      
      // Delete all cached scores for this offer (only for user's candidates)
      if (!globalMode) {
        const { error: deleteError } = await supabase
          .from('candidate_job_matches')
          .delete()
          .eq('job_offer_id', jobOfferId);
          
        if (deleteError) {
          console.error('[Match DB Service] Error clearing cache:', deleteError);
        } else {
          console.log('[Match DB Service] Cache cleared, forcing full recalculation');
        }
      }
      
      // Now calculate with empty cache
      return await matchDbService.calculateMatchesForJobOffer(jobOfferId, globalMode);
    } catch (error) {
      console.error('[Match DB Service] Error in force recalculation:', error);
      return [];
    }
  }
};
