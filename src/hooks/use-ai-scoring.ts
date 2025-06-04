
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
   * Calculer le score avec l'IA pour un candidat (cache permanent basé sur hash)
   */
  const calculateAIScore = useCallback(async (candidateId: string, forceRecalculate = false) => {
    const currentKey = `${candidateId}_${activeJobOfferId || 'general'}`;
    
    // Si on ne force pas le recalcul, vérifier si on a déjà un score en mémoire
    const existing = scoringState[currentKey];
    if (!forceRecalculate && existing && !existing.isLoading && existing.score !== null) {
      console.log('Using existing in-memory AI score for candidate:', candidateId);
      return existing;
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
      console.log('Calculating AI score with permanent cache for candidate:', candidateId, 'job:', activeJobOfferId);
      
      let result;
      
      if (forceRecalculate) {
        // Forcer le recalcul (ignorer complètement le cache permanent)
        result = await aiScoringService.forceRecalculate(candidateId, activeJobOfferId);
      } else {
        // Utiliser le système de cache permanent basé sur hash
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
      
      // Toast informatif uniquement pour les nouveaux calculs ou recalculs forcés
      if (result.source === 'fresh_calculation' || result.source === 'forced_recalculation') {
        toast({
          title: "Score calculé",
          description: `${result.score}% - ${result.source === 'forced_recalculation' ? 'Score recalculé' : 'Nouveau score calculé'} avec l'IA`,
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
   * Précharger les scores depuis la base de données et retourner le résultat directement
   */
  const preloadScoresFromDatabase = useCallback(async (candidateIds: string[]): Promise<{ [candidateId: string]: any }> => {
    const contextKey = activeJobOfferId || 'general';
    const loadedScores: { [candidateId: string]: any } = {};
    
    // Filtrer les candidats déjà préchargés pour ce contexte
    const newCandidateIds = candidateIds.filter(candidateId => {
      const fullKey = `${candidateId}_${contextKey}`;
      return !preloadedCandidates.has(fullKey);
    });
    
    if (newCandidateIds.length === 0) {
      console.log('All candidates already preloaded for current context');
      // Retourner les scores déjà en mémoire
      candidateIds.forEach(candidateId => {
        const key = `${candidateId}_${contextKey}`;
        if (scoringState[key]) {
          loadedScores[candidateId] = scoringState[key];
        }
      });
      return loadedScores;
    }
    
    console.log('Preloading AI scores from permanent database cache for', newCandidateIds.length, 'new candidates');
    
    // Marquer comme préchargés
    setPreloadedCandidates(prev => {
      const newSet = new Set(prev);
      newCandidateIds.forEach(candidateId => {
        newSet.add(`${candidateId}_${contextKey}`);
      });
      return newSet;
    });
    
    // Précharger de manière séquentielle pour éviter la surcharge
    for (const candidateId of newCandidateIds) {
      try {
        console.log('Preloading score for candidate:', candidateId);
        const result = await aiScoringService.getScoreWithExplanation(candidateId, activeJobOfferId);
        
        if (result && result.source === 'database') {
          const key = `${candidateId}_${contextKey}`;
          console.log('Successfully preloaded score from database for candidate:', candidateId, 'Score:', result.score);
          
          const scoreData = {
            score: result.score,
            explanation: result.explanation,
            breakdown: result.breakdown,
            isLoading: false,
            error: null,
            isJobSpecific: result.isJobSpecific,
            lastUpdated: Date.now(),
            source: result.source
          };
          
          // Charger immédiatement dans l'état
          setScoringState(prev => ({
            ...prev,
            [key]: scoreData
          }));
          
          // Ajouter au résultat retourné
          loadedScores[candidateId] = scoreData;
        } else {
          console.log('No cached score found in database for candidate:', candidateId);
        }
      } catch (error) {
        console.warn('Failed to preload score for candidate:', candidateId, error);
      }
    }
    
    console.log('Preloading completed for', newCandidateIds.length, 'candidates');
    return loadedScores;
  }, [activeJobOfferId, preloadedCandidates, scoringState]);
  
  /**
   * Forcer la réanalyse d'un candidat (ignorer le cache permanent)
   */
  const forceReanalyzeCandidate = useCallback(async (candidateId: string) => {
    console.log('Force reanalyzing candidate:', candidateId);
    return await calculateAIScore(candidateId, true);
  }, [calculateAIScore]);
  
  // Invalider les scores quand l'offre active change
  useEffect(() => {
    invalidateScores();
  }, [activeJobOfferId]);
  
  return {
    calculateAIScore,
    getAIScore,
    invalidateScores,
    preloadScoresFromDatabase,
    forceReanalyzeCandidate,
    isCalculating,
    isJobSpecific: Boolean(activeJobOfferId)
  };
};
