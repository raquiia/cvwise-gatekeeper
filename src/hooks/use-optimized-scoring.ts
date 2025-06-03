
import { useState, useEffect, useCallback, useRef } from 'react';
import { candidateMatchingService } from '@/services/data/candidate-matching/candidateMatchingService';
import { calculateCandidateScore } from '@/services/scoring/candidateScoring';
import type { CandidateData } from '@/services/data/candidateService';
import type { ScoreBreakdown } from '@/services/scoring/candidateScoring';

export interface ContextualScore extends ScoreBreakdown {
  isJobSpecific: boolean;
  jobOfferTitle?: string;
  matchContext?: string;
}

interface ScoreCache {
  [candidateId: string]: {
    score: ContextualScore;
    timestamp: number;
    jobOfferId?: string;
  };
}

export const useOptimizedScoring = () => {
  const [activeJobOfferId, setActiveJobOfferId] = useState<string | null>(null);
  const [activeJobOfferTitle, setActiveJobOfferTitle] = useState<string | null>(null);
  const [scoreCache, setScoreCache] = useState<ScoreCache>({});
  const [loadingScores, setLoadingScores] = useState<Set<string>>(new Set());
  
  const calculatingRef = useRef<Set<string>>(new Set());
  
  // Cache timeout: 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;
  
  useEffect(() => {
    // Get the current active job offer only once
    const currentJobOfferId = candidateMatchingService.getActiveJobOfferId();
    if (currentJobOfferId !== activeJobOfferId) {
      setActiveJobOfferId(currentJobOfferId);
      setScoreCache({}); // Clear cache when job offer changes
    }
  }, []); // Empty dependency array to run only once

  const calculateContextualScore = useCallback(async (candidate: CandidateData): Promise<ContextualScore> => {
    const candidateId = candidate.id!;
    
    // Prevent duplicate calculations
    if (calculatingRef.current.has(candidateId)) {
      // Return cached score if available, otherwise return a default
      const cached = scoreCache[candidateId];
      if (cached) return cached.score;
      
      // Return a default score while calculation is in progress
      const defaultScore = calculateCandidateScore(candidate);
      return {
        ...defaultScore,
        isJobSpecific: false,
        matchContext: 'Calcul en cours...'
      };
    }
    
    // Check cache first
    const cached = scoreCache[candidateId];
    if (cached && 
        (Date.now() - cached.timestamp < CACHE_TIMEOUT) &&
        cached.jobOfferId === activeJobOfferId) {
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
            setTimeout(() => reject(new Error('Timeout')), 5000);
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
      
      // Cache the result
      setScoreCache(prev => ({
        ...prev,
        [candidateId]: {
          score: contextualScore,
          timestamp: Date.now(),
          jobOfferId: activeJobOfferId
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
  }, [activeJobOfferId, activeJobOfferTitle, scoreCache]);

  const updateActiveJobOffer = useCallback((jobOfferId: string | null, jobTitle?: string) => {
    setActiveJobOfferId(jobOfferId);
    setActiveJobOfferTitle(jobTitle || null);
    setScoreCache({}); // Clear cache when job offer changes
  }, []);

  const getCachedScore = useCallback((candidateId: string): ContextualScore | null => {
    const cached = scoreCache[candidateId];
    if (cached && 
        (Date.now() - cached.timestamp < CACHE_TIMEOUT) &&
        cached.jobOfferId === activeJobOfferId) {
      return cached.score;
    }
    return null;
  }, [scoreCache, activeJobOfferId]);

  const isScoreLoading = useCallback((candidateId: string): boolean => {
    return loadingScores.has(candidateId);
  }, [loadingScores]);

  return {
    activeJobOfferId,
    activeJobOfferTitle,
    calculateContextualScore,
    updateActiveJobOffer,
    getCachedScore,
    isScoreLoading,
    isJobSpecific: !!activeJobOfferId
  };
};
