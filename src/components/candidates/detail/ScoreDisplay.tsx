
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
  const { getAIScore, preloadScoresFromDatabase } = useAIScoring();
  const { score: candidateScore, explanation, isLoading: scoreLoading } = useCandidateScore(candidate);
  const aiScoreData = getAIScore(candidate.id!);
  
  // Précharger les scores depuis la base de données
  useEffect(() => {
    if (candidate.id) {
      console.log('ScoreDisplay: Preloading AI score from database for candidate:', candidate.id);
      preloadScoresFromDatabase([candidate.id]).then((loadedScores) => {
        const preloadedScore = loadedScores[candidate.id];
        if (preloadedScore && preloadedScore.score !== null) {
          console.log('ScoreDisplay: Score found in database:', preloadedScore.score);
        } else {
          console.log('ScoreDisplay: No score found in database - will be calculated during CV analysis');
        }
      }).catch((error) => {
        console.error('ScoreDisplay: Error preloading score:', error);
      });
    }
  }, [candidate.id, preloadScoresFromDatabase]);
  
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
