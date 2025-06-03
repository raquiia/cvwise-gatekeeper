
import { useState, useEffect } from 'react';
import { persistentScoringService } from '@/services/scoring/persistentScoringService';
import { useActiveJob } from '@/context/ActiveJobContext';
import type { CandidateData } from '@/services/data/candidateService';

export interface SimpleScore {
  value: number;
  isJobSpecific: boolean;
  isLoading: boolean;
}

export const useSimpleCandidateScore = (candidate: CandidateData): SimpleScore => {
  const [score, setScore] = useState<SimpleScore>({
    value: candidate.score || 0,
    isJobSpecific: false,
    isLoading: false
  });
  
  const { activeJobOfferId } = useActiveJob();

  useEffect(() => {
    if (!candidate.id) return;

    const loadScore = async () => {
      setScore(prev => ({ ...prev, isLoading: true }));
      
      try {
        if (activeJobOfferId) {
          // Récupérer le score job-spécifique
          const jobScore = await persistentScoringService.getCandidateJobScore(candidate.id, activeJobOfferId);
          if (jobScore) {
            setScore({
              value: jobScore.overall,
              isJobSpecific: true,
              isLoading: false
            });
            return;
          }
        }
        
        // Utiliser le score général de la base de données directement
        setScore({
          value: candidate.score || 0,
          isJobSpecific: false,
          isLoading: false
        });
        
      } catch (error) {
        console.error(`Error loading score for candidate ${candidate.id}:`, error);
        // En cas d'erreur, utiliser le score de la base
        setScore({
          value: candidate.score || 0,
          isJobSpecific: !!activeJobOfferId,
          isLoading: false
        });
      }
    };

    loadScore();
  }, [candidate.id, candidate.score, activeJobOfferId]);

  return score;
};
