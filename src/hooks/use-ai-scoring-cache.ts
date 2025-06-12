
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveJob } from '@/context/ActiveJobContext';
import { AIScoringBreakdown } from '@/services/data/ai-scoring/types';

interface CachedScore {
  score: number | null;
  explanation: string;
  breakdown: AIScoringBreakdown | null;
  source: string | null;
  isJobSpecific: boolean;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
  loadingPromise?: Promise<void>;
}

const scoreCache = new Map<string, CachedScore>();
const pendingRequests = new Map<string, Promise<void>>();

export const useAIScoringCache = () => {
  const [, forceUpdate] = useState(0);
  const { activeJobOfferId } = useActiveJob();
  const isJobSpecific = Boolean(activeJobOfferId);
  
  const parseBreakdown = useCallback((breakdown: any): AIScoringBreakdown => {
    if (!breakdown || typeof breakdown !== 'object') {
      return {
        skills: 0,
        experience: 0,
        education: 0,
        cvStructure: 0,
        profileSummary: 0
      };
    }
    
    return {
      skills: breakdown.skills || 0,
      experience: breakdown.experience || 0,
      education: breakdown.education || 0,
      cvStructure: breakdown.cvStructure || 0,
      profileSummary: breakdown.profileSummary || 0,
      location: breakdown.location,
      cultural: breakdown.cultural,
      languages: breakdown.languages,
      ...breakdown
    };
  }, []);

  const getCacheKey = useCallback((candidateId: string): string => {
    return `${candidateId}_${activeJobOfferId || 'general'}`;
  }, [activeJobOfferId]);

  const loadScoreFromDatabase = useCallback(async (candidateId: string): Promise<void> => {
    const cacheKey = getCacheKey(candidateId);
    
    // Si une requête est déjà en cours, l'attendre
    if (pendingRequests.has(cacheKey)) {
      await pendingRequests.get(cacheKey);
      return;
    }

    try {
      console.log(`[AI Scoring Cache] Loading score for candidate: ${candidateId}`);
      
      const loadPromise = (async () => {
        // Récupérer directement depuis la table candidates
        const { data: candidateData, error } = await supabase
          .from('candidates')
          .select('ai_score, ai_explanation, ai_breakdown, ai_analyzed_at')
          .eq('id', candidateId)
          .single();
        
        if (error) {
          throw error;
        }
        
        const cachedScore: CachedScore = {
          score: candidateData?.ai_score || null,
          explanation: candidateData?.ai_explanation || '',
          breakdown: candidateData ? parseBreakdown(candidateData.ai_breakdown) : null,
          source: candidateData ? 'database' : null,
          isJobSpecific: false, // Les données AI dans candidates ne sont pas job-specific pour l'instant
          lastUpdated: Date.now(),
          isLoading: false,
          error: null
        };
        
        scoreCache.set(cacheKey, cachedScore);
        console.log(`[AI Scoring Cache] Score loaded for candidate: ${candidateId}`, cachedScore.score);
      })();
      
      pendingRequests.set(cacheKey, loadPromise);
      await loadPromise;
      
    } catch (error: any) {
      console.error(`[AI Scoring Cache] Error loading score for candidate ${candidateId}:`, error);
      
      const errorScore: CachedScore = {
        score: null,
        explanation: '',
        breakdown: null,
        source: null,
        isJobSpecific: isJobSpecific,
        lastUpdated: Date.now(),
        isLoading: false,
        error: error.message
      };
      
      scoreCache.set(cacheKey, errorScore);
    } finally {
      pendingRequests.delete(cacheKey);
      forceUpdate(prev => prev + 1);
    }
  }, [getCacheKey, isJobSpecific, parseBreakdown]);

  const getScore = useCallback((candidateId: string): CachedScore => {
    if (!candidateId) {
      return {
        score: null,
        explanation: '',
        breakdown: null,
        source: null,
        isJobSpecific: isJobSpecific,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null
      };
    }

    const cacheKey = getCacheKey(candidateId);
    let cached = scoreCache.get(cacheKey);
    
    // Si pas en cache ou expiré (plus de 5 minutes), charger depuis la DB
    const shouldLoad = !cached || 
      (!cached.isLoading && !cached.loadingPromise && Date.now() - cached.lastUpdated > 5 * 60 * 1000);
    
    if (shouldLoad) {
      // Marquer comme en chargement pour éviter les appels multiples
      if (!cached) {
        cached = {
          score: null,
          explanation: '',
          breakdown: null,
          source: null,
          isJobSpecific: isJobSpecific,
          lastUpdated: Date.now(),
          isLoading: true,
          error: null
        };
        scoreCache.set(cacheKey, cached);
      } else if (!cached.isLoading) {
        cached.isLoading = true;
        scoreCache.set(cacheKey, cached);
      }
      
      // Charger de manière asynchrone
      if (!pendingRequests.has(cacheKey)) {
        loadScoreFromDatabase(candidateId);
      }
    }
    
    return cached || {
      score: null,
      explanation: '',
      breakdown: null,
      source: null,
      isJobSpecific: isJobSpecific,
      lastUpdated: Date.now(),
      isLoading: false,
      error: null
    };
  }, [getCacheKey, isJobSpecific, loadScoreFromDatabase]);

  const preloadScores = useCallback(async (candidateIds: string[]) => {
    console.log(`[AI Scoring Cache] Preloading scores for ${candidateIds.length} candidates`);
    
    const promises = candidateIds.map(async (candidateId) => {
      const cacheKey = getCacheKey(candidateId);
      const cached = scoreCache.get(cacheKey);
      
      // Ne charger que si pas déjà en cache ou en cours de chargement
      if (!cached || (!cached.isLoading && Date.now() - cached.lastUpdated > 5 * 60 * 1000)) {
        await loadScoreFromDatabase(candidateId);
      }
    });
    
    await Promise.all(promises);
    
    // Retourner les résultats
    const results: Record<string, CachedScore> = {};
    candidateIds.forEach(candidateId => {
      const cacheKey = getCacheKey(candidateId);
      const cached = scoreCache.get(cacheKey);
      if (cached) {
        results[candidateId] = cached;
      }
    });
    
    return results;
  }, [getCacheKey, loadScoreFromDatabase]);

  const clearCache = useCallback((candidateId?: string) => {
    if (candidateId) {
      const cacheKey = getCacheKey(candidateId);
      scoreCache.delete(cacheKey);
      pendingRequests.delete(cacheKey);
    } else {
      scoreCache.clear();
      pendingRequests.clear();
    }
    forceUpdate(prev => prev + 1);
  }, [getCacheKey]);

  return {
    getScore,
    preloadScores,
    clearCache,
    isJobSpecific
  };
};
