
import React from 'react';
import { useCandidateScore } from '@/hooks/use-candidate-score';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import AIScoreDisplay from '../AIScoreDisplay';
import type { CandidateData } from '@/services/data/candidateService';

interface ScoreDisplayProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ candidate, isLoading, onRefresh }) => {
  const { calculateAIScore, getAIScore } = useAIScoring();
  const aiScoreData = getAIScore(candidate.id!);
  
  const handleRefresh = async () => {
    if (candidate.id) {
      await calculateAIScore(candidate.id, true); // Force recalculate
    }
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <AIScoreDisplay
      candidateId={candidate.id!}
      score={aiScoreData.score}
      explanation={aiScoreData.explanation}
      breakdown={aiScoreData.breakdown}
      isLoading={isLoading || aiScoreData.isLoading}
      isJobSpecific={aiScoreData.isJobSpecific}
      error={aiScoreData.error}
      onRefresh={handleRefresh}
    />
  );
};

export default ScoreDisplay;
