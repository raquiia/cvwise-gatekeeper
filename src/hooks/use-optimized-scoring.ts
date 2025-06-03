
import { useState, useEffect, useCallback, useRef } from 'react';
import { candidateMatchingService } from '@/services/data/candidate-matching/candidateMatchingService';
import { calculateCandidateScore } from '@/services/scoring/candidateScoring';
import type { CandidateData } from '@/services/data/candidateService';
import type { ScoreBreakdown } from '@/services/scoring/candidateScoring';
import { useActiveJob } from '@/context/ActiveJobContext';

export interface ContextualScore extends ScoreBreakdown {
  isJobSpecific: boolean;
  jobOfferTitle?: string;
  matchContext?: string;
}

interface ScoreCache {
  [key: string]: {
    score: ContextualScore;
    timestamp: number;
    version: number;
  };
}

export const useOptimizedScoring = () => {
  const { activeJobOfferId, activeJobOfferTitle } = useActiveJob();
  const [scoreCache, setScoreCache] = useState<ScoreCache>({});
  const [loadingScores, setLoadingScores] = useState<Set<string>>(new Set());
  const [cacheVersion, setCacheVersion] = useState(0);
  
  const calculatingRef = useRef<Set<string>>(new Set());
  
  // Cache timeout: 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;
  
  // Clear cache when active job changes
  useEffect(() => {
    console.log('Active job changed:', activeJobOfferId, 'clearing cache');
    setScoreCache({});
    setCacheVersion(prev => prev + 1);
    setLoadingScores(new Set());
    calculatingRef.current.clear();
  }, [activeJobOfferId]);

  const getCacheKey = useCallback((candidateId: string): string => {
    return `${candidateId}_${activeJobOfferId || 'general'}_v${cacheVersion}`;
  }, [activeJobOfferId, cacheVersion]);

  const calculateContextualScore = useCallback(async (candidate: CandidateData): Promise<ContextualScore> => {
    const candidateId = candidate.id!;
    const cacheKey = getCacheKey(candidateId);
    
    // Prevent duplicate calculations
    if (calculatingRef.current.has(candidateId)) {
      // Return cached score if available, otherwise return a default
      const cached = scoreCache[cacheKey];
      if (cached && cached.version === cacheVersion) return cached.score;
      
      // Return a default score while calculation is in progress
      const defaultScore = calculateCandidateScore(candidate);
      return {
        ...defaultScore,
        isJobSpecific: false,
        matchContext: 'Calcul en cours...'
      };
    }
    
    // Check cache first
    const cached = scoreCache[cacheKey];
    if (cached && 
        cached.version === cacheVersion &&
        (Date.now() - cached.timestamp < CACHE_TIMEOUT)) {
      return cached.score;
    }

    // Mark as calculating
    calculatingRef.current.add(candidateId);
    setLoadingScores(prev => new Set([...prev, candidateId]));

    try {
      let contextualScore: ContextualScore;

      if (!activeJobOfferId) {
        // No active job offer - return general profile completeness score
        const generalScore = calculateCandidateScore(candidate);
        contextualScore = {
          ...generalScore,
          isJobSpecific: false,
          matchContext: 'Score général de profil'
        };
      } else {
        try {
          // Calculate job-specific score with timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 8000);
          });

          const scorePromise = candidateMatchingService.calculateCandidateActiveJobScore(candidate);
          const jobMatch = await Promise.race([scorePromise, timeoutPromise]);
          
          contextualScore = {
            skills: Math.round((jobMatch.details?.skills?.matchPercentage || 0)),
            experience: Math.round(jobMatch.details?.experienceLevel?.score || 0),
            education: Math.round(jobMatch.details?.educationLevel?.score || 0),
            profileCompleteness: calculateCandidateScore(candidate).profileCompleteness,
            overall: jobMatch.score,
            details: {
              skillsCount: jobMatch.details?.skills?.matched?.length || 0,
              experienceYears: jobMatch.details?.experienceLevel?.candidate || 0,
              educationLevel: jobMatch.details?.educationLevel?.candidate || 'Non spécifié',
              completenessPercentage: calculateCandidateScore(candidate).details.completenessPercentage
            },
            isJobSpecific: true,
            jobOfferTitle: activeJobOfferTitle,
            matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée'
          };
        } catch (error) {
          console.error(`Error calculating job-specific score for candidate ${candidateId}:`, error);
          // Fallback to general score
          const generalScore = calculateCandidateScore(candidate);
          contextualScore = {
            ...generalScore,
            isJobSpecific: false,
            matchContext: 'Score général (erreur de calcul)'
          };
        }
      }
      
      // Cache the result with version
      setScoreCache(prev => ({
        ...prev,
        [cacheKey]: {
          score: contextualScore,
          timestamp: Date.now(),
          version: cacheVersion
        }
      }));
      
      return contextualScore;
    } catch (error) {
      console.error(`Error calculating score for candidate ${candidateId}:`, error);
      // Fallback to general score
      const generalScore = calculateCandidateScore(candidate);
      const fallbackScore: ContextualScore = {
        ...generalScore,
        isJobSpecific: false,
        matchContext: 'Score général (erreur)'
      };
      
      return fallbackScore;
    } finally {
      // Always clean up
      calculatingRef.current.delete(candidateId);
      setLoadingScores(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  }, [activeJobOfferId, activeJobOfferTitle, scoreCache, cacheVersion, getCacheKey]);

  const getCachedScore = useCallback((candidateId: string): ContextualScore | null => {
    const cacheKey = getCacheKey(candidateId);
    const cached = scoreCache[cacheKey];
    if (cached && 
        cached.version === cacheVersion &&
        (Date.now() - cached.timestamp < CACHE_TIMEOUT)) {
      return cached.score;
    }
    return null;
  }, [scoreCache, cacheVersion, getCacheKey]);

  const isScoreLoading = useCallback((candidateId: string): boolean => {
    return loadingScores.has(candidateId);
  }, [loadingScores]);

  const invalidateScores = useCallback(() => {
    console.log('Invalidating all scores');
    setScoreCache({});
    setCacheVersion(prev => prev + 1);
    setLoadingScores(new Set());
    calculatingRef.current.clear();
  }, []);

  return {
    activeJobOfferId,
    activeJobOfferTitle,
    calculateContextualScore,
    getCachedScore,
    isScoreLoading,
    invalidateScores,
    isJobSpecific: !!activeJobOfferId
  };
};
