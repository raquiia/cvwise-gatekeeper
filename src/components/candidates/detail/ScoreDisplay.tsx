
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
  
  // Précharger intelligemment : vérifier d'abord la DB, puis calculer seulement si vraiment nécessaire
  useEffect(() => {
    if (candidate.id) {
      console.log('ScoreDisplay: Starting intelligent score loading for candidate:', candidate.id);
      
      // Précharger depuis la base de données et obtenir le résultat directement
      preloadScoresFromDatabase([candidate.id]).then((loadedScores) => {
        console.log('ScoreDisplay: Preload completed, loaded scores:', loadedScores);
        
        // Vérifier si on a trouvé un score pour ce candidat
        const preloadedScore = loadedScores[candidate.id];
        
        if (preloadedScore && preloadedScore.score !== null) {
          console.log('ScoreDisplay: Score found in database cache, no calculation needed:', preloadedScore.score);
        } else {
          // Vérifier une dernière fois l'état actuel (au cas où)
          const currentScore = getAIScore(candidate.id!);
          
          if (!currentScore.score && !currentScore.isLoading && !currentScore.error) {
            console.log('ScoreDisplay: No score found anywhere, calculating new AI score for candidate:', candidate.id);
            calculateAIScore(candidate.id);
          } else {
            console.log('ScoreDisplay: Score already exists in current state, no calculation needed');
          }
        }
      }).catch((error) => {
        console.error('ScoreDisplay: Error during preload, attempting direct calculation:', error);
        const currentScore = getAIScore(candidate.id!);
        if (!currentScore.score && !currentScore.isLoading && !currentScore.error) {
          calculateAIScore(candidate.id);
        }
      });
    }
  }, [candidate.id]); // Dépendances simplifiées pour éviter les re-exécutions
  
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
