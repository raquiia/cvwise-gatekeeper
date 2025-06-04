
import { useState, useCallback } from 'react';
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
  };
}

export const useAIScoring = () => {
  const [scoringState, setScoringState] = useState<AIScoringState>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const { activeJobOfferId } = useActiveJob();
  
  /**
   * Calculer le score avec l'IA pour un candidat
   */
  const calculateAIScore = useCallback(async (candidateId: string, forceRecalculate = false) => {
    const currentKey = `${candidateId}_${activeJobOfferId || 'general'}`;
    
    // Vérifier si on a déjà un score récent (sauf si forceRecalculate)
    const existing = scoringState[currentKey];
    if (!forceRecalculate && existing && !existing.isLoading && existing.score !== null) {
      const age = Date.now() - existing.lastUpdated;
      if (age < 5 * 60 * 1000) { // 5 minutes
        console.log('Using cached AI score for candidate:', candidateId);
        return existing;
      }
    }
    
    // Marquer comme en cours de calcul
    setScoringState(prev => ({
      ...prev,
      [currentKey]: {
        ...prev[currentKey],
        isLoading: true,
        error: null
      }
    }));
    
    try {
      console.log('Calculating AI score for candidate:', candidateId, 'job:', activeJobOfferId);
      
      const result = await aiScoringService.getScoreWithExplanation(candidateId, activeJobOfferId);
      
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
        lastUpdated: Date.now()
      };
      
      setScoringState(prev => ({
        ...prev,
        [currentKey]: newState
      }));
      
      console.log('AI score calculated successfully:', result.score);
      
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
   * Recalculer tous les scores avec l'IA
   */
  const recalculateAllAIScores = useCallback(async (candidateIds: string[]) => {
    setIsCalculating(true);
    try {
      console.log('Recalculating AI scores for', candidateIds.length, 'candidates');
      
      // Invalider tous les caches
      setScoringState({});
      
      // Calculer les nouveaux scores en parallèle (max 3 à la fois pour éviter de surcharger l'API)
      const batchSize = 3;
      for (let i = 0; i < candidateIds.length; i += batchSize) {
        const batch = candidateIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(candidateId => calculateAIScore(candidateId, true))
        );
        
        // Petite pause entre les batches
        if (i + batchSize < candidateIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      toast({
        title: "Recalcul terminé",
        description: "Tous les scores IA ont été recalculés",
      });
      
    } catch (error) {
      console.error('Error recalculating AI scores:', error);
      toast({
        title: "Erreur de recalcul",
        description: "Impossible de recalculer tous les scores",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [calculateAIScore]);
  
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
  }, []);
  
  return {
    calculateAIScore,
    recalculateAllAIScores,
    getAIScore,
    invalidateScores,
    isCalculating,
    isJobSpecific: Boolean(activeJobOfferId)
  };
};
