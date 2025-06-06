import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveJob } from '@/context/ActiveJobContext';
import { toast } from '@/hooks/use-toast';
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
  const [isGlobalRecalculating, setIsGlobalRecalculating] = useState(false);
  const { activeJobOfferId } = useActiveJob();

  // Vérifie si on est en mode job-spécifique
  const isJobSpecific = Boolean(activeJobOfferId);

  // Préchargement des scores depuis la base de données
  const preloadScoresFromDatabase = useCallback(async (candidateIds: string[]) => {
    if (!candidateIds.length) return {};
    const results: AIScoringState = {};

    try {
      console.log(`Preloading AI scores for ${candidateIds.length} candidates...`);
      
      for (const candidateId of candidateIds) {
        // Marquer comme en chargement
        setState(prev => ({
          ...prev,
          [candidateId]: {
            ...prev[candidateId],
            isLoading: true
          }
        }));
        
        // Récupérer le score spécifique à l'offre d'emploi active si disponible
        const { data: scoreData, error } = await supabase.rpc(
          'get_ai_candidate_score',
          { 
            p_candidate_id: candidateId,
            p_job_offer_id: activeJobOfferId || null
          }
        );
        
        if (error) {
          console.error('Error fetching AI score:', error);
          setState(prev => ({
            ...prev,
            [candidateId]: {
              score: null,
              isLoading: false,
              error: error.message,
              explanation: '',
              source: null,
              breakdown: null,
              isJobSpecific: isJobSpecific,
              lastUpdated: Date.now()
            }
          }));
          results[candidateId] = {
            score: null,
            isLoading: false,
            error: error.message,
            explanation: '',
            source: null,
            breakdown: null,
            isJobSpecific: isJobSpecific,
            lastUpdated: Date.now()
          };
          continue;
        }
        
        // Fix: Handle array response from RPC function
        const scoreRecord = Array.isArray(scoreData) ? scoreData[0] : scoreData;
        
        if (scoreRecord) {
          console.log(`Found cached AI score for candidate ${candidateId}:`, scoreRecord);
          const stateUpdate = {
            score: scoreRecord.score,
            isLoading: false,
            error: null,
            explanation: scoreRecord.explanation || '',
            source: 'database',
            breakdown: scoreRecord.breakdown || null,
            isJobSpecific: Boolean(scoreRecord.job_offer_id),
            lastUpdated: Date.now()
          };
          setState(prev => ({
            ...prev,
            [candidateId]: stateUpdate
          }));
          results[candidateId] = stateUpdate;
        } else {
          console.log(`No cached AI score found for candidate ${candidateId}, setting null state`);
          const stateUpdate = {
            score: null,
            isLoading: false,
            error: null,
            explanation: '',
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
      }
      return results;
    } catch (err) {
      console.error('Error in preloadScoresFromDatabase:', err);
      return {};
    }
  }, [activeJobOfferId, isJobSpecific]);

  // Calculer le score AI pour un candidat
  const calculateAIScore = useCallback(async (candidateId: string) => {
    try {
      // Vérifier si un calcul est déjà en cours pour ce candidat
      if (state[candidateId]?.isLoading) {
        console.log(`Calculation already in progress for candidate ${candidateId}`);
        return;
      }
      
      // Mettre à jour l'état pour indiquer le chargement
      setState(prev => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          isLoading: true,
          error: null
        }
      }));
      
      console.log(`Requesting AI score calculation for candidate ${candidateId}${activeJobOfferId ? ` and job offer ${activeJobOfferId}` : ''}`);
      
      // Appeler la fonction Edge pour le calcul AI
      const scoringType = activeJobOfferId ? 'job_matching' : 'completeness';
      
      const res = await fetch('/api/ai-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          jobOfferId: activeJobOfferId,
          scoringType
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to calculate AI score: ${errorText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        console.log(`AI score calculation successful for ${candidateId}:`, data.score);
        setState(prev => ({
          ...prev,
          [candidateId]: {
            score: data.score,
            isLoading: false,
            error: null,
            explanation: data.explanation || '',
            source: 'fresh_calculation',
            breakdown: data.breakdown || null,
            isJobSpecific: Boolean(activeJobOfferId),
            lastUpdated: Date.now()
          }
        }));
      } else {
        throw new Error(data.error || 'Unknown error in AI scoring');
      }
    } catch (err: any) {
      console.error(`Error calculating AI score for candidate ${candidateId}:`, err);
      setState(prev => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          isLoading: false,
          error: err.message,
          source: null
        }
      }));
      
      // Afficher une notification d'erreur
      toast({
        title: "Erreur de calcul du score",
        description: `Impossible de calculer le score pour ce candidat: ${err.message}`,
        variant: "destructive"
      });
    }
  }, [activeJobOfferId, state]);

  // Obtenir le score AI d'un candidat
  const getAIScore = useCallback((candidateId: string) => {
    return (
      state[candidateId] || {
        score: null,
        isLoading: false,
        error: null,
        explanation: '',
        source: null,
        breakdown: null,
        isJobSpecific: isJobSpecific,
        lastUpdated: 0
      }
    );
  }, [state, isJobSpecific]);

  // Forcer le recalcul du score pour un candidat spécifique
  const forceReanalyzeCandidate = useCallback(async (candidateId: string) => {
    try {
      // Indiquer le chargement
      setState(prev => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          isLoading: true,
          error: null,
          source: null
        }
      }));
      
      // Suppression du score existant (si présent)
      await supabase.rpc('delete_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: activeJobOfferId || null
      });
      
      // Recalculer le score
      await calculateAIScore(candidateId);
      
      return true;
    } catch (err) {
      console.error('Error forcing reanalysis:', err);
      setState(prev => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          isLoading: false,
          error: 'Erreur lors du recalcul forcé',
          source: null
        }
      }));
      return false;
    }
  }, [activeJobOfferId, calculateAIScore]);

  // Recalculer tous les scores pour une liste de candidats
  const recalculateAllScores = useCallback(async (candidateIds: string[], onlyNew: boolean = true) => {
    if (!candidateIds.length) return;
    
    setIsGlobalRecalculating(true);
    console.log(`Recalculating scores for ${candidateIds.length} candidates, onlyNew=${onlyNew}`);
    
    try {
      // Filtrer les candidats selon le besoin (tous ou uniquement ceux sans score)
      let candidatesToProcess = [...candidateIds];
      
      if (onlyNew) {
        candidatesToProcess = candidateIds.filter(id => {
          const currentScore = state[id];
          // Traiter seulement si: pas de score, pas de score pour l'offre actuelle, ou erreur précédente
          return !currentScore || 
                 !currentScore.score || 
                 currentScore.error || 
                 (isJobSpecific && !currentScore.isJobSpecific);
        });
        
        console.log(`Filtered to ${candidatesToProcess.length} candidates needing scores`);
      }
      
      // Traiter les candidats par lots pour éviter la surcharge
      const batchSize = 3;
      for (let i = 0; i < candidatesToProcess.length; i += batchSize) {
        const batch = candidatesToProcess.slice(i, i + batchSize);
        
        // Traiter chaque lot en parallèle
        await Promise.all(batch.map(candidateId => calculateAIScore(candidateId)));
        
        // Pause entre les lots pour éviter la surcharge de l'API
        if (i + batchSize < candidatesToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      toast({
        title: "Calcul des scores terminé",
        description: `${candidatesToProcess.length} scores de candidats ont été ${onlyNew ? 'calculés ou mis à jour' : 'recalculés'}`,
      });
    } catch (error) {
      console.error('Error during batch recalculation:', error);
      toast({
        title: "Erreur lors du recalcul",
        description: "Une erreur est survenue lors du recalcul des scores",
        variant: "destructive"
      });
    } finally {
      setIsGlobalRecalculating(false);
    }
  }, [calculateAIScore, isJobSpecific, state]);

  // Invalider tous les scores en cache
  const invalidateAllScores = useCallback(() => {
    console.log('Invalidating all cached AI scores');
    setState({});
  }, []);

  // Effet d'écoute de changement d'offre d'emploi active
  useEffect(() => {
    // Si on change d'offre d'emploi active, réinitialiser les scores
    invalidateAllScores();
  }, [activeJobOfferId, invalidateAllScores]);

  return {
    getAIScore,
    calculateAIScore,
    recalculateAllScores,
    invalidateAllScores,
    preloadScoresFromDatabase,
    isGlobalRecalculating,
    isJobSpecific,
    forceReanalyzeCandidate
  };
};
