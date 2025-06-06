
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
   * Calculate match scores for candidates against a job offer
   * @param jobOfferId - ID of the job offer
   * @param globalMode - If true, includes all candidates from all users
   */
  calculateMatchesForJobOffer: async (jobOfferId: string, globalMode: boolean = false): Promise<CandidateMatch[]> => {
    try {
      console.log(`[Match DB Service] Calculating matches for job offer: ${jobOfferId} (Global mode: ${globalMode})`);
      
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
      
      // Récupérer les détails de l'offre d'emploi
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
      console.log(`[Match DB Service] Processing matches against job: ${jobOffer.title}`);
      
      // Traiter chaque candidat
      const matches: CandidateMatch[] = [];
      
      for (const item of matchData) {
        const itemData = item as any;
        const candidate = processCandidateData(itemData.candidate || {});
        const existingMatch = itemData.match || {};
        
        // Informations du propriétaire (pour le mode global)
        const ownerInfo = globalMode ? {
          owner_first_name: itemData.candidate?.owner_first_name,
          owner_last_name: itemData.candidate?.owner_last_name,
          is_own_candidate: itemData.candidate?.is_own_candidate
        } : {};
        
        console.log(`[Match DB Service] Processing candidate: ${candidate.first_name} ${candidate.last_name} (ID: ${candidate.id})${globalMode && !itemData.candidate?.is_own_candidate ? ` - Owner: ${ownerInfo.owner_first_name} ${ownerInfo.owner_last_name}` : ''}`);
        
        // Toujours recalculer le score pour avoir les dernières données
        try {
          const newMatch = await calculateCandidateJobMatch(candidate as CandidateData, jobOffer as JobOffer);
          console.log(`[Match DB Service] New match scores for ${candidate.first_name} ${candidate.last_name}: Global=${newMatch.globalScore}%, Local=${newMatch.localScore}%, Skills=${newMatch.skillsOnlyScore}%`);
          
          // Sauvegarder le nouveau score dans la base de données (seulement pour ses propres candidats)
          const shouldSaveMatch = !globalMode || itemData.candidate?.is_own_candidate;
          
          if (shouldSaveMatch) {
            const matchDetailsData = matchDetailsToJson(newMatch.details);
            
            const { error: insertError } = await supabase
              .from('candidate_job_matches')
              .upsert({
                candidate_id: candidate.id,
                job_offer_id: jobOfferId,
                match_score: newMatch.score,
                skills_match_score: newMatch.details.skills.matchPercentage,
                experience_match_score: newMatch.details.experienceLevel.score || 0,
                education_match_score: newMatch.details.educationLevel.score || 0,
                location_match_score: newMatch.details.location.score || 0,
                match_details: matchDetailsData as any
              }, {
                onConflict: 'candidate_id,job_offer_id'
              });
              
            if (insertError) {
              console.error('[Match DB Service] Error saving match results:', insertError);
            } else {
              console.log(`[Match DB Service] Successfully saved match for candidate ${candidate.id} with score ${newMatch.score}%`);
            }
          }
          
          matches.push({
            id: `${candidate.id}-${jobOfferId}`,
            candidate_id: candidate.id,
            job_offer_id: jobOfferId,
            match_score: newMatch.score,
            global_score: newMatch.globalScore,
            local_score: newMatch.localScore,
            skills_only_score: newMatch.skillsOnlyScore,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            position: candidate.position,
            company: candidate.company,
            match_details: matchDetailsToJson(newMatch.details),
            // Frontend-compatible properties
            candidateId: candidate.id,
            firstName: candidate.first_name,
            lastName: candidate.last_name,
            score: newMatch.score,
            details: newMatch.details,
            // Propriétés pour le mode global
            isOwnCandidate: globalMode ? itemData.candidate?.is_own_candidate : true,
            ownerFirstName: globalMode ? ownerInfo.owner_first_name : undefined,
            ownerLastName: globalMode ? ownerInfo.owner_last_name : undefined
          });
          
        } catch (matchError) {
          console.error(`[Match DB Service] Error calculating match for candidate ${candidate.id}:`, matchError);
          
          // Utiliser les données existantes en cas d'erreur
          matches.push({
            id: `${candidate.id}-${jobOfferId}`,
            candidate_id: candidate.id,
            job_offer_id: jobOfferId,
            match_score: existingMatch.match_score || 0,
            global_score: 0,
            local_score: 0,
            skills_only_score: 0,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            position: candidate.position,
            company: candidate.company,
            match_details: existingMatch.match_details || {},
            // Frontend-compatible properties
            candidateId: candidate.id,
            firstName: candidate.first_name,
            lastName: candidate.last_name,
            score: existingMatch.match_score || 0,
            details: existingMatch.match_details || {
              skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
              experienceLevel: { required: 0, candidate: 0, match: false },
              location: { required: '', candidate: '', match: false },
              educationLevel: { required: '', candidate: '', match: false },
              overall: 0
            },
            // Propriétés pour le mode global
            isOwnCandidate: globalMode ? itemData.candidate?.is_own_candidate : true,
            ownerFirstName: globalMode ? ownerInfo.owner_first_name : undefined,
            ownerLastName: globalMode ? ownerInfo.owner_last_name : undefined
          });
        }
      }
      
      // Trier par score (décroissant)
      matches.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      
      console.log(`[Match DB Service] Generated ${matches.length} matches for job offer (${globalMode ? 'global' : 'private'} mode). Top scores: ${matches.slice(0, 3).map(m => `${m.firstName} ${m.lastName}: Local=${m.local_score}%, Global=${m.global_score}%`).join(', ')}`);
      return matches;
      
    } catch (error) {
      console.error('[Match DB Service] Error calculating matches for job offer:', error);
      return [];
    }
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
  }
};
