
import { checkResumeAlreadyAnalyzed } from './resumeValidationService';
import { analyzeResume } from './analysisOperations';

export interface BatchAnalysisProgress {
  current: number;
  total: number;
  currentResumeId: string;
  success: boolean;
}

export interface BatchAnalysisResult {
  successCount: number;
  totalCount: number;
  failedResumes: string[];
}

/**
 * Exécuter l'analyse en lot de plusieurs CV
 */
export const analyzeBatchResumes = async (
  resumeItems: Array<{ resumeId: string, text: string }>,
  onProgress?: (current: number, total: number, currentResumeId: string, success: boolean) => void
): Promise<BatchAnalysisResult> => {
  try {
    console.log(`Starting batch analysis of ${resumeItems.length} resumes`);
    
    let successCount = 0;
    const failedResumes: string[] = [];
    
    // Traiter les CV un par un pour éviter de surcharger le système
    for (let i = 0; i < resumeItems.length; i++) {
      const { resumeId, text } = resumeItems[i];
      
      console.log(`Processing resume ${i + 1}/${resumeItems.length}, ID: ${resumeId}`);
      
      try {
        // Vérifier si le CV a déjà été analysé
        const alreadyAnalyzed = await checkResumeAlreadyAnalyzed(resumeId);
        
        // Analyser le CV (si pas déjà analysé)
        if (!alreadyAnalyzed) {
          if (!text || text.trim() === '') {
            console.error(`Empty text for resume ${resumeId}, skipping`);
            failedResumes.push(resumeId);
            
            // Notifier de la progression, même en cas d'erreur
            if (onProgress) {
              onProgress(i + 1, resumeItems.length, resumeId, false);
            }
            continue;
          }
          
          console.log(`Sending resume ${resumeId} to analysis, text length: ${text.length}`);
          const result = await analyzeResume(resumeId);
          
          if (result.success) {
            successCount++;
            console.log(`Successfully analyzed resume ${resumeId}`);
          } else {
            failedResumes.push(resumeId);
            console.error(`Failed to analyze resume ${resumeId}: ${result.error}`);
          }
        } else {
          // Compter comme réussi si déjà analysé
          successCount++;
          console.log(`Resume ${resumeId} was already analyzed, skipping`);
        }
      } catch (error: any) {
        console.error(`Error analyzing resume ${resumeId}:`, error);
        failedResumes.push(resumeId);
      }
      
      // Appeler la fonction de progression si fournie
      if (onProgress) {
        onProgress(i + 1, resumeItems.length, resumeId, !failedResumes.includes(resumeId));
      }
    }
    
    console.log(`Batch analysis completed. Success: ${successCount}/${resumeItems.length}`);
    return {
      successCount,
      totalCount: resumeItems.length,
      failedResumes
    };
  } catch (error: any) {
    console.error('Error in batch analysis:', error);
    throw new Error(`Erreur lors de l'analyse par lot: ${error.message}`);
  }
};
