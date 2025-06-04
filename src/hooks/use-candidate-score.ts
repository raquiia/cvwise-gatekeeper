
import { useState, useEffect } from 'react';
import { useOptimizedScoring } from './use-optimized-scoring';
import type { CandidateData } from '@/services/data/candidateService';
import type { ContextualScore } from './use-optimized-scoring';

export const useCandidateScore = (candidate: CandidateData) => {
  const [score, setScore] = useState<ContextualScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    calculateContextualScore, 
    getCachedScore, 
    isScoreLoading,
    isJobSpecific 
  } = useOptimizedScoring();

  useEffect(() => {
    if (!candidate.id) return;

    const loadScore = async () => {
      setIsLoading(true);
      
      // Check cache first
      const cachedScore = getCachedScore(candidate.id!);
      if (cachedScore) {
        setScore(cachedScore);
        setIsLoading(false);
        return;
      }

      // Calculate new score
      try {
        const calculatedScore = await calculateContextualScore(candidate);
        setScore(calculatedScore);
      } catch (error) {
        console.error('Error calculating score:', error);
        // Fallback score
        setScore({
          skills: 50,
          experience: 50,
          education: 50,
          profileCompleteness: 50,
          overall: 50,
          details: {
            skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
            experienceYears: candidate.years_experience || 0,
            educationLevel: 'Non spécifié',
            completenessPercentage: 50
          },
          isJobSpecific,
          matchContext: 'Score de secours'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadScore();
  }, [candidate, calculateContextualScore, getCachedScore, isJobSpecific]);

  return {
    score,
    isLoading: isLoading || isScoreLoading(candidate.id || ''),
    isJobSpecific
  };
};
