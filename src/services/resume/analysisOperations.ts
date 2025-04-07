
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
    
    // Utilisation de plusieurs méthodes pour obtenir l'URL du fichier
    let fileUrl = null;
    let fileError = null;
    
    // Méthode 1: Création d'une URL signée avec timeout étendu
    try {
      const { data: urlData, error: signedUrlError } = await supabase
        .storage
        .from('resumes')
        .createSignedUrl(resume.file_path, 60 * 15); // 15 minutes
        
      if (signedUrlError) {
        console.warn('Could not create signed URL:', signedUrlError.message);
        fileError = signedUrlError;
      } else if (urlData && urlData.signedUrl) {
        fileUrl = urlData.signedUrl;
        console.log('Got signed URL for file extraction:', fileUrl.substring(0, 50) + '...');
      }
    } catch (e) {
      console.warn('Exception creating signed URL:', e);
      fileError = e;
    }
    
    // Méthode 2: Utiliser l'URL publique si la méthode 1 échoue
    if (!fileUrl) {
      try {
        const publicUrl = await resumeStorageService.getFileUrl(resume.file_path);
        
        if (publicUrl) {
          fileUrl = publicUrl;
          console.log('Using public URL instead of signed URL:', publicUrl.substring(0, 50) + '...');
        }
      } catch (e) {
        console.warn('Could not get public URL either:', e);
      }
    }
    
    // Méthode 3: Dernier recours - télécharger le fichier et l'analyser en local
    if (!fileUrl) {
      console.log('Could not get any URL for the file, will attempt local processing');
      
      toast({
        title: "Extraction du texte",
        description: "Extraction locale du texte du CV en cours...",
        duration: 5000,
      });
      
      // Récupérer le fichier directement
      const file = await resumeStorageService.downloadResumeAsFile(resumeId);
      
      if (!file) {
        throw new Error('Impossible de télécharger le fichier du CV');
      }
      
      // Analyser directement avec le fichier
      const analysisResult = await resumeAnalysisService.analyzeResume(resumeId, file);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.message || 'Échec de l\'analyse du CV');
      }
      
      console.log('Resume analyzed successfully via direct file processing');
      
      // Mark the resume as analyzed
      await resumeDataService.markResumeAsParsed(resumeId);
      
      return { 
        success: true, 
        message: 'Analyse terminée avec succès (traitement local)',
        candidateId: analysisResult.candidateId
      };
    }
    
    // Si on a l'URL, procéder à l'analyse via serveur
    toast({
      title: "Extraction du texte",
      description: "Extraction du texte du CV en cours...",
      duration: 5000,
    });
    
    // Première tentative: utiliser la nouvelle edge function d'extraction
    try {
      const { data: extractionData, error: extractionError } = await supabase.functions.invoke('extract-cv-text', {
        body: { pdfUrl: fileUrl }
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
      console.warn('Server-side extraction/analysis failed, attempting client-side analysis:', serverError);
      
      // Tentative d'analyse côté client avec l'URL
      try {
        const analysisResult = await resumeAnalysisService.analyzeResumeWithUrl(resumeId, fileUrl);
        
        if (!analysisResult.success) {
          throw new Error(analysisResult.message || 'Échec de l\'analyse du CV');
        }
        
        console.log('Resume analyzed successfully via client-side URL analysis');
        
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
  } catch (error: any) {
    console.error('Error in analyzeResume:', error);
    return { 
      success: false, 
      message: error.message || 'Une erreur est survenue lors de l\'analyse du CV' 
    };
  }
};
