
import React, { useEffect, useRef } from 'react';
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
  const { getAIScore } = useAIScoring();
  const { score: candidateScore, explanation, isLoading: scoreLoading } = useCandidateScore(candidate);
  const aiScoreData = getAIScore(candidate.id!);
  
  // Éviter les rechargements inutiles avec useRef
  const lastCandidateIdRef = useRef<string>();
  const hasMountedRef = useRef(false);
  
  useEffect(() => {
    // Ne précharger qu'une seule fois par candidat
    if (candidate.id && candidate.id !== lastCandidateIdRef.current && !hasMountedRef.current) {
      console.log('ScoreDisplay: Initial load for candidate:', candidate.id);
      lastCandidateIdRef.current = candidate.id;
      hasMountedRef.current = true;
    }
  }, [candidate.id]);
  
  const handleRefresh = () => {
    console.log('ScoreDisplay: Refresh requested - scores are calculated during CV analysis');
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <AIScoreDisplay
      candidateId={candidate.id!}
      score={aiScoreData.score}
      explanation={explanation || aiScoreData.explanation}
      breakdown={aiScoreData.breakdown}
      isLoading={isLoading || aiScoreData.isLoading || scoreLoading}
      isJobSpecific={aiScoreData.isJobSpecific}
      error={aiScoreData.error}
      onRefresh={handleRefresh}
    />
  );
};

export default ScoreDisplay;
