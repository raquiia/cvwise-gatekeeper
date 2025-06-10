
/**
 * Hook optimisé pour le scoring temps réel avec feedback utilisateur
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CandidateData } from '@/services/data/candidateService';
import { JobOffer } from '@/services/data/job-offers/types';
import { adaptiveMatchingService, AdaptiveMatchResult } from '@/services/data/candidate-matching/adaptiveMatchingService';
import { intelligentCache, aiScoreCache } from '@/services/cache/intelligentCacheService';
import { useToast } from '@/hooks/use-toast';

interface ScoringProgress {
  stage: 'initializing' | 'analyzing' | 'calculating' | 'optimizing' | 'completed' | 'error';
  progress: number;
  message: string;
  estimatedTime?: number;
}

interface RealtimeScoringState {
  score: AdaptiveMatchResult | null;
  isLoading: boolean;
  progress: ScoringProgress;
  error: string | null;
  cacheHit: boolean;
  optimizations: string[];
}

export const useRealtimeScoring = () => {
  const [state, setState] = useState<RealtimeScoringState>({
    score: null,
    isLoading: false,
    progress: { stage: 'initializing', progress: 0, message: 'Préparation...' },
    error: null,
    cacheHit: false,
    optimizations: []
  });

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Simulation du feedback de progression réaliste
   */
  const simulateProgress = useCallback((
    stage: ScoringProgress['stage'],
    message: string,
    duration: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const startProgress = state.progress.progress;
      const targetProgress = Math.min(95, startProgress + (stage === 'completed' ? 100 - startProgress : 20));

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(1, elapsed / duration);
        const currentProgress = startProgress + (targetProgress - startProgress) * progressRatio;

        setState(prev => ({
          ...prev,
          progress: {
            stage,
            progress: Math.round(currentProgress),
            message,
            estimatedTime: duration - elapsed
          }
        }));

        if (progressRatio < 1) {
          progressTimeoutRef.current = setTimeout(updateProgress, 100);
        } else {
          resolve();
        }
      };

      updateProgress();
    });
  }, [state.progress.progress]);

  /**
   * Calcul de score optimisé avec cache et feedback
   */
  const calculateScore = useCallback(async (
    candidate: CandidateData,
    jobOffer?: JobOffer
  ): Promise<AdaptiveMatchResult | null> => {
    
    // Annuler le calcul précédent si en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const optimizations: string[] = [];

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        cacheHit: false,
        optimizations: []
      }));

      // Étape 1: Vérification du cache
      await simulateProgress('analyzing', 'Vérification du cache...', 500);
      
      const cacheKey = ['realtime_score', candidate.id, jobOffer?.id || 'general'];
      const cachedScore = intelligentCache.get<AdaptiveMatchResult>(cacheKey);
      
      if (cachedScore && !abortControllerRef.current.signal.aborted) {
        optimizations.push('Score récupéré du cache');
        
        setState(prev => ({
          ...prev,
          score: cachedScore,
          isLoading: false,
          cacheHit: true,
          optimizations,
          progress: { stage: 'completed', progress: 100, message: 'Terminé (cache)' }
        }));

        toast({
          title: "Score récupéré",
          description: "Score trouvé en cache, affichage instantané",
        });

        return cachedScore;
      }

      // Étape 2: Analyse des données
      await simulateProgress('calculating', 'Analyse des compétences...', 1000);
      
      if (abortControllerRef.current.signal.aborted) return null;

      // Étape 3: Calcul adaptatif
      await simulateProgress('optimizing', 'Optimisation du matching...', 800);
      
      if (abortControllerRef.current.signal.aborted) return null;

      let result: AdaptiveMatchResult;

      if (jobOffer) {
        // Score de correspondance job-spécifique
        result = await adaptiveMatchingService.calculateAdaptiveMatch(candidate, jobOffer);
        optimizations.push('Matching adaptatif appliqué');
      } else {
        // Score de complétude général (fallback simplifié)
        result = {
          score: calculateBasicCompletenessScore(candidate),
          confidence: 75,
          context: {
            jobType: 'general',
            seniorityLevel: 'mid',
            industry: 'general',
            urgency: 'medium',
            remote: false
          },
          adaptations: ['Score de complétude général'],
          penalties: [],
          bonuses: [],
          recommendations: []
        };
        optimizations.push('Score de complétude calculé');
      }

      if (abortControllerRef.current.signal.aborted) return null;

      // Étape 4: Mise en cache et finalisation
      await simulateProgress('completed', 'Finalisation...', 300);
      
      // Mise en cache intelligente
      const ttl = result.confidence > 80 ? 1000 * 60 * 60 : 1000 * 60 * 30; // 1h si confiance élevée, 30min sinon
      intelligentCache.set(cacheKey, result, ttl);
      optimizations.push('Résultat mis en cache');

      setState(prev => ({
        ...prev,
        score: result,
        isLoading: false,
        optimizations,
        progress: { stage: 'completed', progress: 100, message: 'Terminé' }
      }));

      // Toast de succès avec détails
      toast({
        title: `Score calculé: ${result.score}/100`,
        description: `Confiance: ${result.confidence}% | ${optimizations.length} optimisations`,
      });

      return result;

    } catch (error: any) {
      if (abortControllerRef.current.signal.aborted) return null;
      
      console.error('Erreur lors du calcul de score:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors du calcul',
        progress: { stage: 'error', progress: 0, message: 'Erreur survenue' }
      }));

      toast({
        title: "Erreur de calcul",
        description: error.message || 'Une erreur est survenue lors du calcul du score',
        variant: "destructive",
      });

      return null;
    }
  }, [simulateProgress, toast]);

  /**
   * Calcul de score de complétude basique (fallback)
   */
  const calculateBasicCompletenessScore = (candidate: CandidateData): number => {
    let score = 0;
    const weights = {
      skills: 25,
      experience: 20,
      education: 20,
      contact: 15,
      location: 10,
      objectives: 10
    };

    // Compétences
    const skillsCount = Array.isArray(candidate.skills) ? candidate.skills.length : 0;
    score += Math.min(weights.skills, skillsCount * 3);

    // Expérience
    if (candidate.years_experience && candidate.years_experience > 0) {
      score += weights.experience;
    }

    // Formation
    if (candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0) {
      score += weights.education;
    }

    // Contact
    if (candidate.email && candidate.phone) {
      score += weights.contact;
    }

    // Localisation
    if (candidate.location) {
      score += weights.location;
    }

    // Objectifs
    if (candidate.career_objectives) {
      score += weights.objectives;
    }

    return Math.min(100, score);
  };

  /**
   * Batch scoring pour plusieurs candidats
   */
  const calculateBatchScores = useCallback(async (
    candidates: CandidateData[],
    jobOffer?: JobOffer
  ): Promise<Map<string, AdaptiveMatchResult>> => {
    const results = new Map<string, AdaptiveMatchResult>();
    const batchSize = 5; // Traitement par batches pour éviter la surcharge
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      progress: { stage: 'analyzing', progress: 0, message: `Traitement de ${candidates.length} candidats...` }
    }));

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      
      // Traitement parallèle du batch
      const batchPromises = batch.map(async (candidate) => {
        const result = await calculateScore(candidate, jobOffer);
        if (result && candidate.id) {
          results.set(candidate.id, result);
        }
      });

      await Promise.all(batchPromises);
      
      // Mise à jour du progrès
      const progress = Math.round(((i + batchSize) / candidates.length) * 100);
      setState(prev => ({
        ...prev,
        progress: { 
          stage: 'calculating', 
          progress, 
          message: `Traité ${Math.min(i + batchSize, candidates.length)}/${candidates.length} candidats` 
        }
      }));
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: { stage: 'completed', progress: 100, message: 'Batch terminé' }
    }));

    toast({
      title: "Batch scoring terminé",
      description: `${results.size} scores calculés avec succès`,
    });

    return results;
  }, [calculateScore, toast]);

  /**
   * Nettoyage lors du démontage
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Invalidation du cache pour un candidat
   */
  const invalidateCache = useCallback((candidateId: string, jobOfferId?: string) => {
    const pattern = `.*${candidateId}.*${jobOfferId || ''}.*`;
    const invalidated = intelligentCache.invalidatePattern(pattern);
    
    toast({
      title: "Cache invalidé",
      description: `${invalidated} entrées supprimées du cache`,
    });
  }, [toast]);

  /**
   * Statistiques du cache
   */
  const getCacheStats = useCallback(() => {
    return intelligentCache.getStats();
  }, []);

  return {
    ...state,
    calculateScore,
    calculateBatchScores,
    invalidateCache,
    getCacheStats,
    isCalculating: state.isLoading
  };
};
