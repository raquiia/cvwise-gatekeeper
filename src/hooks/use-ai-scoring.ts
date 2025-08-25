
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIScoreData {
  score: number | null;
  explanation: string;
  breakdown?: {
    skills?: number;
    experience?: number;
    education?: number;
    languages?: number;
    location?: number;
    profileSummary?: number;
    cvStructure?: number;
  };
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  isJobSpecific: boolean;
  isLoading: boolean;
  error: string | null;
  source?: string;
}

interface AIScoreCache {
  [candidateId: string]: {
    data: AIScoreData;
    timestamp: number;
    version: number;
  };
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const cacheRef: { current: AIScoreCache } = { current: {} };
const loadingStatesRef: { current: Set<string> } = { current: new Set() };

// Helper function to safely convert Json arrays to string arrays
const jsonToStringArray = (json: any): string[] => {
  if (Array.isArray(json)) {
    return json.filter(item => typeof item === 'string');
  }
  return [];
};

// Helper function to safely convert Json to breakdown object
const jsonToBreakdown = (json: any): AIScoreData['breakdown'] => {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return json as AIScoreData['breakdown'];
  }
  return {};
};

export const useAIScoring = () => {
  const [, forceUpdate] = useState({});
  const subscribersRef = useRef<Set<() => void>>(new Set());

  const triggerUpdate = useCallback(() => {
    const update = {};
    forceUpdate(update);
    subscribersRef.current.forEach(callback => callback());
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  const fetchAIScore = useCallback(async (candidateId: string, jobOfferId?: string): Promise<AIScoreData> => {
    const cacheKey = `${candidateId}-${jobOfferId || 'general'}`;
    
    if (loadingStatesRef.current.has(cacheKey)) {
      return cacheRef.current[cacheKey]?.data || {
        score: null,
        explanation: '',
        isJobSpecific: !!jobOfferId,
        isLoading: true,
        error: null
      };
    }

    loadingStatesRef.current.add(cacheKey);

    try {
      console.log(`🔍 [useAIScoring] Fetching AI score for candidate ${candidateId}${jobOfferId ? ` and job ${jobOfferId}` : ' (general)'}`);

      // Récupérer directement depuis la table candidates
      const { data: candidateData, error } = await supabase
        .from('candidates')
        .select('ai_score, ai_explanation, ai_breakdown, ai_strengths, ai_weaknesses, ai_recommendations, ai_analyzed_at')
        .eq('id', candidateId)
        .single();

      if (error) {
        console.error('❌ [useAIScoring] Error fetching AI score:', error);
        throw new Error(`Failed to fetch AI score: ${error.message}`);
      }

      let aiScoreData: AIScoreData;

      if (candidateData && candidateData.ai_score !== null) {
        console.log('✅ [useAIScoring] AI score found in candidates table:', {
          candidateId,
          score: candidateData.ai_score,
          hasExplanation: !!candidateData.ai_explanation,
          strengthsCount: jsonToStringArray(candidateData.ai_strengths).length,
          weaknessesCount: jsonToStringArray(candidateData.ai_weaknesses).length,
          recommendationsCount: jsonToStringArray(candidateData.ai_recommendations).length
        });

        aiScoreData = {
          score: candidateData.ai_score,
          explanation: candidateData.ai_explanation || '',
          breakdown: jsonToBreakdown(candidateData.ai_breakdown),
          strengths: jsonToStringArray(candidateData.ai_strengths),
          weaknesses: jsonToStringArray(candidateData.ai_weaknesses),
          recommendations: jsonToStringArray(candidateData.ai_recommendations),
          isJobSpecific: !!jobOfferId,
          isLoading: false,
          error: null,
          source: 'database'
        };
      } else {
        console.log('📭 [useAIScoring] No AI score found in candidates table for candidate:', candidateId);
        aiScoreData = {
          score: null,
          explanation: '',
          breakdown: {},
          strengths: [],
          weaknesses: [],
          recommendations: [],
          isJobSpecific: !!jobOfferId,
          isLoading: false,
          error: null,
          source: 'none'
        };
      }

      // Mettre à jour le cache avec un timestamp et une version
      cacheRef.current[cacheKey] = {
        data: aiScoreData,
        timestamp: Date.now(),
        version: Date.now() // Utiliser timestamp comme version
      };

      return aiScoreData;

    } catch (error: any) {
      console.error('❌ [useAIScoring] Error in fetchAIScore:', error);
      const errorData: AIScoreData = {
        score: null,
        explanation: '',
        isJobSpecific: !!jobOfferId,
        isLoading: false,
        error: error.message
      };

      cacheRef.current[cacheKey] = {
        data: errorData,
        timestamp: Date.now(),
        version: Date.now()
      };

      return errorData;
    } finally {
      loadingStatesRef.current.delete(cacheKey);
    }
  }, []);

  const getAIScore = useCallback((candidateId: string, jobOfferId?: string): AIScoreData => {
    if (!candidateId) {
      return {
        score: null,
        explanation: '',
        isJobSpecific: !!jobOfferId,
        isLoading: false,
        error: 'No candidate ID provided'
      };
    }

    const cacheKey = `${candidateId}-${jobOfferId || 'general'}`;
    const cached = cacheRef.current[cacheKey];
    const now = Date.now();

    // Si on a des données en cache et qu'elles ne sont pas expirées
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }

    // Si on est en train de charger, retourner l'état de chargement
    if (loadingStatesRef.current.has(cacheKey)) {
      return {
        score: null,
        explanation: '',
        isJobSpecific: !!jobOfferId,
        isLoading: true,
        error: null
      };
    }

    // Lancer le fetch en arrière-plan
    fetchAIScore(candidateId, jobOfferId).then(triggerUpdate);

    // Retourner les données en cache si disponibles, sinon état de chargement
    return cached?.data || {
      score: null,
      explanation: '',
      isJobSpecific: !!jobOfferId,
      isLoading: true,
      error: null
    };
  }, [fetchAIScore, triggerUpdate]);

  const forceRefresh = useCallback((candidateId: string, jobOfferId?: string) => {
    const cacheKey = candidateId ? `${candidateId}-${jobOfferId || 'general'}` : '';
    
    if (cacheKey) {
      console.log(`🔄 [useAIScoring] Force refreshing AI score for: ${cacheKey}`);
      // Supprimer du cache pour forcer un nouveau fetch
      delete cacheRef.current[cacheKey];
      // Supprimer de l'état de chargement si nécessaire
      loadingStatesRef.current.delete(cacheKey);
      
      // Relancer le fetch immédiatement
      if (candidateId) {
        fetchAIScore(candidateId, jobOfferId).then(triggerUpdate);
      }
    } else {
      console.log('🔄 [useAIScoring] Force refreshing all AI scores (clearing entire cache)');
      // Vider tout le cache
      cacheRef.current = {};
      loadingStatesRef.current.clear();
      triggerUpdate();
    }
  }, [fetchAIScore, triggerUpdate]);

  const clearCache = useCallback(() => {
    console.log('🗑️ [useAIScoring] Clearing all AI score cache');
    cacheRef.current = {};
    loadingStatesRef.current.clear();
    triggerUpdate();
  }, [triggerUpdate]);

  // Preload AI score when component mounts
  const preloadAIScore = useCallback((candidateId: string, jobOfferId?: string) => {
    if (candidateId) {
      const cacheKey = `${candidateId}-${jobOfferId || 'general'}`;
      const cached = cacheRef.current[cacheKey];
      const now = Date.now();

      // Only preload if not in cache or expired
      if (!cached || (now - cached.timestamp) >= CACHE_DURATION) {
        fetchAIScore(candidateId, jobOfferId).then(triggerUpdate);
      }
    }
  }, [fetchAIScore, triggerUpdate]);

  // Preload multiple scores from database - alias for compatibility
  const preloadScoresFromDatabase = useCallback((candidateIds: string[], jobOfferId?: string) => {
    candidateIds.forEach(candidateId => {
      preloadAIScore(candidateId, jobOfferId);
    });
  }, [preloadAIScore]);

  // Check if current context is job-specific
  const isJobSpecific = useCallback((jobOfferId?: string) => {
    return !!jobOfferId;
  }, []);

  return {
    getAIScore,
    forceRefresh,
    clearCache,
    preloadAIScore,
    preloadScoresFromDatabase,
    isJobSpecific,
    subscribe
  };
};
