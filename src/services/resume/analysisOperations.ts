
// Re-export all analysis functions from separate modules
import { analyzeResume } from './resumeAnalysisService';
import { extractResumeText } from './textExtractionService';
import { checkResumeAlreadyAnalyzed } from './resumeValidationService';
import { analyzeBatchResumes } from './batchAnalysisService';
import { getCompleteCandidateData } from './candidateDataService';
import { optimizedScoringService } from '../scoring/optimizedScoringService';

// Re-export all functions for backward compatibility
export {
  analyzeResume,
  extractResumeText,
  checkResumeAlreadyAnalyzed,
  analyzeBatchResumes,
  getCompleteCandidateData
};

/**
 * Analyser un CV et calculer automatiquement le score optimisé
 */
export const analyzeResumeWithOptimizedScoring = async (
  resumeId: string, 
  resumeText: string, 
  overwriteExisting: boolean = false
): Promise<{ success: boolean; message?: string; candidateId?: string; score?: number }> => {
  try {
    // Analyser le CV avec la méthode existante
    const analysisResult = await analyzeResume(resumeId, resumeText, overwriteExisting);
    
    if (!analysisResult.success || !analysisResult.candidateId) {
      return analysisResult;
    }
    
    // Calculer le score de complétude avec le nouveau système
    try {
      const scoreBreakdown = await optimizedScoringService.calculateCompletenessScore(analysisResult.candidateId);
      
      return {
        ...analysisResult,
        score: scoreBreakdown?.general_score || 0
      };
    } catch (scoringError) {
      console.warn('Error calculating score after CV analysis:', scoringError);
      // Retourner le résultat de l'analyse même si le scoring échoue
      return analysisResult;
    }
    
  } catch (error: any) {
    console.error('Error in analyzeResumeWithOptimizedScoring:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de l\'analyse du CV'
    };
  }
};
