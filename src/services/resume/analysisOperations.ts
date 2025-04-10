
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from '@/services/data/resumeDataService';
import { Json } from '@/integrations/supabase/types';

/**
 * Vérifier si un CV a déjà été analysé
 */
export const checkResumeAlreadyAnalyzed = async (resumeId: string): Promise<{ analyzed: boolean; candidateId?: string }> => {
  try {
    console.log('Checking if resume has already been analyzed:', resumeId);
    
    // Utiliser une requête directe au lieu d'une requête qui pourrait déclencher la récursion RLS
    const { data: resumeData, error: resumeError } = await supabase
      .rpc('get_resume_by_id', { p_resume_id: resumeId });
    
    if (resumeError) {
      console.error('Error checking resume parsed status:', resumeError);
      throw new Error(`Erreur lors de la vérification du statut du CV: ${resumeError.message}`);
    }
    
    // Handle array response - check if we have any data and if the first item is parsed
    if (!resumeData || resumeData.length === 0 || !resumeData[0].parsed) {
      return { analyzed: false };
    }
    
    // Récupérer le candidat associé à ce CV sans utiliser une requête directe
    const { data: candidates, error: candidateError } = await supabase
      .from('candidates')
      .select('id')
      .eq('resume_id', resumeId)
      .limit(1);
    
    if (candidateError) {
      console.error('Error checking candidate for resume:', candidateError);
      throw new Error(`Erreur lors de la vérification du candidat: ${candidateError.message}`);
    }
    
    if (candidates && candidates.length > 0) {
      return { analyzed: true, candidateId: candidates[0].id };
    }
    
    return { analyzed: true }; // Le CV est marqué comme analysé mais aucun candidat trouvé
  } catch (error: any) {
    console.error('Exception in checkResumeAlreadyAnalyzed:', error);
    
    // En cas d'erreur, on considère que le CV n'a pas été analysé pour permettre une nouvelle analyse
    return { analyzed: false };
  }
};

/**
 * Extraire le texte d'un CV à partir de son ID
 */
export const extractResumeText = async (resumeId: string, filePath: string): Promise<{ success: boolean; message?: string; text?: string }> => {
  try {
    console.log('Starting text extraction for resume:', resumeId);
    
    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for file');
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }
    
    // Appel à l'edge function d'extraction de texte
    const { data, error } = await supabase.functions.invoke('extract-cv-text', {
      body: { 
        pdfUrl: urlData.publicUrl,
        resumeId: resumeId
      }
    });
    
    if (error) {
      console.error('Error invoking extract-cv-text function:', error);
      throw new Error(`Erreur lors de l'extraction du texte: ${error.message}`);
    }
    
    if (!data || !data.success) {
      console.error('Text extraction failed:', data?.error || 'Raison inconnue');
      throw new Error(data?.error || 'Extraction du texte échouée');
    }
    
    console.log('Text extraction successful, length:', data.data?.text?.length || 0);
    
    // Vérifier que le texte extrait n'est pas vide
    if (!data.data?.text || data.data.text.trim() === '') {
      throw new Error('Le texte extrait est vide');
    }
    
    // Retourner le texte extrait
    return { 
      success: true, 
      message: "Texte extrait avec succès",
      text: data.data?.text || ''
    };
  } catch (error: any) {
    console.error('Text extraction error:', error);
    toast({
      title: "Échec de l'extraction",
      description: error.message || "Une erreur est survenue lors de l'extraction du texte",
      variant: "destructive",
    });
    return { 
      success: false, 
      message: error.message || "Échec de l'extraction du texte"
    };
  }
};

/**
 * Analyser un CV avec l'IA et créer automatiquement un candidat
 */
