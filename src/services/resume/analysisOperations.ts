
// Re-export all analysis functions from separate modules
import { analyzeResume } from './resumeAnalysisService';
import { extractResumeText } from './textExtractionService';
import { checkResumeAlreadyAnalyzed } from './resumeValidationService';
import { analyzeBatchResumes } from './batchAnalysisService';
import { getCompleteCandidateData } from './candidateDataService';

// Re-export all functions for backward compatibility
export {
  analyzeResume,
  extractResumeText,
  checkResumeAlreadyAnalyzed,
  analyzeBatchResumes,
  getCompleteCandidateData
};

/**
 * Analyser un CV avec l'IA consolidée (données + score en une seule requête)
 * Cette fonction utilise maintenant l'analyse consolidée qui calcule tout en une fois
 */
export const analyzeResumeWithOptimizedScoring = async (
  resumeId: string, 
  resumeText: string, 
  overwriteExisting: boolean = false
): Promise<{ success: boolean; message?: string; candidateId?: string; score?: number }> => {
  try {
    console.log('🚀 Starting consolidated analysis (data + score) for resume:', resumeId);
    
    // Utiliser la nouvelle méthode d'analyse consolidée
    const analysisResult = await analyzeResume(resumeId, resumeText, overwriteExisting);
    
    if (!analysisResult.success || !analysisResult.candidateId) {
      return analysisResult;
    }
    
    console.log('✅ Consolidated analysis completed successfully for candidate:', analysisResult.candidateId);
    
    // Le score a déjà été calculé et sauvé lors de l'analyse consolidée
    // Pas besoin de calcul supplémentaire
    return {
      ...analysisResult,
      score: undefined // Le score sera récupéré depuis la base de données par les hooks
    };
    
  } catch (error: any) {
    console.error('Error in analyzeResumeWithOptimizedScoring:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de l\'analyse consolidée du CV'
    };
  }
};
