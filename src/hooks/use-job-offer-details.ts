
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

  const loadCandidateMatches = async (forceRecalculate: boolean = false, includeGlobalCandidates: boolean = false) => {
    if (!jobOfferId) return;
    
    try {
      setMatchLoading(true);
      console.log(`[Job Offer Details] 🔄 Loading matches (force: ${forceRecalculate}, global: ${includeGlobalCandidates})`);
      
      // Use local instant matching with global mode support
      const matches = forceRecalculate 
        ? await localMatchingService.forceRecalculateAllScores(jobOfferId, includeGlobalCandidates)
        : await localMatchingService.calculateMatchesForJobOffer(jobOfferId, includeGlobalCandidates);
      
      // Convert to ExtendedCandidateMatch format with enhanced ownership info
      const extendedMatches: ExtendedCandidateMatch[] = matches.map(match => ({
        candidateId: match.candidateId,
        firstName: match.firstName,
        lastName: match.lastName,
        position: match.position,
        company: match.company,
        score: match.score,
        details: {
          skills: {
            matched: match.skillsDetails.matched,
            missing: match.skillsDetails.missing,
            additional: match.skillsDetails.additional,
            matchPercentage: match.details.skills,
          },
          experienceLevel: {
            required: 0,
            candidate: 0,
            match: true,
            score: match.details.experience,
          },
          location: {
            required: '',
            candidate: '',
            match: true,
            score: match.details.location,
            needsRelocation: match.needsRelocation, // Nouvelle propriété
          },
          educationLevel: {
            required: '',
            candidate: '',
            match: true,
            score: 100,
          },
          overall: match.score,
          roleMatch: {
            score: match.details.roleMatch,
            explanation: match.explanation
          }
        },
        // Propriétés enrichies pour la distinction des candidats
        isOwnCandidate: match.isOwnCandidate,
        ownerFirstName: match.ownerFirstName,
        ownerLastName: match.ownerLastName
      }));
      
      setCandidateMatches(extendedMatches);
      
      // Stats détaillées pour debug
      const ownCount = extendedMatches.filter(m => m.isOwnCandidate).length;
      const otherCount = extendedMatches.filter(m => !m.isOwnCandidate).length;
      const totalCount = extendedMatches.length;
      const localCount = extendedMatches.filter(m => !m.details?.location?.needsRelocation).length;
      const distantCount = extendedMatches.filter(m => m.details?.location?.needsRelocation).length;
      
      console.log(`[Job Offer Details] 📊 Match statistics:`);
      console.log(`[Job Offer Details]    Total matches: ${totalCount}`);
      console.log(`[Job Offer Details]    Own candidates: ${ownCount}`);
      console.log(`[Job Offer Details]    Other candidates: ${otherCount}`);
      console.log(`[Job Offer Details]    Local candidates: ${localCount}`);
      console.log(`[Job Offer Details]    Distant candidates: ${distantCount}`);
      console.log(`[Job Offer Details]    Mode: ${includeGlobalCandidates ? 'GLOBAL' : 'LOCAL'}`);
      
      // Log compétences pour les premiers candidats
      extendedMatches.slice(0, 3).forEach(match => {
        const ownerInfo = match.isOwnCandidate ? 'Own' : `${match.ownerFirstName} ${match.ownerLastName}`;
        const locationInfo = match.details?.location?.needsRelocation ? 'Distant' : 'Local';
        console.log(`[Job Offer Details] 🎯 ${match.firstName} ${match.lastName} (${ownerInfo}, ${locationInfo}):`);
        console.log(`[Job Offer Details]    Matched skills: ${match.details?.skills?.matched?.join(', ') || 'none'}`);
        console.log(`[Job Offer Details]    Missing skills: ${match.details?.skills?.missing?.join(', ') || 'none'}`);
      });
      
      toast({
        title: "✅ Correspondances calculées",
        description: `${totalCount} candidats analysés (${localCount} locaux, ${distantCount} distants)`,
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

  const handleRecalculateMatches = async (includeGlobalCandidates: boolean = false, forceRecalculation: boolean = false) => {
    console.log(`[Job Offer Details] ⚡ Recalculating matches (global: ${includeGlobalCandidates}, force: ${forceRecalculation})`);
    await loadCandidateMatches(forceRecalculation, includeGlobalCandidates);
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
