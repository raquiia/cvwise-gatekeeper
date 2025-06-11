
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
  isJobSpecific: boolean;
  isLoading: boolean;
  error: string | null;
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
          isJobSpecific: !!jobOfferId,
          isLoading: true,
          error: null
        }
      }));

      fetchAIScore(candidateId, jobOfferId, key);
    }

    return scores[key] || {
      score: null,
      explanation: '',
      breakdown: undefined,
      isJobSpecific: !!jobOfferId,
      isLoading: true,
      error: null
    };
  };

  const fetchAIScore = async (candidateId: string, jobOfferId: string | undefined, key: string) => {
    try {
      console.log(`🔍 [useAIScoring] Fetching AI score for candidate ${candidateId}, jobOffer: ${jobOfferId || 'general'}`);
      
      const { data, error } = await supabase.rpc('get_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId || null
      });

      if (error) {
        console.error('❌ [useAIScoring] Error fetching AI score:', error);
        throw error;
      }

      console.log(`📊 [useAIScoring] AI score data received:`, data);

      if (data && data.length > 0) {
        const scoreData = data[0];
        console.log(`✅ [useAIScoring] Found AI score: ${scoreData.score}/100 with explanation length: ${scoreData.explanation?.length || 0}`);
        
        setScores(prev => ({
          ...prev,
          [key]: {
            score: scoreData.score,
            explanation: scoreData.explanation || '',
            breakdown: scoreData.breakdown || {},
            isJobSpecific: !!jobOfferId,
            isLoading: false,
            error: null
          }
        }));
      } else {
        console.log(`ℹ️ [useAIScoring] No AI score found for candidate ${candidateId}`);
        setScores(prev => ({
          ...prev,
          [key]: {
            score: null,
            explanation: '',
            breakdown: undefined,
            isJobSpecific: !!jobOfferId,
            isLoading: false,
            error: null
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
          isJobSpecific: !!jobOfferId,
          isLoading: false,
          error: error.message
        }
      }));
    } finally {
      loadingRef.current.delete(key);
    }
  };

  const saveAIScore = async (
    candidateId: string,
    score: number,
    explanation: string,
    breakdown: any,
    jobOfferId?: string
  ): Promise<boolean> => {
    try {
      console.log(`💾 [useAIScoring] Saving AI score ${score}/100 for candidate ${candidateId}`);
      
      const { data, error } = await supabase.rpc('save_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_score: score,
        p_explanation: explanation,
        p_breakdown: breakdown,
        p_job_offer_id: jobOfferId || null
      });

      if (error) {
        console.error('❌ [useAIScoring] Error saving AI score:', error);
        return false;
      }

      console.log(`✅ [useAIScoring] AI score saved successfully`);

      // Mettre à jour le cache
      const key = `${candidateId}_${jobOfferId || 'general'}`;
      setScores(prev => ({
        ...prev,
        [key]: {
          score,
          explanation,
          breakdown,
          isJobSpecific: !!jobOfferId,
          isLoading: false,
          error: null
        }
      }));

      return true;
    } catch (error: any) {
      console.error(`❌ [useAIScoring] Error saving AI score:`, error);
      return false;
    }
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

  return {
    getAIScore,
    saveAIScore,
    clearCache
  };
};
