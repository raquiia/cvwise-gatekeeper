
import React, { useEffect } from 'react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { useCandidateScore } from '@/hooks/use-candidate-score';
import AIScoreDisplay from '../AIScoreDisplay';
import type { CandidateData } from '@/services/data/candidateService';

interface ScoreDisplayProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ candidate, isLoading, onRefresh }) => {
  const { calculateAIScore, getAIScore } = useAIScoring();
  const { score: candidateScore, explanation, isLoading: scoreLoading } = useCandidateScore(candidate);
  const aiScoreData = getAIScore(candidate.id!);
  
  // Calculer automatiquement le score au chargement si pas déjà calculé
  // Le nouveau système vérifiera d'abord la base de données avant d'appeler OpenAI
  useEffect(() => {
    if (candidate.id && !aiScoreData.score && !aiScoreData.isLoading && !aiScoreData.error) {
      console.log('Auto-calculating AI score with cache optimization for candidate:', candidate.id);
      calculateAIScore(candidate.id);
    }
  }, [candidate.id, aiScoreData.score, aiScoreData.isLoading, aiScoreData.error, calculateAIScore]);
  
  const handleRefresh = async () => {
    if (candidate.id) {
      console.log('Manual refresh of AI score for candidate (force recalculate):', candidate.id);
      await calculateAIScore(candidate.id, true); // Force recalculate bypasse complètement le cache
    }
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <AIScoreDisplay
      candidateId={candidate.id!}
      score={aiScoreData.score}
      explanation={explanation || aiScoreData.explanation} // Utiliser l'explication du hook unifié ou celle de l'AI
      breakdown={aiScoreData.breakdown}
      isLoading={isLoading || aiScoreData.isLoading || scoreLoading}
      isJobSpecific={aiScoreData.isJobSpecific}
      error={aiScoreData.error}
      onRefresh={handleRefresh}
    />
  );
};

export default ScoreDisplay;
