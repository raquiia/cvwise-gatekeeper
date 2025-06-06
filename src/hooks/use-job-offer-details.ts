
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { matchDbService } from '@/services/data/candidate-matching/matchDbService';
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
      console.log(`[Job Offer Details] Using intelligent caching for job offer: ${jobOfferId} (Global mode: ${globalMode})`);
      
      // Utiliser le nouveau service optimisé avec cache intelligent
      const matches = await matchDbService.calculateMatchesForJobOffer(jobOfferId, globalMode);
      
      console.log(`[Job Offer Details] Received ${matches?.length || 0} matches with intelligent caching (${globalMode ? 'global' : 'private'} mode)`);
      
      if (matches && matches.length > 0) {
        const processedMatches = matches.map((match) => {
          console.log(`[Job Offer Details] Processing cached/calculated match: ${match.firstName} ${match.lastName} with scores: Local=${match.localScore}%, Global=${match.globalScore}%, Skills=${match.skillsOnlyScore}%${globalMode && !match.isOwnCandidate ? ' (Externe)' : ''}`);
          
          return {
            candidateId: match.candidateId,
            firstName: match.firstName || '',
            lastName: match.lastName || '',
            position: match.position || '',
            company: match.company || '',
            score: match.localScore || match.score || 0, // Utiliser localScore comme score principal
            globalScore: match.globalScore || 0,
            localScore: match.localScore || 0,
            skillsOnlyScore: match.skillsOnlyScore || 0,
            // Propriétés pour le mode global
            isOwnCandidate: match.isOwnCandidate,
            ownerFirstName: match.ownerFirstName,
            ownerLastName: match.ownerLastName,
            details: match.details || {
              skills: { matched: [], missing: [], additional: [], matchPercentage: 0 },
              experienceLevel: { required: 0, candidate: 0, match: false },
              location: { required: '', candidate: '', match: false },
              educationLevel: { required: '', candidate: '', match: false },
              overall: 0
            },
            candidate: {
              id: match.candidateId,
              first_name: match.firstName,
              last_name: match.lastName,
              position: match.position,
              company: match.company,
              location: match.details?.location?.candidate || '',
              years_experience: match.details?.experienceLevel?.candidate || 0,
              // Propriétés pour le mode global
              owner_first_name: match.ownerFirstName,
              owner_last_name: match.ownerLastName,
              is_own_candidate: match.isOwnCandidate
            },
            match: {
              match_score: match.localScore || match.score || 0,
              global_score: match.globalScore || 0,
              local_score: match.localScore || 0,
              skills_only_score: match.skillsOnlyScore || 0,
              skills_match_score: match.details?.skills?.matchPercentage || 0,
              experience_match_score: match.details?.experienceLevel?.score || 0,
              education_match_score: match.details?.educationLevel?.score || 0,
              location_match_score: match.details?.location?.score || 0,
              match_details: match.details || {}
            }
          } as ExtendedCandidateMatch;
        });
        
        // Trier par score décroissant (score local par défaut)
        const sortedMatches = processedMatches.sort((a, b) => b.score - a.score);
        setCandidateMatches(sortedMatches);
        
        console.log(`[Job Offer Details] Processed ${sortedMatches.length} matches with intelligent caching. Top scores:`, 
          sortedMatches.slice(0, 3).map(m => `${m.firstName} ${m.lastName}: Local=${m.localScore}%/Global=${m.globalScore}%/Skills=${m.skillsOnlyScore}%${globalMode && !m.isOwnCandidate ? ' (Externe)' : ''}`));
      } else {
        console.log(`[Job Offer Details] No matches returned from intelligent caching (${globalMode ? 'global' : 'private'} mode)`);
        setCandidateMatches([]);
      }
      
    } catch (error) {
      console.error('[Job Offer Details] Error fetching candidate matches with intelligent caching:', error);
      setCandidateMatches([]);
      
      toast({
        title: "Problème de récupération des correspondances",
        description: "Une erreur s'est produite lors de la récupération des correspondances. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleRecalculateMatches = async (globalMode: boolean = isGlobalMode, forceRecalculation: boolean = false) => {
    if (!jobOfferId) return;
    
    try {
      setMatchLoading(true);
      setIsGlobalMode(globalMode);
      
      console.log(`[Job Offer Details] ${forceRecalculation ? 'Force recalculating' : 'Smart recalculating'} matches for job offer: ${jobOfferId} (Global mode: ${globalMode})`);
      
      let matches;
      if (forceRecalculation) {
        // Forcer le recalcul complet (ignorer le cache)
        matches = await matchDbService.forceRecalculateAllScores(jobOfferId, globalMode);
        console.log(`[Job Offer Details] Force recalculation completed. Found ${matches.length} matches`);
        
        toast({
          title: "Recalcul forcé terminé",
          description: `${matches.length} correspondances ont été entièrement recalculées`,
        });
      } else {
        // Utiliser le cache intelligent (par défaut)
        matches = await matchDbService.calculateMatchesForJobOffer(jobOfferId, globalMode);
        console.log(`[Job Offer Details] Smart recalculation completed. Found ${matches.length} matches`);
        
        toast({
          title: "Actualisation terminée",
          description: `${matches.length} correspondances actualisées avec cache intelligent`,
        });
      }
      
      // Rafraîchir les données avec le mode sélectionné
      await fetchCandidateMatches(globalMode);
      
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
