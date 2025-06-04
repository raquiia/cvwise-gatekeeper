
import { useState, useCallback, useRef } from 'react';
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
  const { activeJobOfferId } = useActiveJob();
  
  // Utiliser une ref pour éviter les dépendances cycliques
  const scoringStateRef = useRef(scoringState);
  scoringStateRef.current = scoringState;
  
  /**
   * Calculer le score avec l'IA pour un candidat (avec vérification cache optimisée)
   */
  const calculateAIScore = useCallback(async (candidateId: string, forceRecalculate = false) => {
    const currentKey = `${candidateId}_${activeJobOfferId || 'general'}`;
    
    // Vérifier si on a déjà un score récent en mémoire (sauf si forceRecalculate)
    const existing = scoringStateRef.current[currentKey];
    if (!forceRecalculate && existing && !existing.isLoading && existing.score !== null) {
      const age = Date.now() - existing.lastUpdated;
      if (age < 2 * 60 * 1000) { // 2 minutes en mémoire
        console.log('Using recent in-memory AI score for candidate:', candidateId);
        return existing;
      }
    }
    
    // Éviter les appels multiples simultanés pour le même candidat
    if (existing && existing.isLoading) {
      console.log('AI score calculation already in progress for candidate:', candidateId);
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
      console.log(`Calculating AI score ${forceRecalculate ? 'with force recalculate' : 'with optimized caching'} for candidate:`, candidateId, 'job:', activeJobOfferId);
      
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
      
      // Toast informatif sur la source du score
      const sourceMessage = result.source === 'database' ? 
        'Score récupéré depuis la base de données' :
        result.source === 'fresh_calculation' ? 
        'Nouveau score calculé avec l\'IA' : 
        'Score récupéré depuis le cache';
      
      // Ne pas afficher de toast pour le forceRecalculate car c'est explicitement demandé par l'utilisateur
      if (!forceRecalculate) {
        toast({
          title: "Score calculé",
          description: `${result.score}% - ${sourceMessage}`,
        });
      } else {
        toast({
          title: "Score recalculé",
          description: `${result.score}% - Nouvelle analyse IA terminée`,
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
  }, [activeJobOfferId]); // Seulement activeJobOfferId comme dépendance
  
  /**
   * Obtenir le score d'un candidat
   */
  const getAIScore = useCallback((candidateId: string) => {
    const key = `${candidateId}_${activeJobOfferId || 'general'}`;
    return scoringStateRef.current[key] || {
      score: null,
      explanation: '',
      breakdown: {},
      isLoading: false,
      error: null,
      isJobSpecific: Boolean(activeJobOfferId),
      lastUpdated: 0
    };
  }, [activeJobOfferId]);
  
  /**
   * Invalider les scores (changement d'offre active)
   */
  const invalidateScores = useCallback(() => {
    console.log('Invalidating AI scores due to context change');
    setScoringState({});
    scoringStateRef.current = {};
  }, []);
  
  /**
   * Précharger les scores depuis la base de données
   */
  const preloadScoresFromDatabase = useCallback(async (candidateIds: string[]) => {
    console.log('Preloading AI scores from database for', candidateIds.length, 'candidates');
    
    const promises = candidateIds.map(async (candidateId) => {
      try {
        const result = await aiScoringService.getScoreWithExplanation(candidateId, activeJobOfferId);
        if (result && result.source === 'database') {
          const key = `${candidateId}_${activeJobOfferId || 'general'}`;
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
    console.log('Preloading completed');
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
