
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveJob } from '@/context/ActiveJobContext';
import { AIScoringBreakdown } from '@/services/data/ai-scoring/types';

interface AIScoringState {
  [candidateId: string]: {
    score: number | null;
    isLoading: boolean;
    error: string | null;
    explanation: string;
    source: string | null;
    breakdown: AIScoringBreakdown | null;
    isJobSpecific: boolean;
    lastUpdated: number;
  };
}

export const useAIScoring = () => {
  const [state, setState] = useState<AIScoringState>({});
  const { activeJobOfferId } = useActiveJob();

  // Vérifie si on est en mode job-spécifique
  const isJobSpecific = Boolean(activeJobOfferId);

  // Convertit un objet Json en AIScoringBreakdown
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

  // Préchargement des scores depuis la base de données UNIQUEMENT
  const preloadScoresFromDatabase = useCallback(async (candidateIds: string[]) => {
    if (!candidateIds.length) return {};
    const results: AIScoringState = {};

    try {
      console.log(`[AI Scoring] Loading scores from database for ${candidateIds.length} candidates...`);
      
      for (const candidateId of candidateIds) {
        // Marquer comme en chargement
        setState(prev => ({
          ...prev,
          [candidateId]: {
            ...prev[candidateId],
            score: null,
            isLoading: true,
            error: null,
            explanation: '',
            source: null,
            breakdown: null,
            isJobSpecific: isJobSpecific,
            lastUpdated: Date.now()
          }
        }));
        
        try {
          // Récupérer le score depuis la base de données
          const { data: scoreData, error } = await supabase.rpc(
            'get_ai_candidate_score',
            { 
              p_candidate_id: candidateId,
              p_job_offer_id: activeJobOfferId || null
            }
          );
          
          if (error) {
            console.error('[AI Scoring] Database error:', error);
            const errorState = {
              score: null,
              isLoading: false,
              error: `Erreur base de données: ${error.message}`,
              explanation: '',
              source: null,
              breakdown: null,
              isJobSpecific: isJobSpecific,
              lastUpdated: Date.now()
            };
            setState(prev => ({
              ...prev,
              [candidateId]: errorState
            }));
            results[candidateId] = errorState;
            continue;
          }
          
          // Handle array response from RPC function
          const scoreRecord = Array.isArray(scoreData) ? scoreData[0] : scoreData;
          
          if (scoreRecord) {
            console.log(`[AI Scoring] Found score in database for candidate ${candidateId}:`, scoreRecord.score);
            const stateUpdate = {
              score: scoreRecord.score,
              isLoading: false,
              error: null,
              explanation: scoreRecord.explanation || '',
              source: 'database',
              breakdown: parseBreakdown(scoreRecord.breakdown),
              isJobSpecific: Boolean(scoreRecord.job_offer_id),
              lastUpdated: Date.now()
            };
            setState(prev => ({
              ...prev,
              [candidateId]: stateUpdate
            }));
            results[candidateId] = stateUpdate;
          } else {
            console.log(`[AI Scoring] No score found in database for candidate ${candidateId} - score will be calculated during CV analysis`);
            const stateUpdate = {
              score: null,
              isLoading: false,
              error: null,
              explanation: 'Score sera calculé lors de l\'analyse du CV',
              source: null,
              breakdown: null,
              isJobSpecific: isJobSpecific,
              lastUpdated: Date.now()
            };
            setState(prev => ({
              ...prev,
              [candidateId]: stateUpdate
            }));
            results[candidateId] = stateUpdate;
          }
        } catch (candidateError: any) {
          console.error(`[AI Scoring] Error processing candidate ${candidateId}:`, candidateError);
          const errorState = {
            score: null,
            isLoading: false,
            error: `Erreur traitement: ${candidateError.message}`,
            explanation: '',
            source: null,
            breakdown: null,
            isJobSpecific: isJobSpecific,
            lastUpdated: Date.now()
          };
          setState(prev => ({
            ...prev,
            [candidateId]: errorState
          }));
          results[candidateId] = errorState;
        }
      }
      return results;
    } catch (err: any) {
      console.error('[AI Scoring] Error in preloadScoresFromDatabase:', err);
      return {};
    }
  }, [activeJobOfferId, isJobSpecific, parseBreakdown]);

  // Récupérer le score AI pour un candidat (lecture seule depuis la BDD)
  const getAIScore = useCallback((candidateId: string) => {
    const defaultState = {
      score: null,
      isLoading: false,
      error: null,
      explanation: '',
      source: null,
      breakdown: null,
      isJobSpecific: isJobSpecific,
      lastUpdated: Date.now()
    };

    if (!candidateId) return defaultState;

    return state[candidateId] || defaultState;
  }, [state, isJobSpecific]);

  return {
    getAIScore,
    preloadScoresFromDatabase,
    isJobSpecific
  };
};
