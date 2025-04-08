
import { supabase } from '@/integrations/supabase/client';
import { resumeAnalysisService } from '../analysis/resumeAnalysisService';
import { resumeDataService } from '../data/resumeDataService';
import { resumeStorageService } from '../storage/resumeStorageService';
import { toast } from '@/hooks/use-toast';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';
import { extractTextFromPDF } from '@/utils/pdfUtils';

/**
 * Extraire uniquement le texte d'un CV sans faire d'analyse
 */
export const extractResumeText = async (resumeId: string): Promise<{ success: boolean; message: string; text?: string }> => {
  try {
    console.log('Starting text extraction for resume ID:', resumeId);
    
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
    console.log('Resume found, proceeding with text extraction');
    
    // Afficher une notification de démarrage
    toast({
      title: "Extraction du texte",
      description: "Démarrage de l'extraction, cela peut prendre quelques secondes...",
      duration: 3000,
    });
    
    // PRIORITÉ SERVEUR: Try the server-side extraction first (more reliable for this application)
    try {
      toast({
        title: "Extraction en cours",
        description: "Extraction côté serveur en cours...",
        duration: 3000,
      });
      
      // Get a direct URL for the PDF file
      const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(resume.file_path);
      const directUrl = publicUrlData.publicUrl;
      
      if (!directUrl) {
        throw new Error("Impossible d'obtenir l'URL du fichier");
      }
      
      console.log('Using direct storage URL for server extraction:', directUrl.substring(0, 50) + '...');
      
      // Use the extraction edge function with direct URL
      const { data: extractionData, error: extractionError } = await supabase.functions.invoke('extract-cv-text', {
        body: { 
          resumeId,
          pdfUrl: directUrl
        }
      });
      
      if (extractionError) {
        console.error('Error in extract-cv-text function with URL:', extractionError);
        throw new Error(`Erreur du serveur: ${extractionError.message || "Erreur inconnue"}`);
      }
      
      if (!extractionData || !extractionData.success) {
        const errorMsg = extractionData?.error || 'Échec de l\'extraction du texte';
        throw new Error(`Erreur: ${errorMsg}`);
      }
      
      console.log('Text extracted successfully via server processing');
      
      // Vérifier si le texte extrait est utilisable
      const extractedText = extractionData.data.text;
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error("Le texte extrait est insuffisant. Le fichier est peut-être dans un format non supporté.");
      }
      
      toast({
        title: "Extraction réussie",
        description: `Texte extrait: ${extractedText.length} caractères`,
        duration: 3000,
      });
      
      return { 
        success: true, 
        message: 'Texte extrait avec succès',
        text: extractedText
      };
    } catch (serverError: any) {
      console.error('Server-side extraction failed:', serverError);
      console.log('Attempting local client-side extraction as fallback...');
      
      // PRIORITÉ CLIENT: Si l'extraction côté serveur échoue, essayer l'extraction côté client
      try {
        toast({
          title: "Changement de méthode",
          description: "Extraction locale en cours...",
          duration: 3000,
        });
        
        // Try using a direct signed URL approach
        try {
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('resumes')
            .createSignedUrl(resume.file_path, 60);
            
          if (signedUrlError || !signedUrlData || !signedUrlData.signedUrl) {
            console.error('Error creating signed URL:', signedUrlError);
            throw new Error("Impossible de créer une URL signée pour le fichier");
          }
          
          console.log('Got signed URL for direct extraction:', signedUrlData.signedUrl.substring(0, 50) + '...');
          
          // Use client-side utility to extract text from URL
          const extractedText = await extractTextFromPDF(new File([await (await fetch(signedUrlData.signedUrl)).blob()], resume.file_name));
          
          if (!extractedText || extractedText.length < 50) {
            throw new Error("Le texte extrait est insuffisant");
          }
          
          console.log('Text extracted successfully via direct signed URL method');
          
          toast({
            title: "Extraction réussie (URL signée)",
            description: `Texte extrait: ${extractedText.length} caractères`,
            duration: 3000,
          });
          
          return { 
            success: true, 
            message: 'Texte extrait avec succès (URL signée)',
            text: extractedText
          };
        } catch (signedUrlError) {
          console.error('Signed URL approach failed:', signedUrlError);
          
          // Télécharger le fichier dans le navigateur (fallback final)
          const file = await resumeStorageService.downloadResumeAsFile(resumeId);
          
          if (!file) {
            throw new Error("Impossible de télécharger le fichier localement");
          }
          
          console.log('Successfully downloaded resume file for local processing');
          
          // Extraire le texte du fichier sans analyse (méthode client-side)
          const extractedText = await extractTextFromPDF(file);
          
          if (!extractedText || extractedText.length < 50) {
            throw new Error("Le texte extrait est insuffisant");
          }
          
          console.log('Text extracted successfully via direct file processing (client-side)');
          
          toast({
            title: "Extraction réussie (méthode locale)",
            description: `Texte extrait: ${extractedText.length} caractères`,
            duration: 3000,
          });
          
          return { 
            success: true, 
            message: 'Texte extrait avec succès (méthode locale)',
            text: extractedText
          };
        }
      } catch (localError: any) {
        console.error('Client-side extraction also failed:', localError);
        
        // Créer un message d'erreur plus descriptif combinant les deux tentatives
        const errorMessage = `Erreur d'extraction: l'extraction côté serveur et l'extraction locale ont échoué.\n\nDétails serveur: ${serverError.message || "Erreur inconnue"}\n\nDétails locaux: ${localError.message || "Erreur inconnue"}`;
        
        toast({
          title: "Extraction échouée",
          description: "Les deux méthodes d'extraction ont échoué. Vérifiez que le bucket 'resumes' existe et que vous avez les autorisations nécessaires.",
          variant: "destructive",
          duration: 5000,
        });
        
        return { 
          success: false, 
          message: errorMessage,
          text: errorMessage
        };
      }
    }
  } catch (error: any) {
    console.error('Error in extractResumeText:', error);
    
    // Notification plus explicite pour l'utilisateur
    toast({
      title: "Extraction échouée",
      description: error.message || "Impossible d'extraire le texte du CV",
      variant: "destructive",
      duration: 5000,
    });
    
    const errorMessage = `Erreur: ${error.message || "Une erreur est survenue lors de l'extraction du texte du CV"}`;
    return { 
      success: false, 
      message: errorMessage,
      text: errorMessage
    };
  }
};

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
    
    // Afficher une notification de démarrage
    toast({
      title: "Analyse du CV",
      description: "Démarrage de l'analyse, cela peut prendre jusqu'à 30 secondes...",
      duration: 5000,
    });
    
    // 1. MÉTHODE PRIMAIRE: Attempt to download the file for direct processing (most reliable method)
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
    
    // 2. MÉTHODE ALTERNATIVE: Try server-side extraction
    toast({
      title: "Analyse en cours",
      description: "Extraction et analyse du CV côté serveur...",
      duration: 5000,
    });
    
    try {
      console.log('Attempting server-side extraction with function');
      
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
      console.log('Will try direct URL method as last resort');
    }
    
    // 3. MÉTHODE DE DERNIER RECOURS: Try to get a URL for the file
    try {
      toast({
        title: "Analyse en cours",
        description: "Analyse du CV avec URL directe...",
        duration: 5000,
      });
      
      // Get a direct URL using the proper method without accessing protected properties
      const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(resume.file_path);
      const directUrl = publicUrlData.publicUrl;
      
      console.log('Using direct storage URL:', directUrl);
      
      const analysisResult = await resumeAnalysisService.analyzeResumeWithUrl(resumeId, directUrl);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.message || 'Échec de l\'analyse du CV');
      }
      
      console.log('Resume analyzed successfully via direct URL-based processing');
      
      // Mark the resume as analyzed
      await resumeDataService.markResumeAsParsed(resumeId);
      
      return { 
        success: true, 
        message: 'Analyse terminée avec succès',
        candidateId: analysisResult.candidateId
      };
    } catch (directUrlError) {
      console.error('Direct URL analysis failed:', directUrlError);
      
      // Notification plus explicite pour l'utilisateur
      toast({
        title: "Analyse échouée",
        description: "Le CV est peut-être trop volumineux pour être analysé automatiquement. Veuillez réessayer avec un fichier plus petit.",
        variant: "destructive",
        duration: 7000,
      });
      
      throw new Error('Le CV est probablement trop volumineux pour être analysé automatiquement. Veuillez réessayer avec un fichier PDF plus petit ou optimisé.');
    }
  } catch (error: any) {
    console.error('Error in analyzeResume:', error);
    return { 
      success: false, 
      message: error.message || 'Une erreur est survenue lors de l\'analyse du CV' 
    };
  }
};
