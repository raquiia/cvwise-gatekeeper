
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
    
    // Première tentative: utiliser la nouvelle edge function d'extraction
    try {
      toast({
        title: "Extraction du texte",
        description: "Extraction du texte du CV en cours...",
        duration: 5000,
      });
      
      const { data: extractionData, error: extractionError } = await supabase.functions.invoke('extract-cv-text', {
        body: { resumeId }
      });
      
      if (extractionError) {
        console.error('Error in extract-cv-text function:', extractionError);
        throw new Error(extractionError.message);
      }
      
      if (!extractionData.success || !extractionData.data?.text) {
        console.error('Text extraction failed:', extractionData.error || 'No text returned');
        throw new Error(extractionData.error || 'Échec de l\'extraction du texte');
      }
      
      console.log('Text extracted successfully using extract-cv-text function');
      
      // Procéder à l'analyse IA avec le texte extrait
      toast({
        title: "Analyse IA en cours",
        description: "Traitement du contenu du CV par IA...",
        duration: 5000,
      });
      
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('resume-ai-analysis', {
        body: { 
          resumeId,
          resumeText: extractionData.data.text
        }
      });
      
      if (analysisError) {
        console.error('Error in AI analysis:', analysisError);
        throw new Error(analysisError.message);
      }
      
      if (!analysisData.success) {
        throw new Error(analysisData.message || 'Échec de l\'analyse du CV');
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
      console.warn('Server-side extraction/analysis failed, attempting classic analysis:', serverError);
      
      // Seconde tentative: revenir à l'ancienne méthode edge function qui gère à la fois l'extraction et l'analyse
      try {
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
        
        console.log('Resume analyzed successfully via legacy server-side processing');
        
        // Mark the resume as analyzed
        await resumeDataService.markResumeAsParsed(resumeId);
        
        return { 
          success: true, 
          message: 'Analyse terminée avec succès',
          candidateId: analysisData.candidate?.id
        };
      } catch (legacyServerError) {
        console.warn('Legacy server-side analysis also failed, attempting client-side fallback:', legacyServerError);
        
        // Dernière tentative: télécharger le fichier pour traitement côté client
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
          console.error('All extraction and analysis methods failed:', clientError);
          throw clientError;
        }
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
