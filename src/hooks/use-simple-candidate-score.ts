
import { useState, useEffect } from 'react';
import { useActiveJob } from '@/context/ActiveJobContext';
import { jobOfferService } from '@/services/data/job-offers/jobOfferService';
import { calculateGeneralCandidateScore, calculateJobMatchScore } from '@/services/scoring/improvedScoringService';
import type { CandidateData } from '@/services/data/candidateService';

export interface SimpleScore {
  value: number;
  isJobSpecific: boolean;
  isLoading: boolean;
}

export const useSimpleCandidateScore = (candidate: CandidateData): SimpleScore => {
  const [score, setScore] = useState<SimpleScore>({
    value: 0,
    isJobSpecific: false,
    isLoading: true
  });
  
  const { activeJobOfferId } = useActiveJob();

  useEffect(() => {
    if (!candidate) return;

    const calculateScore = async () => {
      setScore(prev => ({ ...prev, isLoading: true }));
      
      try {
        if (activeJobOfferId) {
          // Récupérer l'offre d'emploi pour le matching
          const jobOffers = await jobOfferService.getUserJobOffers();
          const activeJobOffer = jobOffers.find(offer => offer.id === activeJobOfferId);
          
          if (activeJobOffer) {
            const matchResult = calculateJobMatchScore(candidate, activeJobOffer);
            setScore({
              value: matchResult.overall,
              isJobSpecific: true,
              isLoading: false
            });
            return;
          }
        }
        
        // Score général
        const generalResult = calculateGeneralCandidateScore(candidate);
        setScore({
          value: generalResult.overall,
          isJobSpecific: false,
          isLoading: false
        });
        
      } catch (error) {
        console.error(`Error calculating score for candidate ${candidate.id}:`, error);
        // Fallback vers le score général
        const generalResult = calculateGeneralCandidateScore(candidate);
        setScore({
          value: generalResult.overall,
          isJobSpecific: false,
          isLoading: false
        });
      }
    };

    calculateScore();
  }, [candidate, activeJobOfferId]);

  return score;
};
