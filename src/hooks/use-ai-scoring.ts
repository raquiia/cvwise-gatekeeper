
import { useState, useEffect, useRef } from 'react';
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
  source?: 'database' | 'fresh_calculation' | 'cache';
}

export const useAIScoring = () => {
  const [scores, setScores] = useState<Record<string, AIScoreData>>({});
  const loadingRef = useRef<Set<string>>(new Set());

  const getAIScore = (candidateId: string, jobOfferId?: string): AIScoreData => {
    const key = `${candidateId}_${jobOfferId || 'general'}`;
    
    // Retourner le score depuis le cache ou initialiser
    const cachedScore = scores[key];
    if (cachedScore) {
      return cachedScore;
    }

    // Initialiser et charger si pas déjà en cours
    if (!loadingRef.current.has(key)) {
      loadingRef.current.add(key);
      
      setScores(prev => ({
        ...prev,
        [key]: {
          score: null,
          explanation: '',
          breakdown: undefined,
          strengths: undefined,
          weaknesses: undefined,
          recommendations: undefined,
          isJobSpecific: !!jobOfferId,
          isLoading: true,
          error: null,
          source: undefined
        }
      }));

      // Démarrer le chargement immédiatement
      fetchAIScore(candidateId, jobOfferId, key);
    }

    return scores[key] || {
      score: null,
      explanation: '',
      breakdown: undefined,
      strengths: undefined,
      weaknesses: undefined,
      recommendations: undefined,
      isJobSpecific: !!jobOfferId,
      isLoading: true,
      error: null,
      source: undefined
    };
  };

  const fetchAIScore = async (candidateId: string, jobOfferId: string | undefined, key: string) => {
    try {
      console.log(`🔍 [useAIScoring] Fetching comprehensive AI score for candidate ${candidateId}, jobOffer: ${jobOfferId || 'general'}`);
      
      // Appeler la fonction RPC mise à jour qui retourne TOUS les champs
      const { data, error } = await supabase.rpc('get_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId || null
      });

      if (error) {
        console.error('❌ [useAIScoring] Error fetching AI score:', error);
        throw error;
      }

      console.log(`📊 [useAIScoring] Raw comprehensive AI score data received:`, data);

      if (data && data.length > 0) {
        const scoreData = data[0];
        console.log(`✅ [useAIScoring] Found comprehensive AI score: ${scoreData.score}/100 with full analysis`, {
          explanation: scoreData.explanation?.length || 0,
          strengths: Array.isArray(scoreData.strengths) ? scoreData.strengths.length : 0,
          weaknesses: Array.isArray(scoreData.weaknesses) ? scoreData.weaknesses.length : 0,
          recommendations: Array.isArray(scoreData.recommendations) ? scoreData.recommendations.length : 0
        });
        
        // Parse breakdown safely
        let breakdown = {};
        if (scoreData.breakdown) {
          try {
            breakdown = typeof scoreData.breakdown === 'string' 
              ? JSON.parse(scoreData.breakdown) 
              : scoreData.breakdown;
          } catch (e) {
            console.warn('❌ [useAIScoring] Failed to parse breakdown:', e);
            breakdown = {};
          }
        }

        // Parse arrays safely - ensure we have proper arrays
        let strengths: string[] = [];
        let weaknesses: string[] = [];
        let recommendations: string[] = [];

        try {
          // Handle strengths - ensure it's an array
          if (scoreData.strengths) {
            if (Array.isArray(scoreData.strengths)) {
              strengths = scoreData.strengths;
            } else if (typeof scoreData.strengths === 'string') {
              strengths = JSON.parse(scoreData.strengths);
            }
          }

          // Handle weaknesses - ensure it's an array
          if (scoreData.weaknesses) {
            if (Array.isArray(scoreData.weaknesses)) {
              weaknesses = scoreData.weaknesses;
            } else if (typeof scoreData.weaknesses === 'string') {
              weaknesses = JSON.parse(scoreData.weaknesses);
            }
          }

          // Handle recommendations - ensure it's an array
          if (scoreData.recommendations) {
            if (Array.isArray(scoreData.recommendations)) {
              recommendations = scoreData.recommendations;
            } else if (typeof scoreData.recommendations === 'string') {
              recommendations = JSON.parse(scoreData.recommendations);
            }
          }
        } catch (e) {
          console.warn('❌ [useAIScoring] Failed to parse analysis arrays:', e);
        }

        console.log(`📈 [useAIScoring] Parsed analysis data:`, {
          strengthsCount: strengths.length,
          weaknessesCount: weaknesses.length,
          recommendationsCount: recommendations.length,
          strengthsSample: strengths.slice(0, 1),
          weaknessesSample: weaknesses.slice(0, 1),
          recommendationsSample: recommendations.slice(0, 1)
        });
        
        setScores(prev => ({
          ...prev,
          [key]: {
            score: scoreData.score,
            explanation: scoreData.explanation || '',
            breakdown: breakdown,
            strengths: strengths,
            weaknesses: weaknesses,
            recommendations: recommendations,
            isJobSpecific: !!jobOfferId,
            isLoading: false,
            error: null,
            source: 'database'
          }
        }));
      } else {
        console.log(`ℹ️ [useAIScoring] No AI score found in database for candidate ${candidateId}`);
        setScores(prev => ({
          ...prev,
          [key]: {
            score: null,
            explanation: '',
            breakdown: undefined,
            strengths: undefined,
            weaknesses: undefined,
            recommendations: undefined,
            isJobSpecific: !!jobOfferId,
            isLoading: false,
            error: null,
            source: undefined
          }
        }));
      }
    } catch (error: any) {
      console.error(`❌ [useAIScoring] Error fetching AI score:`, error);
      setScores(prev => ({
        ...prev,
        [key]: {
          score: null,
          explanation: '',
          breakdown: undefined,
          strengths: undefined,
          weaknesses: undefined,
          recommendations: undefined,
          isJobSpecific: !!jobOfferId,
          isLoading: false,
          error: error.message,
          source: undefined
        }
      }));
    } finally {
      loadingRef.current.delete(key);
    }
  };

  const preloadScoresFromDatabase = async (candidateIds: string[], jobOfferId?: string) => {
    console.log(`🔄 [useAIScoring] Preloading scores for ${candidateIds.length} candidates`);
    
    // Précharger en parallèle mais sans bloquer l'interface
    candidateIds.forEach(candidateId => {
      const key = `${candidateId}_${jobOfferId || 'general'}`;
      if (!scores[key] && !loadingRef.current.has(key)) {
        getAIScore(candidateId, jobOfferId);
      }
    });
  };

  const clearCache = (candidateId?: string) => {
    if (candidateId) {
      const keysToRemove = Object.keys(scores).filter(key => key.startsWith(`${candidateId}_`));
      setScores(prev => {
        const newScores = { ...prev };
        keysToRemove.forEach(key => delete newScores[key]);
        return newScores;
      });
    } else {
      setScores({});
    }
  };

  // Force le rechargement d'un score spécifique
  const forceRefresh = (candidateId: string, jobOfferId?: string) => {
    const key = `${candidateId}_${jobOfferId || 'general'}`;
    console.log(`🔄 [useAIScoring] Force refreshing score for key: ${key}`);
    
    // Supprimer du cache et recharger
    setScores(prev => {
      const newScores = { ...prev };
      delete newScores[key];
      return newScores;
    });
    
    // Supprimer du loading ref aussi
    loadingRef.current.delete(key);
    
    // Relancer le chargement
    getAIScore(candidateId, jobOfferId);
  };

  // Propriété dérivée pour savoir si on est en mode job-specific
  const isJobSpecific = Object.values(scores).some(score => score.isJobSpecific);

  const saveAIScore = async (
    candidateId: string,
    score: number,
    explanation: string,
    breakdown: any,
    jobOfferId?: string,
    strengths?: string[],
    weaknesses?: string[],
    recommendations?: string[]
  ): Promise<boolean> => {
    try {
      console.log(`💾 [useAIScoring] Saving comprehensive AI score ${score}/100 for candidate ${candidateId}`);
      
      // Utiliser la fonction RPC mise à jour avec TOUS les nouveaux paramètres
      const { data, error } = await supabase.rpc('save_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_score: score,
        p_explanation: explanation,
        p_breakdown: breakdown,
        p_job_offer_id: jobOfferId || null,
        p_strengths: strengths || [],
        p_weaknesses: weaknesses || [],
        p_recommendations: recommendations || []
      });

      if (error) {
        console.error('❌ [useAIScoring] Error saving comprehensive AI score:', error);
        return false;
      }

      console.log(`✅ [useAIScoring] Comprehensive AI score saved successfully`);

      // Mettre à jour le cache
      const key = `${candidateId}_${jobOfferId || 'general'}`;
      setScores(prev => ({
        ...prev,
        [key]: {
          score,
          explanation,
          breakdown,
          strengths: strengths || [],
          weaknesses: weaknesses || [],
          recommendations: recommendations || [],
          isJobSpecific: !!jobOfferId,
          isLoading: false,
          error: null,
          source: 'fresh_calculation'
        }
      }));

      return true;
    } catch (error: any) {
      console.error(`❌ [useAIScoring] Error saving comprehensive AI score:`, error);
      return false;
    }
  };

  return {
    getAIScore,
    saveAIScore,
    clearCache,
    preloadScoresFromDatabase,
    forceRefresh,
    isJobSpecific
  };
};
