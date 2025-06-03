
import { useState, useEffect, useCallback, useRef } from 'react';
import { persistentScoringService, type ScoreDetails } from '@/services/scoring/persistentScoringService';
import { scoreRecalculationService } from '@/services/scoring/scoreRecalculationService';
import type { CandidateData } from '@/services/data/candidateService';
import { useActiveJob } from '@/context/ActiveJobContext';
import { useToast } from '@/hooks/use-toast';

export interface ContextualScore extends ScoreDetails {
  isJobSpecific: boolean;
  jobOfferTitle?: string;
  matchContext?: string;
}

interface ScoreCache {
  [key: string]: {
    score: ContextualScore;
    timestamp: number;
  };
}

export const useOptimizedScoring = () => {
  const { activeJobOfferId, activeJobOfferTitle } = useActiveJob();
  const [scoreCache, setScoreCache] = useState<ScoreCache>({});
  const [loadingScores, setLoadingScores] = useState<Set<string>>(new Set());
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();
  
  const calculatingRef = useRef<Set<string>>(new Set());
  
  // Cache timeout: 30 minutes (scores are now persistent)
  const CACHE_TIMEOUT = 30 * 60 * 1000;
  
  // Clear cache when active job changes
  useEffect(() => {
    console.log('Active job changed:', activeJobOfferId, 'clearing cache');
    setScoreCache({});
    setLoadingScores(new Set());
    calculatingRef.current.clear();
  }, [activeJobOfferId]);

  const getCacheKey = useCallback((candidateId: string): string => {
    return `${candidateId}_${activeJobOfferId || 'general'}`;
  }, [activeJobOfferId]);

  const calculateContextualScore = useCallback(async (candidate: CandidateData): Promise<ContextualScore> => {
    const candidateId = candidate.id!;
    const cacheKey = getCacheKey(candidateId);
    
    // Check cache first
    const cached = scoreCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_TIMEOUT)) {
      return cached.score;
    }

    // Prevent duplicate calculations
    if (calculatingRef.current.has(candidateId)) {
      // Return cached score if available, otherwise return a loading state
      if (cached) return cached.score;
      
      return {
        skills: 0,
        experience: 0,
        education: 0,
        profileCompleteness: 0,
        overall: 0,
        details: {
          skillsCount: 0,
          experienceYears: 0,
          educationLevel: 'Calcul en cours...',
          completenessPercentage: 0
        },
        isJobSpecific: !!activeJobOfferId,
        matchContext: 'Calcul en cours...'
      };
    }

    // Mark as calculating
    calculatingRef.current.add(candidateId);
    setLoadingScores(prev => new Set([...prev, candidateId]));

    try {
      let scoreDetails: ScoreDetails | null = null;
      let contextualScore: ContextualScore;

      if (!activeJobOfferId) {
        // Get general score from database
        scoreDetails = await persistentScoringService.getCandidateGeneralScore(candidateId);
        
        if (scoreDetails) {
          contextualScore = {
            ...scoreDetails,
            isJobSpecific: false,
            matchContext: 'Score général de profil'
          };
        } else {
          // Recalculate if no score exists
          console.log(`No general score found for candidate ${candidateId}, recalculating...`);
          await persistentScoringService.recalculateGeneralScore(candidateId);
          scoreDetails = await persistentScoringService.getCandidateGeneralScore(candidateId);
          
          contextualScore = {
            ...(scoreDetails || {
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
              }
            }),
            isJobSpecific: false,
            matchContext: 'Score général de profil'
          };
        }
      } else {
        // Get job-specific score from database
        scoreDetails = await persistentScoringService.getCandidateJobScore(candidateId, activeJobOfferId);
        
        if (scoreDetails) {
          contextualScore = {
            ...scoreDetails,
            isJobSpecific: true,
            jobOfferTitle: activeJobOfferTitle,
            matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée'
          };
        } else {
          // Calculate job score if it doesn't exist
          console.log(`No job score found for candidate ${candidateId} and job ${activeJobOfferId}, calculating...`);
          await persistentScoringService.calculateAndStoreJobScore(candidateId, activeJobOfferId);
          scoreDetails = await persistentScoringService.getCandidateJobScore(candidateId, activeJobOfferId);
          
          contextualScore = {
            ...(scoreDetails || {
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
              }
            }),
            isJobSpecific: true,
            jobOfferTitle: activeJobOfferTitle,
            matchContext: activeJobOfferTitle ? `Score pour "${activeJobOfferTitle}"` : 'Score pour l\'offre sélectionnée'
          };
        }
      }
      
      // Cache the result
      setScoreCache(prev => ({
        ...prev,
        [cacheKey]: {
          score: contextualScore,
          timestamp: Date.now()
        }
      }));
      
      return contextualScore;
    } catch (error) {
      console.error(`Error calculating score for candidate ${candidateId}:`, error);
      
      // Fallback score
      const fallbackScore: ContextualScore = {
        skills: 40,
        experience: 40,
        education: 40,
        profileCompleteness: 40,
        overall: 40,
        details: {
          skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
          experienceYears: candidate.years_experience || 0,
          educationLevel: 'Non spécifié',
          completenessPercentage: 40
        },
        isJobSpecific: !!activeJobOfferId,
        matchContext: 'Score de secours (erreur)'
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
  }, [activeJobOfferId, activeJobOfferTitle, scoreCache, getCacheKey]);

  const getCachedScore = useCallback((candidateId: string): ContextualScore | null => {
    const cacheKey = getCacheKey(candidateId);
    const cached = scoreCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_TIMEOUT)) {
      return cached.score;
    }
    return null;
  }, [scoreCache, getCacheKey]);

  const isScoreLoading = useCallback((candidateId: string): boolean => {
    return loadingScores.has(candidateId);
  }, [loadingScores]);

  const invalidateScores = useCallback(() => {
    console.log('Invalidating all scores');
    setScoreCache({});
    setLoadingScores(new Set());
    calculatingRef.current.clear();
  }, []);

  const preCalculateJobScores = useCallback(async () => {
    if (!activeJobOfferId) return;
    
    console.log('Pre-calculating job scores for all candidates');
    await persistentScoringService.calculateAllCandidatesJobScores(activeJobOfferId);
    
    // Invalidate cache to force refresh
    invalidateScores();
  }, [activeJobOfferId, invalidateScores]);

  const recalculateAllScores = useCallback(async () => {
    if (isRecalculating) return;
    
    setIsRecalculating(true);
    
    try {
      if (activeJobOfferId) {
        // Recalculate job-specific scores
        toast({
          title: "Recalcul en cours",
          description: "Recalcul des scores pour cette offre d'emploi...",
        });
        
        const result = await scoreRecalculationService.recalculateJobScores(activeJobOfferId);
        
        toast({
          title: "Recalcul terminé",
          description: `${result.success} scores recalculés, ${result.failed} échecs`,
        });
      } else {
        // Recalculate general scores
        toast({
          title: "Recalcul en cours",
          description: "Recalcul des scores généraux de tous les candidats...",
        });
        
        const result = await scoreRecalculationService.recalculateAllGeneralScores();
        
        toast({
          title: "Recalcul terminé",
          description: `${result.success} scores recalculés, ${result.failed} échecs`,
        });
      }
      
      // Invalidate cache to show new scores
      invalidateScores();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast({
        title: "Erreur de recalcul",
        description: "Une erreur est survenue lors du recalcul des scores",
        variant: "destructive"
      });
    } finally {
      setIsRecalculating(false);
    }
  }, [activeJobOfferId, invalidateScores, toast, isRecalculating]);

  return {
    activeJobOfferId,
    activeJobOfferTitle,
    calculateContextualScore,
    getCachedScore,
    isScoreLoading,
    invalidateScores,
    preCalculateJobScores,
    recalculateAllScores,
    isRecalculating,
    isJobSpecific: !!activeJobOfferId
  };
};
