
import { supabase } from '@/integrations/supabase/client';
import { resumeAnalysisService } from '../analysis/resumeAnalysisService';
import { resumeDataService } from '../data/resumeDataService';
import { resumeStorageService } from '../storage/resumeStorageService';
import { toast } from '@/hooks/use-toast';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

/**
 * Analyze a resume by its ID
 */
export const analyzeResume = async (resumeId: string): Promise<{ success: boolean; message: string; candidateId?: string }> => {
  try {
    console.log('Starting resume analysis for ID:', resumeId);
    
    // Ensure bucket exists first
    await ensureResumesBucketExists().catch(err => {
      console.warn('Bucket initialization warning (non-blocking):', err);
    });
    
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
    
    // Attempt to download the file for direct processing (most reliable method)
    try {
      toast({
        title: "Extraction du texte",
        description: "Téléchargement et extraction locale du fichier en cours...",
        duration: 5000,
      });
      
      // Récupérer le fichier directement
      const file = await resumeStorageService.downloadResumeAsFile(resumeId);
      
      if (file) {
        console.log('Successfully downloaded resume file for processing');
        
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
      } else {
        console.log('Could not download file directly, will try URL methods');
      }
    } catch (directProcessError) {
      console.warn('Error during direct file processing:', directProcessError);
      // Continue to URL-based methods
    }
    
    // Try to get a URL for the file (fallback method)
    let fileUrl = null;
    
    // Method 1: Try to get a file URL from the public URL (most reliable for public buckets)
    try {
      fileUrl = `${supabase.storage.url}/object/public/resumes/${resume.file_path}`;
      console.log('Using constructed public URL:', fileUrl);
    } catch (e) {
      console.warn('Could not construct public URL:', e);
    }
    
    // Method 2: Try to get a URL through Supabase public method
    if (!fileUrl) {
      try {
        const publicUrl = resumeStorageService.getPublicUrl(resume.file_path);
        
        if (publicUrl) {
          fileUrl = publicUrl;
          console.log('Using public URL method:', publicUrl.substring(0, 50) + '...');
        }
      } catch (e) {
        console.warn('Could not get public URL:', e);
      }
    }
    
    // If URL methods fail, try server-side processing with the resume ID only
    if (!fileUrl) {
      console.log('Could not get a URL for the file, will attempt server-side processing with resume ID only');
      
      toast({
        title: "Analyse en cours",
        description: "Extraction et analyse du CV côté serveur...",
        duration: 5000,
      });
      
      try {
        // Use the AI analysis edge function with resume ID only
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('resume-ai-analysis', {
          body: { 
            resumeId,
            extractText: true  // Signal to extract text on the server
          }
        });
        
        if (analysisError) {
          console.error('Error in resume-ai-analysis function:', analysisError);
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
        console.error('Server-side analysis failed:', serverError);
        throw new Error('Échec de l\'analyse côté serveur: ' + serverError.message);
      }
    }
    
    // If we have a URL, try to process with it
    toast({
      title: "Analyse en cours",
      description: "Analyse du CV avec URL...",
      duration: 5000,
    });
    
    try {
      const analysisResult = await resumeAnalysisService.analyzeResumeWithUrl(resumeId, fileUrl);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.message || 'Échec de l\'analyse du CV');
      }
      
      console.log('Resume analyzed successfully via URL-based processing');
      
      // Mark the resume as analyzed
      await resumeDataService.markResumeAsParsed(resumeId);
      
      return { 
        success: true, 
        message: 'Analyse terminée avec succès',
        candidateId: analysisResult.candidateId
      };
    } catch (urlAnalysisError) {
      console.error('URL-based analysis failed:', urlAnalysisError);
      throw new Error('Échec de l\'analyse avec URL: ' + urlAnalysisError.message);
    }
  } catch (error: any) {
    console.error('Error in analyzeResume:', error);
    return { 
      success: false, 
      message: error.message || 'Une erreur est survenue lors de l\'analyse du CV' 
    };
  }
};