export const analyzeResume = async (resumeId: string, resumeText: string, overwriteExisting: boolean = false): Promise<{ success: boolean; message?: string; candidateId?: string }> => {
  try {
    console.log('Starting AI analysis for resume:', resumeId);
    
    if (!resumeText || resumeText.trim() === '') {
      throw new Error('Le texte du CV est vide ou non défini');
    }
    
    // Vérifier si le CV a déjà été analysé (si overwriteExisting est false)
    if (!overwriteExisting) {
      try {
        const { analyzed, candidateId } = await checkResumeAlreadyAnalyzed(resumeId);
        if (analyzed) {
          console.log('Resume has already been analyzed, returning existing candidateId:', candidateId);
          return { 
            success: true, 
            message: "Ce CV a déjà été analysé",
            candidateId: candidateId
          };
        }
      } catch (checkError) {
        // En cas d'erreur dans la vérification, on continue avec l'analyse
        console.warn("Error checking resume analysis status, proceeding with analysis:", checkError);
      }
    }
    
    console.log(`Text length being sent to OpenAI: ${resumeText.length} characters`);
    console.log('Sample of the text being sent:', resumeText.substring(0, 200) + '...');
    
    // Appel à l'edge function d'analyse de CV avec paramètres améliorés
    const { data, error } = await supabase.functions.invoke('resume-ai-analysis', {
      body: { 
        resumeId: resumeId,
        resumeText: resumeText,
        overwriteExisting: overwriteExisting,
        fullAnalysis: true // Indiquer qu'il faut analyser toutes les sections
      }
    });
    
    if (error) {
      console.error('Error invoking resume-ai-analysis function:', error);
      throw new Error(`Erreur lors de l'analyse du CV: ${error.message}`);
    }
    
    if (!data || !data.success) {
      console.error('Resume analysis failed:', data?.error || 'Raison inconnue');
      throw new Error(data?.error || 'Analyse du CV échouée');
    }
    
    console.log('AI analysis successful, candidate created:', data.candidate?.id);
    
    // Vérifier les structures complexes pour debugging
    if (data.candidate) {
      // Check résumé des données analysées
      console.log('Parsed data from OpenAI received:', data.parsed_data ? 'Yes' : 'No');
      
      // Vérifier les structures complexes pour debugging
      console.log('Experiences:', typeof data.candidate.experiences, Array.isArray(data.candidate.experiences) ? data.candidate.experiences.length : 'Not an array');
      console.log('Education:', typeof data.candidate.education, Array.isArray(data.candidate.education) ? data.candidate.education.length : 'Not an array');
      console.log('Skills:', typeof data.candidate.skills, Array.isArray(data.candidate.skills) ? data.candidate.skills.length : 'Not an array');
      console.log('Languages:', typeof data.candidate.languages, Array.isArray(data.candidate.languages) ? data.candidate.languages.length : 'Not an array');
      console.log('Certifications:', typeof data.candidate.certifications, Array.isArray(data.candidate.certifications) ? data.candidate.certifications.length : 'Not an array');
      console.log('Projects:', typeof data.candidate.projects, Array.isArray(data.candidate.projects) ? data.candidate.projects.length : 'Not an array');
    }
    
    const successMessage = overwriteExisting 
      ? "Le CV a été ré-analysé avec succès et les données du candidat ont été mises à jour" 
      : "Le CV a été analysé avec succès et un candidat a été créé";
    
    toast({
      title: "Analyse terminée",
      description: successMessage,
    });
    
    return { 
      success: true, 
      message: successMessage,
      candidateId: data.candidate?.id
    };
  } catch (error: any) {
    console.error('Resume analysis error:', error);
    toast({
      title: "Échec de l'analyse",
      description: error.message || "Une erreur est survenue lors de l'analyse du CV",
      variant: "destructive",
    });
    return { 
      success: false, 
      message: error.message || "Échec de l'analyse du CV"
    };
  }
};

/**
 * Exécuter l'analyse en lot de plusieurs CV
 */
export const analyzeBatchResumes = async (
  resumeItems: Array<{ resumeId: string, text: string }>,
  onProgress?: (index: number, total: number, currentResumeId: string, success: boolean) => void
): Promise<{ successCount: number; totalCount: number; failedResumes: string[] }> => {
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
        const { analyzed } = await checkResumeAlreadyAnalyzed(resumeId);
        
        // Analyser le CV (si pas déjà analysé)
        if (!analyzed) {
          if (!text || text.trim() === '') {
            console.error(`Empty text for resume ${resumeId}, skipping`);
            failedResumes.push(resumeId);
            
            // Notifier de la progression, même en cas d'erreur
            if (onProgress) {
              onProgress(i + 1, resumeItems.length, resumeId, false);
            }
            continue;
          }
          
          console.log(`Sending resume ${resumeId} to OpenAI for analysis, text length: ${text.length}`);
          const result = await analyzeResume(resumeId, text);
          
          if (result.success) {
            successCount++;
            console.log(`Successfully analyzed resume ${resumeId}`);
          } else {
            failedResumes.push(resumeId);
            console.error(`Failed to analyze resume ${resumeId}: ${result.message}`);
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

/**
 * Récupérer les données complètes d'un candidat par son ID
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData | null> => {
  try {
    console.log('Fetching complete candidate data for ID:', candidateId);
    
    // Utiliser directement la requête Supabase plutôt qu'un appel RPC pour éviter la récursion RLS
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();
    
    if (error) {
      console.error('Error fetching candidate data:', error.message);
      throw new Error(`Erreur lors de la récupération des données du candidat: ${error.message}`);
    }
    
    if (!data) {
      console.log('No candidate found with ID:', candidateId);
      return null;
    }
    
    console.log('Successfully retrieved candidate data:', data);
    
    // Type assertion to ensure compatibility with CandidateData
    return data as CandidateData;
  } catch (error: any) {
    console.error('Exception in getCompleteCandidateData:', error);
    toast({
      title: "Erreur",
      description: error.message || "Impossible de récupérer les données du candidat",
      variant: "destructive",
    });
    throw error;
  }
};
