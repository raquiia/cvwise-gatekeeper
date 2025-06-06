
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { candidateMatchingService } from '@/services/data/candidate-matching';
import { supabase } from '@/integrations/supabase/client';
import { processCandidateData } from '@/utils/candidateUtils';
import { useActiveJob } from '@/context/ActiveJobContext';
import type { JobOffer } from '@/services/data/job-offers/types';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

export function useJobOfferDetails(jobOfferId: string | undefined) {
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [candidateMatches, setCandidateMatches] = useState<ExtendedCandidateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const { setActiveJobOffer } = useActiveJob();

  const fetchJobOffer = async () => {
    if (!jobOfferId) {
      setError("ID d'offre d'emploi manquant");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await jobOfferService.getJobOfferById(jobOfferId);
      
      if (!data) {
        setError("Offre d'emploi non trouvée");
        setLoading(false);
        return;
      }
      
      setJobOffer(data);
      
      // Définir cette offre comme active pour le contexte de scoring
      console.log('[Job Offer Details] Setting active job offer for scoring context:', jobOfferId, data.title);
      await setActiveJobOffer(jobOfferId, data.title);
      
      await fetchCandidateMatches(false); // Commencer en mode privé
      
      setLoading(false);
    } catch (error: any) {
      console.error('[Job Offer Details] Error fetching job offer:', error);
      setError(error?.message || "Impossible de récupérer l'offre d'emploi");
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de récupérer l'offre d'emploi",
        variant: "destructive",
      });
      
      setLoading(false);
    }
  };

  const fetchCandidateMatches = async (globalMode: boolean = isGlobalMode) => {
    if (!jobOfferId) return;
    
    try {
      console.log(`[Job Offer Details] Fetching candidate matches for job offer: ${jobOfferId} (Global mode: ${globalMode})`);
      
      // Utiliser la fonction RPC appropriée selon le mode
      const rpcFunction = globalMode ? 'get_all_matches_for_job_offer' : 'get_matches_for_job_offer';
      
      const { data, error } = await supabase
        .rpc(rpcFunction, { p_job_offer_id: jobOfferId });
      
      if (error) {
        console.error(`[Job Offer Details] RPC Error (${rpcFunction}):`, error);
        throw error;
      }
      
      console.log(`[Job Offer Details] RPC returned ${data?.length || 0} candidates (${globalMode ? 'global' : 'private'} mode)`);
      
      if (data && data.length > 0) {
        const processedMatches = data.map((item: any) => {
          const candidate = processCandidateData(item.candidate || {});
          const match = item.match || {};
          
          console.log(`[Job Offer Details] Processing candidate: ${candidate.first_name} ${candidate.last_name} with score: ${match.match_score || 0}${globalMode ? ` (Own: ${item.candidate?.is_own_candidate})` : ''}`);
          
          return {
            candidateId: candidate.id,
            firstName: candidate.first_name || '',
            lastName: candidate.last_name || '',
            position: candidate.position || '',
            company: candidate.company || '',
            score: match.match_score || 0,
            globalScore: match.global_score || 0,
            localScore: match.local_score || 0,
            skillsOnlyScore: match.skills_only_score || 0,
            // Propriétés pour le mode global
            isOwnCandidate: globalMode ? item.candidate?.is_own_candidate : true,
            ownerFirstName: globalMode ? item.candidate?.owner_first_name : undefined,
            ownerLastName: globalMode ? item.candidate?.owner_last_name : undefined,
            details: match.match_details || {
              skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
              experienceLevel: { required: 0, candidate: 0, match: false },
              location: { required: '', candidate: '', match: false },
              educationLevel: { required: '', candidate: '', match: false },
              overall: 0
            },
            candidate: {
              ...candidate,
              owner_first_name: globalMode ? item.candidate?.owner_first_name : undefined,
              owner_last_name: globalMode ? item.candidate?.owner_last_name : undefined,
              is_own_candidate: globalMode ? item.candidate?.is_own_candidate : true
            },
            match: {
              match_score: match.match_score || 0,
              global_score: match.global_score || 0,
              local_score: match.local_score || 0,
              skills_only_score: match.skills_only_score || 0,
              skills_match_score: match.skills_match_score || 0,
              experience_match_score: match.experience_match_score || 0,
              education_match_score: match.education_match_score || 0,
              location_match_score: match.location_match_score || 0,
              match_details: match.match_details || {
                skills: { matched: [], missing: [], additional: [], matchPercentage: 0 }
              }
            }
          } as ExtendedCandidateMatch;
        });
        
        // Trier par score décroissant (score local par défaut)
        const sortedMatches = processedMatches.sort((a, b) => b.score - a.score);
        setCandidateMatches(sortedMatches);
        
        console.log(`[Job Offer Details] Processed ${sortedMatches.length} matches (${globalMode ? 'global' : 'private'} mode). Top scores (Local/Global/Skills):`, 
          sortedMatches.slice(0, 3).map(m => `${m.firstName} ${m.lastName}: ${m.score}%/${m.globalScore}%/${m.skillsOnlyScore}%${globalMode && !m.isOwnCandidate ? ' (Externe)' : ''}`));
      } else {
        console.log(`[Job Offer Details] No candidates found or returned by RPC (${globalMode ? 'global' : 'private'} mode)`);
        setCandidateMatches([]);
      }
      
    } catch (error) {
      console.error('[Job Offer Details] Error fetching candidate matches:', error);
      setCandidateMatches([]);
      
      toast({
        title: "Problème de récupération des correspondances",
        description: "Une erreur s'est produite lors de la récupération des correspondances. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleRecalculateMatches = async (globalMode: boolean = isGlobalMode) => {
    if (!jobOfferId) return;
    
    try {
      setMatchLoading(true);
      setIsGlobalMode(globalMode);
      
      console.log(`[Job Offer Details] Starting recalculation of matches for job offer: ${jobOfferId} (Global mode: ${globalMode})`);
      
      // Utiliser le service de matching pour forcer le recalcul
      const newMatches = await candidateMatchingService.calculateMatchesForJobOffer(jobOfferId);
      
      console.log(`[Job Offer Details] Recalculation completed. Found ${newMatches.length} matches`);
      
      // Rafraîchir les données avec le mode sélectionné
      await fetchCandidateMatches(globalMode);
      
      toast({
        title: "Calcul terminé",
        description: `${candidateMatches.length} correspondances ont été recalculées avec succès`,
      });
      
    } catch (error: any) {
      console.error('[Job Offer Details] Error recalculating matches:', error);
      
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de recalculer les correspondances",
        variant: "destructive",
      });
    } finally {
      setMatchLoading(false);
    }
  };

  useEffect(() => {
    if (jobOfferId) {
      fetchJobOffer();
    } else {
      setError("ID d'offre d'emploi manquant");
      setLoading(false);
    }
  }, [jobOfferId]);

  return {
    jobOffer,
    candidateMatches,
    loading,
    matchLoading,
    error,
    isGlobalMode,
    fetchCandidateMatches,
    handleRecalculateMatches
  };
}
