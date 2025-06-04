
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
  const { calculateAIScore, getAIScore, forceReanalyzeCandidate, preloadScoresFromDatabase } = useAIScoring();
  const { score: candidateScore, explanation, isLoading: scoreLoading } = useCandidateScore(candidate);
  const aiScoreData = getAIScore(candidate.id!);
  
  // Précharger d'abord depuis la base de données, puis calculer seulement si nécessaire
  useEffect(() => {
    if (candidate.id) {
      console.log('ScoreDisplay: Starting score loading process for candidate:', candidate.id);
      
      // D'abord précharger depuis la base de données
      preloadScoresFromDatabase([candidate.id]).then(() => {
        // Après le préchargement, vérifier si on a maintenant un score
        const scoreAfterPreload = getAIScore(candidate.id!);
        
        console.log('ScoreDisplay: After preload check - score:', scoreAfterPreload.score, 'loading:', scoreAfterPreload.isLoading, 'error:', scoreAfterPreload.error);
        
        // Calculer SEULEMENT si aucun score n'existe après le préchargement
        if (!scoreAfterPreload.score && !scoreAfterPreload.isLoading && !scoreAfterPreload.error) {
          console.log('ScoreDisplay: No score found after preload, calculating new AI score for candidate:', candidate.id);
          calculateAIScore(candidate.id);
        } else if (scoreAfterPreload.score) {
          console.log('ScoreDisplay: Score found in cache after preload, no calculation needed');
        }
      });
    }
  }, [candidate.id, preloadScoresFromDatabase, getAIScore, calculateAIScore]);
  
  const handleRefresh = async () => {
    if (candidate.id) {
      console.log('Manual reanalysis of candidate with AI (force recalculate):', candidate.id);
      await forceReanalyzeCandidate(candidate.id);
    }
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
