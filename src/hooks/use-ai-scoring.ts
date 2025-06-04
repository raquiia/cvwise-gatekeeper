
import { useState, useCallback, useEffect } from 'react';
import { aiScoringService, AIScoringResult } from '@/services/scoring/aiScoringService';
import { useActiveJob } from '@/context/ActiveJobContext';
import { toast } from '@/hooks/use-toast';

interface AIScoringState {
  [candidateId: string]: {
    score: number | null;
    explanation: string;
    breakdown: any;
    isLoading: boolean;
    error: string | null;
    isJobSpecific: boolean;
    lastUpdated: number;
    source?: string;
  };
}

export const useAIScoring = () => {
  const [scoringState, setScoringState] = useState<AIScoringState>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [preloadedCandidates, setPreloadedCandidates] = useState<Set<string>>(new Set());
  const { activeJobOfferId } = useActiveJob();
  
  /**
   * Calculer le score avec l'IA pour un candidat (avec vérification cache optimisée)
   */
  const calculateAIScore = useCallback(async (candidateId: string, forceRecalculate = false) => {
    const currentKey = `${candidateId}_${activeJobOfferId || 'general'}`;
    
    // Vérifier si on a déjà un score récent en mémoire (sauf si forceRecalculate)
    const existing = scoringState[currentKey];
    if (!forceRecalculate && existing && !existing.isLoading && existing.score !== null) {
      const age = Date.now() - existing.lastUpdated;
      if (age < 5 * 60 * 1000) { // 5 minutes en mémoire
        console.log('Using recent in-memory AI score for candidate:', candidateId);
        return existing;
      }
    }
    
    // Marquer comme en cours de calcul
    setScoringState(prev => ({
      ...prev,
      [currentKey]: {
        score: null,
        explanation: '',
        breakdown: {},
        isLoading: true,
        error: null,
        isJobSpecific: Boolean(activeJobOfferId),
        lastUpdated: Date.now()
      }
    }));
    
    try {
      console.log('Calculating AI score with optimized caching for candidate:', candidateId, 'job:', activeJobOfferId);
      
      let result;
      
      if (forceRecalculate) {
        // Forcer le recalcul (ignorer complètement le cache)
        result = await aiScoringService.forceRecalculate(candidateId, activeJobOfferId);
      } else {
        // Utiliser le système de cache optimisé
        result = await aiScoringService.getScoreWithExplanation(candidateId, activeJobOfferId);
      }
      
      if (!result) {
        throw new Error('Impossible de calculer le score avec l\'IA');
      }
      
      const newState = {
        score: result.score,
        explanation: result.explanation,
        breakdown: result.breakdown,
        isLoading: false,
        error: null,
        isJobSpecific: result.isJobSpecific,
        lastUpdated: Date.now(),
        source: result.source
      };
      
      setScoringState(prev => ({
        ...prev,
        [currentKey]: newState
      }));
      
      console.log('AI score calculated successfully:', result.score, 'Source:', result.source);
      
      // Toast informatif uniquement pour les nouveaux calculs
      if (result.source === 'fresh_calculation' || forceRecalculate) {
        toast({
          title: "Score calculé",
          description: `${result.score}% - Nouveau score calculé avec l'IA`,
        });
      }
      
      return newState;
      
    } catch (error: any) {
      console.error('Error calculating AI score:', error);
      
      const errorState = {
        score: null,
        explanation: '',
        breakdown: {},
        isLoading: false,
        error: error.message || 'Erreur lors du calcul du score IA',
        isJobSpecific: Boolean(activeJobOfferId),
        lastUpdated: Date.now()
      };
      
      setScoringState(prev => ({
        ...prev,
        [currentKey]: errorState
      }));
      
      toast({
        title: "Erreur de calcul",
        description: "Impossible de calculer le score avec l'IA",
        variant: "destructive",
      });
      
      return errorState;
    }
  }, [activeJobOfferId, scoringState]);
  
  /**
   * Obtenir le score d'un candidat
   */
  const getAIScore = useCallback((candidateId: string) => {
    const key = `${candidateId}_${activeJobOfferId || 'general'}`;
    return scoringState[key] || {
      score: null,
      explanation: '',
      breakdown: {},
      isLoading: false,
      error: null,
      isJobSpecific: Boolean(activeJobOfferId),
      lastUpdated: 0
    };
  }, [scoringState, activeJobOfferId]);
  
  /**
   * Invalider les scores (changement d'offre active)
   */
  const invalidateScores = useCallback(() => {
    console.log('Invalidating AI scores due to context change');
    setScoringState({});
    setPreloadedCandidates(new Set());
  }, []);
  
  /**
   * Précharger les scores depuis la base de données (optimisé pour éviter les doublons)
   */
  const preloadScoresFromDatabase = useCallback(async (candidateIds: string[]) => {
    const contextKey = activeJobOfferId || 'general';
    
    // Filtrer les candidats déjà préchargés pour ce contexte
    const newCandidateIds = candidateIds.filter(candidateId => {
      const fullKey = `${candidateId}_${contextKey}`;
      return !preloadedCandidates.has(fullKey) && !scoringState[fullKey];
    });
    
    if (newCandidateIds.length === 0) {
      console.log('All candidates already preloaded for current context');
      return;
    }
    
    console.log('Preloading AI scores from database for', newCandidateIds.length, 'new candidates');
    
    // Marquer comme préchargés
    setPreloadedCandidates(prev => {
      const newSet = new Set(prev);
      newCandidateIds.forEach(candidateId => {
        newSet.add(`${candidateId}_${contextKey}`);
      });
      return newSet;
    });
    
    const promises = newCandidateIds.map(async (candidateId) => {
      try {
        const result = await aiScoringService.getScoreWithExplanation(candidateId, activeJobOfferId);
        if (result && result.source === 'database') {
          const key = `${candidateId}_${contextKey}`;
          setScoringState(prev => ({
            ...prev,
            [key]: {
              score: result.score,
              explanation: result.explanation,
              breakdown: result.breakdown,
              isLoading: false,
              error: null,
              isJobSpecific: result.isJobSpecific,
              lastUpdated: Date.now(),
              source: result.source
            }
          }));
        }
      } catch (error) {
        console.warn('Failed to preload score for candidate:', candidateId, error);
      }
    });
    
    await Promise.all(promises);
    console.log('Preloading completed for', newCandidateIds.length, 'candidates');
  }, [activeJobOfferId, preloadedCandidates, scoringState]);
  
  // Invalider les scores quand l'offre active change
  useEffect(() => {
    invalidateScores();
  }, [activeJobOfferId]);
  
  return {
    calculateAIScore,
    getAIScore,
    invalidateScores,
    preloadScoresFromDatabase,
    isCalculating,
    isJobSpecific: Boolean(activeJobOfferId)
  };
};
