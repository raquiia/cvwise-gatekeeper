
import { useAIScoringCache } from './use-ai-scoring-cache';

export const useAIScoring = () => {
  const { getScore, preloadScores, clearCache, isJobSpecific } = useAIScoringCache();

  const getAIScore = (candidateId: string) => {
    const cached = getScore(candidateId);
    
    return {
      score: cached.score,
      isLoading: cached.isLoading,
      error: cached.error,
      explanation: cached.explanation,
      source: cached.source,
      breakdown: cached.breakdown,
      isJobSpecific: cached.isJobSpecific,
      lastUpdated: cached.lastUpdated
    };
  };

  const preloadScoresFromDatabase = async (candidateIds: string[]) => {
    const results = await preloadScores(candidateIds);
    
    // Convertir au format attendu par les composants
    const formattedResults: Record<string, any> = {};
    Object.entries(results).forEach(([candidateId, cached]) => {
      formattedResults[candidateId] = {
        score: cached.score,
        explanation: cached.explanation,
        breakdown: cached.breakdown,
        isJobSpecific: cached.isJobSpecific,
        source: cached.source,
        error: cached.error
      };
    });
    
    return formattedResults;
  };

  return {
    getAIScore,
    preloadScoresFromDatabase,
    clearCache,
    isJobSpecific
  };
};
