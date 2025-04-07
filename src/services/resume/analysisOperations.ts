
import { supabase } from '@/integrations/supabase/client';
import { resumeAnalysisService } from '../analysis/resumeAnalysisService';
import { resumeDataService } from '../data/resumeDataService';
import { resumeStorageService } from '../storage/resumeStorageService';
import { toast } from '@/hooks/use-toast';

/**
 * Analyze a resume by its ID
 */
export const analyzeResume = async (resumeId: string): Promise<{ success: boolean; message: string; candidateId?: string }> => {
  try {
    console.log('Starting resume analysis for ID:', resumeId);
    
    // Get resume details using a stored procedure to avoid RLS recursion issues
    const { data: resumeData, error: resumeError } = await supabase
      .rpc('get_resume_by_id', { p_resume_id: resumeId });
    
    if (resumeError) {
      console.error('Error fetching resume details:', resumeError);
      throw new Error(resumeError.message);
    }
    
    if (!resumeData || resumeData.length === 0) {
      console.error('No resume found with ID:', resumeId);
      throw new Error('CV introuvable');
    }
    
    const resume = resumeData[0];
    console.log('Resume found, proceeding with analysis');
    
    // Try to analyze the resume without requiring the file download first
    try {
      // Invoke edge function directly for analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('resume-ai-analysis', {
        body: { 
          resumeId,
          extractText: true // Flag to indicate we need text extraction on server side
        }
      });
      
      if (analysisError) {
        console.error('Error in server-side resume analysis:', analysisError);
        throw new Error(analysisError.message);
      }
      
      if (!analysisData.success) {
        throw new Error(analysisData.message || 'Échec de l\'analyse du CV sur le serveur');
      }
      
      console.log('Resume analyzed successfully via server-side processing');
      
      // Mark the resume as analyzed
      await resumeDataService.markResumeAsParsed(resumeId);
      
      return { 
        success: true, 
        message: 'Analyse terminée avec succès',
        candidateId: analysisData.candidate?.id
      };
    } catch (serverError) {
      console.warn('Server-side analysis failed, attempting client-side fallback:', serverError);
      
      // Fallback: try downloading the file for client-side processing
      try {
        const pdfFile = await resumeStorageService.downloadResumeAsFile(resumeId);
        if (!pdfFile) {
          throw new Error("Impossible de télécharger le fichier du CV");
        }
        
        // Use client-side analysis as a fallback
        const analysisResult = await resumeAnalysisService.analyzeResume(resumeId, pdfFile);
        
        if (!analysisResult.success) {
          throw new Error(analysisResult.message || 'Échec de l\'analyse du CV');
        }
        
        console.log('Resume analyzed successfully via client-side fallback:', analysisResult);
        
        // Mark the resume as analyzed
        await resumeDataService.markResumeAsParsed(resumeId);
        
        return { 
          success: true, 
          message: 'Analyse terminée avec succès (traitement local)',
          candidateId: analysisResult.candidateId
        };
      } catch (clientError) {
        console.error('Client-side fallback also failed:', clientError);
        throw clientError;
      }
    }
  } catch (error: any) {
    console.error('Error in analyzeResume:', error);
    return { 
      success: false, 
      message: error.message || 'Une erreur est survenue lors de l\'analyse du CV' 
    };
  }
};
