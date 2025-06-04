
import { useState, useEffect, useCallback, useMemo } from 'react';
import { optimizedScoringService, ScoringBreakdown } from '@/services/scoring/optimizedScoringService';
import { CandidateData } from '@/services/data/candidateService';
import { useActiveJob } from '@/context/ActiveJobContext';

interface ScoringState {
  [candidateId: string]: {
    score: ScoringBreakdown | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: number;
  };
}

export interface ContextualScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  profileCompleteness: number;
  isJobSpecific: boolean;
  matchContext?: string;
  details: {
    skillsCount: number;
    experienceYears: number;
    educationLevel: string;
    completenessPercentage: number;
  };
}

export const useOptimizedScoring = () => {
  const [scoringState, setScoringState] = useState<ScoringState>({});
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { activeJobOfferId, activeJobOfferTitle } = useActiveJob();
  
  const isJobSpecific = Boolean(activeJobOfferId);
  
  /**
   * Obtenir le score mis en cache d'un candidat
   */
  const getCachedScore = useCallback((candidateId: string): ScoringBreakdown | null => {
    return scoringState[candidateId]?.score || null;
  }, [scoringState]);
  
  /**
   * Vérifier si un score est en cours de calcul
   */
  const isScoreLoading = useCallback((candidateId: string): boolean => {
    return scoringState[candidateId]?.isLoading || false;
  }, [scoringState]);
  
  /**
   * Calculer le score contextuel d'un candidat
   */
  const calculateContextualScore = useCallback(async (candidate: CandidateData): Promise<ContextualScore | null> => {
    if (!candidate.id) return null;
    
    const candidateId = candidate.id;
    
    // Marquer comme en cours de chargement
    setScoringState(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        isLoading: true,
        error: null
      }
    }));
    
    try {
      let scoreBreakdown: ScoringBreakdown | null;
      
      if (activeJobOfferId) {
        // Mode matching avec offre d'emploi
        scoreBreakdown = await optimizedScoringService.calculateMatchingScore(candidateId, activeJobOfferId);
      } else {
        // Mode complétude du profil
        scoreBreakdown = await optimizedScoringService.getCompletenessScore(candidateId);
      }
      
      if (!scoreBreakdown) {
        throw new Error('Impossible de calculer le score');
      }
      
      // Mettre à jour le cache
      setScoringState(prev => ({
        ...prev,
        [candidateId]: {
          score: scoreBreakdown,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        }
      }));
      
      // Convertir en format ContextualScore
      const contextualScore: ContextualScore = {
        overall: scoreBreakdown.is_job_specific ? 
          scoreBreakdown.total_matching_score! : 
          scoreBreakdown.general_score,
        skills: scoreBreakdown.is_job_specific ? 
          scoreBreakdown.skills_tools_score! : 
          scoreBreakdown.skills_score,
        experience: scoreBreakdown.is_job_specific ? 
          scoreBreakdown.relevant_experience_score! : 
          scoreBreakdown.experience_score,
        education: scoreBreakdown.is_job_specific ? 
          scoreBreakdown.education_match_score! : 
          scoreBreakdown.education_score,
        profileCompleteness: scoreBreakdown.is_job_specific ? 
          50 : // Valeur fixe pour le matching
          scoreBreakdown.cv_structure_score,
        isJobSpecific: scoreBreakdown.is_job_specific,
        matchContext: scoreBreakdown.is_job_specific ? activeJobOfferTitle : undefined,
        details: {
          skillsCount: Array.isArray(candidate.skills) ? candidate.skills.length : 0,
          experienceYears: candidate.years_experience || 0,
          educationLevel: Array.isArray(candidate.education) && candidate.education.length > 0 ? 
            'Renseigné' : 'Non renseigné',
          completenessPercentage: scoreBreakdown.is_job_specific ? 
            scoreBreakdown.total_matching_score! : 
            scoreBreakdown.general_score
        }
      };
      
      return contextualScore;
      
    } catch (error: any) {
      console.error('Error calculating contextual score:', error);
      
      setScoringState(prev => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          isLoading: false,
          error: error.message || 'Erreur de calcul'
        }
      }));
      
      return null;
    }
  }, [activeJobOfferId, activeJobOfferTitle]);
  
  /**
   * Invalider les scores en cache
   */
  const invalidateScores = useCallback(() => {
    console.log('Invalidating all cached scores');
    setScoringState({});
  }, []);
  
  /**
   * Pré-calculer les scores pour une liste de candidats
   */
  const preCalculateJobScores = useCallback(async () => {
    if (!activeJobOfferId) return;
    
    console.log('Pre-calculating job scores for active job:', activeJobOfferId);
    // Cette fonction pourrait être étendue pour pré-calculer en arrière-plan
    // Pour l'instant, elle sert de placeholder pour l'interface
  }, [activeJobOfferId]);
  
  /**
   * Recalculer tous les scores (forcer le recalcul)
   */
  const recalculateAllScores = useCallback(async () => {
    setIsRecalculating(true);
    try {
      console.log('Force recalculating all scores');
      
      // Invalider tous les caches
      invalidateScores();
      
      // Attendre un peu pour que l'UI se mette à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('All scores have been invalidated and will be recalculated on next access');
      
    } catch (error) {
      console.error('Error during recalculation:', error);
    } finally {
      setIsRecalculating(false);
    }
  }, [invalidateScores]);
  
  /**
   * Nettoyer les anciens scores en cache
   */
  useEffect(() => {
    const cleanupOldScores = () => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      setScoringState(prev => {
        const cleaned = { ...prev };
        Object.keys(cleaned).forEach(candidateId => {
          if (now - cleaned[candidateId].lastUpdated > maxAge) {
            delete cleaned[candidateId];
          }
        });
        return cleaned;
      });
    };
    
    const interval = setInterval(cleanupOldScores, 5 * 60 * 1000); // Nettoyer toutes les 5 minutes
    return () => clearInterval(interval);
  }, []);
  
  return {
    getCachedScore,
    isScoreLoading,
    calculateContextualScore,
    invalidateScores,
    preCalculateJobScores,
    recalculateAllScores,
    isRecalculating,
    isJobSpecific
  };
};
