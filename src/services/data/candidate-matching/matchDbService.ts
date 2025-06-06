
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
      
      // Utiliser la fonction RPC appropriée selon le mode
      const rpcFunction = globalMode ? 'get_all_matches_for_job_offer' : 'get_matches_for_job_offer';
      
      const { data: matchData, error: matchError } = await supabase
        .rpc(rpcFunction, { p_job_offer_id: jobOfferId });
        
      if (matchError) {
        console.error(`[Match DB Service] Error fetching candidates via RPC (${rpcFunction}):`, matchError);
        throw matchError;
      }
      
      if (!matchData || matchData.length === 0) {
        console.log(`[Match DB Service] No candidates found for job offer (${globalMode ? 'global' : 'private'} mode)`);
        return [];
      }
      
      console.log(`[Match DB Service] Found ${matchData.length} candidates to process (${globalMode ? 'global' : 'private'} mode)`);
      
      // Récupérer les détails de l'offre d'emploi avec timestamp
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
      
      // Identifier les candidats qui ont besoin d'un recalcul
      const candidatesNeedingRecalculation = [];
      const candidatesUsingCache = [];
      
      for (const item of matchData) {
        // Type assertion pour corriger les types de Supabase
        const itemData = item as any;
        const candidate = processCandidateData(itemData.candidate || {});
        const existingMatch = itemData.match || {};
        const candidateUpdatedAt = new Date(candidate.updated_at || candidate.created_at);
        
        // Vérifier si on peut utiliser le cache
        const canUseCache = this.canUseCachedScore(
          existingMatch,
          candidateUpdatedAt,
          jobOfferUpdatedAt
        );
        
        if (canUseCache) {
          candidatesUsingCache.push({ candidate, existingMatch, item: itemData });
          console.log(`[Match DB Service] Using cached score for ${candidate.first_name} ${candidate.last_name}: ${existingMatch.match_score}%`);
        } else {
          candidatesNeedingRecalculation.push({ candidate, existingMatch, item: itemData });
          console.log(`[Match DB Service] Needs recalculation: ${candidate.first_name} ${candidate.last_name} (${canUseCache ? 'cached' : 'stale/missing score'})`);
        }
      }
      
      console.log(`[Match DB Service] Cache efficiency: ${candidatesUsingCache.length} cached, ${candidatesNeedingRecalculation.length} to recalculate`);
      
      // Traiter les candidats en cache
      const matches: CandidateMatch[] = [];
      
      for (const { candidate, existingMatch, item } of candidatesUsingCache) {
        const ownerInfo = globalMode ? {
          owner_first_name: item.candidate?.owner_first_name,
          owner_last_name: item.candidate?.owner_last_name,
          is_own_candidate: item.candidate?.is_own_candidate
        } : {};
        
        matches.push(this.createCandidateMatch(
          candidate,
          jobOfferId,
          existingMatch,
          globalMode,
          ownerInfo
        ));
      }
      
      // Recalculer uniquement les candidats qui en ont besoin
      for (const { candidate, existingMatch, item } of candidatesNeedingRecalculation) {
        const ownerInfo = globalMode ? {
          owner_first_name: item.candidate?.owner_first_name,
          owner_last_name: item.candidate?.owner_last_name,
          is_own_candidate: item.candidate?.is_own_candidate
        } : {};
        
        try {
          const newMatch = await calculateCandidateJobMatch(candidate as CandidateData, jobOffer as JobOffer);
          console.log(`[Match DB Service] Recalculated scores for ${candidate.first_name} ${candidate.last_name}: Global=${newMatch.globalScore}%, Local=${newMatch.localScore}%, Skills=${newMatch.skillsOnlyScore}%`);
          
          // Sauvegarder le nouveau score avec les timestamps (seulement pour ses propres candidats)
          const shouldSaveMatch = !globalMode || item.candidate?.is_own_candidate;
          
          if (shouldSaveMatch) {
            const candidateUpdatedAt = new Date(candidate.updated_at || candidate.created_at);
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
          
          // Utiliser les nouvelles données pour créer le match
          const updatedMatchData = {
            ...existingMatch,
            match_score: newMatch.score,
            global_score: newMatch.globalScore,
            local_score: newMatch.localScore,
            skills_only_score: newMatch.skillsOnlyScore,
            match_details: matchDetailsToJson(newMatch.details)
          };
          
          matches.push(this.createCandidateMatch(
            candidate,
            jobOfferId,
            updatedMatchData,
            globalMode,
            ownerInfo,
            newMatch.details
          ));
          
        } catch (matchError) {
          console.error(`[Match DB Service] Error calculating match for candidate ${candidate.id}:`, matchError);
          
          // Utiliser les données existantes en cas d'erreur
          matches.push(this.createCandidateMatch(
            candidate,
            jobOfferId,
            existingMatch,
            globalMode,
            ownerInfo
          ));
        }
      }
      
      // Trier par score (décroissant) - utiliser le score local par défaut
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
    // Si pas de score existant, il faut calculer
    if (!existingMatch.match_score && existingMatch.match_score !== 0) {
      return false;
    }
    
    // Si pas de timestamps de cache, il faut recalculer
    if (!existingMatch.candidate_updated_at || !existingMatch.job_offer_updated_at) {
      return false;
    }
    
    const cachedCandidateTime = new Date(existingMatch.candidate_updated_at);
    const cachedJobOfferTime = new Date(existingMatch.job_offer_updated_at);
    
    // Vérifier si les données n'ont pas changé depuis le dernier calcul
    const candidateUnchanged = candidateUpdatedAt <= cachedCandidateTime;
    const jobOfferUnchanged = jobOfferUpdatedAt <= cachedJobOfferTime;
    
    // Vérifier la version de calcul (pour forcer le recalcul lors d'améliorations d'algorithme)
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
      id: `${candidate.id}-${jobOfferId}`,
      candidate_id: candidate.id,
      job_offer_id: jobOfferId,
      match_score: matchData.match_score || 0,
      global_score: matchData.global_score || 0,
      local_score: matchData.local_score || 0,
      skills_only_score: matchData.skills_only_score || 0,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      position: candidate.position,
      company: candidate.company,
      match_details: matchData.match_details || {},
      // Frontend-compatible properties
      candidateId: candidate.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      score: matchData.local_score || matchData.match_score || 0, // Utiliser local_score comme score principal
      details: calculatedDetails || matchData.match_details || {
        skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
        experienceLevel: { required: 0, candidate: 0, match: false },
        location: { required: '', candidate: '', match: false },
        educationLevel: { required: '', candidate: '', match: false },
        overall: 0
      },
      // Propriétés pour le mode global
      isOwnCandidate: globalMode ? ownerInfo.is_own_candidate : true,
      ownerFirstName: globalMode ? ownerInfo.owner_first_name : undefined,
      ownerLastName: globalMode ? ownerInfo.owner_last_name : undefined
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
      
      // Supprimer tous les scores en cache pour cette offre (seulement pour les candidats de l'utilisateur)
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
      
      // Maintenant calculer avec le cache vide
      return await matchDbService.calculateMatchesForJobOffer(jobOfferId, globalMode);
    } catch (error) {
      console.error('[Match DB Service] Error in force recalculation:', error);
      return [];
    }
  }
};
