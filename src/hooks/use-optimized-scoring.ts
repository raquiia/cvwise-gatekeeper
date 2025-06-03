
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
  const [cachedJobOffer, setCachedJobOffer] = useState<any>(null);
  
  const scoreTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const maxConcurrentCalculations = 5;
  const concurrentCalculations = useRef<Set<string>>(new Set());
  const calculationQueue = useRef<string[]>([]);
  
  // Cache timeout: 5 minutes
  const CACHE_TIMEOUT = 5 * 60 * 1000;
  
  useEffect(() => {
    // Get the current active job offer
    const currentJobOfferId = candidateMatchingService.getActiveJobOfferId();
    setActiveJobOfferId(currentJobOfferId);
    
    // Clear cache when job offer changes
    if (currentJobOfferId !== activeJobOfferId) {
      setScoreCache({});
      setCachedJobOffer(null);
    }
  }, []);

  const calculateContextualScore = useCallback(async (candidate: CandidateData): Promise<ContextualScore> => {
    const candidateId = candidate.id!;
    
    // Check cache first
    const cached = scoreCache[candidateId];
    if (cached && 
        (Date.now() - cached.timestamp < CACHE_TIMEOUT) &&
        cached.jobOfferId === activeJobOfferId) {
      return cached.score;
    }

    // Add to loading set
    setLoadingScores(prev => new Set([...prev, candidateId]));

    try {
      if (!activeJobOfferId) {
        // No active job offer - return general profile completeness score
        const generalScore = calculateCandidateScore(candidate);
        const contextualScore: ContextualScore = {
          ...generalScore,
          isJobSpecific: false,
          matchContext: 'Score général de profil'
        };
        
        // Cache the result
        setScoreCache(prev => ({
          ...prev,
          [candidateId]: {
            score: contextualScore,
            timestamp: Date.now(),
            jobOfferId: undefined
          }
        }));
        
        return contextualScore;
      }

      // Calculate job-specific score with timeout
      const scorePromise = candidateMatchingService.calculateCandidateActiveJobScore(candidate);
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Score calculation timeout'));
        }, 10000); // 10 second timeout
        
        scoreTimeouts.current.set(candidateId, timeout);
      });

      const jobMatch = await Promise.race([scorePromise, timeoutPromise]);
      
      // Clear timeout
      const timeout = scoreTimeouts.current.get(candidateId);
      if (timeout) {
        clearTimeout(timeout);
        scoreTimeouts.current.delete(candidateId);
      }
      
      const contextualScore: ContextualScore = {
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
        matchContext: 'Score général (erreur de calcul)'
      };
      
      // Cache the fallback
      setScoreCache(prev => ({
        ...prev,
        [candidateId]: {
          score: fallbackScore,
          timestamp: Date.now(),
          jobOfferId: activeJobOfferId
        }
      }));
      
      return fallbackScore;
    } finally {
      // Remove from loading set
      setLoadingScores(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
      
      // Remove from concurrent calculations
      concurrentCalculations.current.delete(candidateId);
      
      // Process next item in queue if any
      if (calculationQueue.current.length > 0 && 
          concurrentCalculations.current.size < maxConcurrentCalculations) {
        const nextCandidateId = calculationQueue.current.shift();
        if (nextCandidateId) {
          // This would need the candidate object, so we'll handle this in the component
        }
      }
    }
  }, [activeJobOfferId, activeJobOfferTitle, scoreCache]);

  const updateActiveJobOffer = useCallback((jobOfferId: string | null, jobTitle?: string) => {
    setActiveJobOfferId(jobOfferId);
    setActiveJobOfferTitle(jobTitle || null);
    // Clear cache when job offer changes
    setScoreCache({});
    setCachedJobOffer(null);
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      scoreTimeouts.current.forEach(timeout => clearTimeout(timeout));
      scoreTimeouts.current.clear();
    };
  }, []);

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
