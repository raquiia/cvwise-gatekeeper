
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { localMatchingService } from '@/services/data/candidate-matching/localMatchingService';
import { useActiveJob } from '@/context/ActiveJobContext';
import type { JobOffer } from '@/services/data/job-offers/types';
import type { ExtendedCandidateMatch } from '@/pages/types/candidateTypes';

export const useJobOfferDetails = (jobOfferId: string | undefined) => {
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [candidateMatches, setCandidateMatches] = useState<ExtendedCandidateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { setActiveJobOffer } = useActiveJob();

  const loadJobOffer = async () => {
    if (!jobOfferId) return;
    
    try {
      setLoading(true);
      console.log(`[Job Offer Details] 📋 Loading job offer: ${jobOfferId}`);
      
      const offer = await jobOfferService.getJobOfferById(jobOfferId);
      if (!offer) {
        throw new Error('Offre d\'emploi non trouvée');
      }
      
      setJobOffer(offer);
      
      // Set active job context immediately
      setActiveJobOffer(jobOfferId, offer.title);
      console.log(`[Job Offer Details] 🎯 Active job context set: ${offer.title}`);
      
    } catch (err: any) {
      console.error('[Job Offer Details] ❌ Error loading job offer:', err);
      setError(err.message || 'Erreur lors du chargement de l\'offre');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateMatches = async (forceRecalculate: boolean = false) => {
    if (!jobOfferId) return;
    
    try {
      setMatchLoading(true);
      console.log(`[Job Offer Details] 🔄 Loading matches (force: ${forceRecalculate})`);
      
      // Use local instant matching
      const matches = forceRecalculate 
        ? await localMatchingService.forceRecalculateAllScores(jobOfferId)
        : await localMatchingService.calculateMatchesForJobOffer(jobOfferId);
      
      // Convert to ExtendedCandidateMatch format
      const extendedMatches: ExtendedCandidateMatch[] = matches.map(match => ({
        id: match.candidateId,
        candidateId: match.candidateId,
        firstName: match.firstName,
        lastName: match.lastName,
        position: match.position,
        company: match.company,
        score: match.score,
        matchedSkills: [], // Will be populated by skills renderer
        missingSkills: [], // Will be populated by skills renderer
        details: {
          skills: { matchPercentage: match.details.skills, matchedSkills: [], missingSkills: [] },
          experienceLevel: { score: match.details.experience, explanation: '' },
          roleMatch: { score: match.details.roleMatch, explanation: match.explanation },
          location: { score: match.details.location, explanation: '' }
        },
        explanation: match.explanation
      }));
      
      setCandidateMatches(extendedMatches);
      
      console.log(`[Job Offer Details] ✅ Loaded ${extendedMatches.length} matches instantly`);
      
      toast({
        title: "✅ Correspondances calculées",
        description: `${extendedMatches.length} candidats analysés instantanément`,
      });
      
    } catch (err: any) {
      console.error('[Job Offer Details] ❌ Error loading matches:', err);
      setError(err.message || 'Erreur lors du calcul des correspondances');
      toast({
        title: "Erreur",
        description: "Impossible de calculer les correspondances",
        variant: "destructive"
      });
    } finally {
      setMatchLoading(false);
    }
  };

  const handleRecalculateMatches = async (includeGlobalCandidates: boolean = false) => {
    console.log(`[Job Offer Details] ⚡ Force recalculating matches (global: ${includeGlobalCandidates})`);
    await loadCandidateMatches(true);
  };

  useEffect(() => {
    loadJobOffer();
  }, [jobOfferId]);

  useEffect(() => {
    if (jobOffer) {
      loadCandidateMatches();
    }
  }, [jobOffer]);

  return {
    jobOffer,
    candidateMatches,
    loading,
    matchLoading,
    error,
    handleRecalculateMatches
  };
};
