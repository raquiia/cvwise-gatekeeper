
/**
 * Hook pour le matching intelligent avec gestion d'état optimisée
 */

import { useState, useCallback, useRef } from 'react';
import { intelligentMatchingEngine, type IntelligentMatchResult, type BatchMatchingOptions } from '@/services/matching/intelligentMatchingEngine';
import { CandidateData } from '@/services/data/candidateService';
import { JobOffer } from '@/services/data/job-offers/types';
import { toast } from '@/hooks/use-toast';

interface MatchingState {
  results: Map<string, IntelligentMatchResult>;
  isLoading: boolean;
  progress: number;
  currentMessage: string;
  metrics: any;
  error: string | null;
}

export const useIntelligentMatching = () => {
  const [state, setState] = useState<MatchingState>({
    results: new Map(),
    isLoading: false,
    progress: 0,
    currentMessage: '',
    metrics: null,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Matching d'un candidat unique
   */
  const matchSingleCandidate = useCallback(async (
    candidate: CandidateData,
    jobOffer: JobOffer,
    options: { useCache?: boolean; forceRecalculation?: boolean } = {}
  ): Promise<IntelligentMatchResult | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await intelligentMatchingEngine.matchCandidate(candidate, jobOffer, options);
      
      setState(prev => ({
        ...prev,
        results: new Map(prev.results).set(candidate.id!, result),
        isLoading: false,
        metrics: intelligentMatchingEngine.getMetrics()
      }));

      return result;

    } catch (error: any) {
      console.error('Erreur lors du matching intelligent:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));

      toast({
        title: "Erreur de matching",
        description: error.message,
        variant: "destructive"
      });

      return null;
    }
  }, []);

  /**
   * Matching en batch avec suivi de progression
   */
  const matchCandidatesBatch = useCallback(async (
    candidates: CandidateData[],
    jobOffer: JobOffer,
    options: BatchMatchingOptions = {}
  ): Promise<Map<string, IntelligentMatchResult>> => {
    // Annuler toute opération en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        progress: 0,
        currentMessage: 'Initialisation du matching intelligent...',
        error: null,
        results: new Map()
      }));

      const progressCallback = (progress: number, message: string) => {
        setState(prev => ({
          ...prev,
          progress: Math.round(progress),
          currentMessage: message
        }));
      };

      const results = await intelligentMatchingEngine.batchMatch(
        candidates,
        jobOffer,
        { ...options, progressCallback }
      );

      setState(prev => ({
        ...prev,
        results,
        isLoading: false,
        progress: 100,
        currentMessage: 'Matching terminé avec succès',
        metrics: intelligentMatchingEngine.getMetrics()
      }));

      toast({
        title: "Matching terminé",
        description: `${results.size} candidats analysés avec le nouveau moteur intelligent`,
      });

      return results;

    } catch (error: any) {
      console.error('Erreur lors du batch matching:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        currentMessage: 'Erreur lors du matching'
      }));

      toast({
        title: "Erreur de matching",
        description: error.message,
        variant: "destructive"
      });

      return new Map();
    }
  }, []);

  /**
   * Obtenir le résultat pour un candidat
   */
  const getMatchResult = useCallback((candidateId: string): IntelligentMatchResult | null => {
    return state.results.get(candidateId) || null;
  }, [state.results]);

  /**
   * Vérifier si un candidat est en cache
   */
  const isInCache = useCallback((candidateId: string): boolean => {
    const result = state.results.get(candidateId);
    return result?.cacheHit || false;
  }, [state.results]);

  /**
   * Filtrer les résultats selon des critères
   */
  const filterResults = useCallback((
    minScore?: number,
    minConfidence?: number,
    jobType?: string
  ): IntelligentMatchResult[] => {
    return Array.from(state.results.values()).filter(result => {
      if (minScore && result.overallScore < minScore) return false;
      if (minConfidence && result.confidence < minConfidence) return false;
      if (jobType && result.contextualFactors.jobType !== jobType) return false;
      return true;
    });
  }, [state.results]);

  /**
   * Trier les résultats
   */
  const sortResults = useCallback((
    sortBy: 'score' | 'confidence' | 'adaptability' = 'score',
    ascending = false
  ): IntelligentMatchResult[] => {
    const results = Array.from(state.results.values());
    
    return results.sort((a, b) => {
      let valueA: number, valueB: number;
      
      switch (sortBy) {
        case 'confidence':
          valueA = a.confidence;
          valueB = b.confidence;
          break;
        case 'adaptability':
          valueA = a.breakdown.adaptabilityScore;
          valueB = b.breakdown.adaptabilityScore;
          break;
        default:
          valueA = a.overallScore;
          valueB = b.overallScore;
      }
      
      return ascending ? valueA - valueB : valueB - valueA;
    });
  }, [state.results]);

  /**
   * Annuler l'opération en cours
   */
  const cancelMatching = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentMessage: 'Matching annulé'
      }));
    }
  }, []);

  /**
   * Nettoyer les résultats
   */
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: new Map(),
      error: null,
      progress: 0,
      currentMessage: ''
    }));
  }, []);

  /**
   * Optimiser le cache
   */
  const optimizeCache = useCallback(async () => {
    try {
      await intelligentMatchingEngine.optimizeCache();
      setState(prev => ({
        ...prev,
        metrics: intelligentMatchingEngine.getMetrics()
      }));
      
      toast({
        title: "Cache optimisé",
        description: "Les performances ont été optimisées",
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'optimisation",
        description: error.message,
        variant: "destructive"
      });
    }
  }, []);

  return {
    // État
    results: state.results,
    isLoading: state.isLoading,
    progress: state.progress,
    currentMessage: state.currentMessage,
    metrics: state.metrics,
    error: state.error,
    
    // Actions
    matchSingleCandidate,
    matchCandidatesBatch,
    getMatchResult,
    isInCache,
    filterResults,
    sortResults,
    cancelMatching,
    clearResults,
    optimizeCache,
    
    // Statistiques
    totalResults: state.results.size,
    hasResults: state.results.size > 0
  };
};
