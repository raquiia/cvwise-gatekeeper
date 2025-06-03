
import { useState, useEffect } from 'react';
import { useActiveJob } from '@/context/ActiveJobContext';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { calculateGeneralCandidateScore, calculateJobMatchScore, type ImprovedScoreBreakdown } from '@/services/scoring/improvedScoringService';
import type { CandidateData } from '@/services/data/candidateService';

export const useImprovedCandidateScore = (candidate: CandidateData) => {
  const [scoreBreakdown, setScoreBreakdown] = useState<ImprovedScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeJobOfferId } = useActiveJob();

  useEffect(() => {
    const calculateScore = async () => {
      setIsLoading(true);
      
      try {
        if (activeJobOfferId) {
          // Récupérer l'offre d'emploi pour le matching
          const jobOffers = await jobOfferService.getUserJobOffers();
          const activeJobOffer = jobOffers.find(offer => offer.id === activeJobOfferId);
          
          if (activeJobOffer) {
            const matchScore = calculateJobMatchScore(candidate, activeJobOffer);
            setScoreBreakdown(matchScore);
          } else {
            // Fallback vers le score général si l'offre n'est pas trouvée
            const generalScore = calculateGeneralCandidateScore(candidate);
            setScoreBreakdown(generalScore);
          }
        } else {
          // Score général
          const generalScore = calculateGeneralCandidateScore(candidate);
          setScoreBreakdown(generalScore);
        }
      } catch (error) {
        console.error('Error calculating candidate score:', error);
        // Fallback vers le score général en cas d'erreur
        const generalScore = calculateGeneralCandidateScore(candidate);
        setScoreBreakdown(generalScore);
      } finally {
        setIsLoading(false);
      }
    };

    if (candidate) {
      calculateScore();
    }
  }, [candidate, activeJobOfferId]);

  return {
    scoreBreakdown,
    isLoading,
    refresh: () => {
      if (candidate) {
        const generalScore = calculateGeneralCandidateScore(candidate);
        setScoreBreakdown(generalScore);
      }
    }
  };
};
