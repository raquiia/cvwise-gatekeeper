
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
    
    // Vérifier si le CV est marqué comme analysé
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('parsed')
      .eq('id', resumeId)
      .single();
    
    if (resumeError) {
      console.error('Error checking resume parsed status:', resumeError);
      throw new Error(`Erreur lors de la vérification du statut du CV: ${resumeError.message}`);
    }
    
    if (!resume.parsed) {
      return { analyzed: false };
    }
    
    // Récupérer le candidat associé à ce CV
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id')
      .eq('resume_id', resumeId)
      .single();
    
    if (candidateError && candidateError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking candidate for resume:', candidateError);
      throw new Error(`Erreur lors de la vérification du candidat: ${candidateError.message}`);
    }
    
    if (candidate) {
      return { analyzed: true, candidateId: candidate.id };
    }
    
    return { analyzed: true }; // Le CV est marqué comme analysé mais aucun candidat trouvé
  } catch (error: any) {
    console.error('Exception in checkResumeAlreadyAnalyzed:', error);
    throw error;
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
    
    console.log('Text extraction successful');
    
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
      const { analyzed, candidateId } = await checkResumeAlreadyAnalyzed(resumeId);
      if (analyzed) {
        console.log('Resume has already been analyzed, returning existing candidateId:', candidateId);
        return { 
          success: true, 
          message: "Ce CV a déjà été analysé",
          candidateId: candidateId
        };
      }
    }
    
    console.log(`Text length being sent to OpenAI: ${resumeText.length} characters`);
    console.log('Sample of the text being sent:', resumeText.substring(0, 200) + '...');
    
    // Appel à l'edge function d'analyse de CV
    const { data, error } = await supabase.functions.invoke('resume-ai-analysis', {
      body: { 
        resumeId: resumeId,
        resumeText: resumeText,
        overwriteExisting: overwriteExisting
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
      console.log('Parsed data from OpenAI:', data.parsed_data ? JSON.stringify(data.parsed_data).substring(0, 200) + '...' : 'No parsed data');
      
      // Vérifier les structures complexes pour debugging
      console.log('Experiences:', typeof data.candidate.experiences, Array.isArray(data.candidate.experiences) ? data.candidate.experiences.length : 'Not an array');
      console.log('Education:', typeof data.candidate.education, Array.isArray(data.candidate.education) ? data.candidate.education.length : 'Not an array');
      console.log('Skills:', typeof data.candidate.skills, Array.isArray(data.candidate.skills) ? data.candidate.skills.length : 'Not an array');
      console.log('Languages:', typeof data.candidate.languages, Array.isArray(data.candidate.languages) ? data.candidate.languages.length : 'Not an array');
      console.log('Certifications:', typeof data.candidate.certifications, Array.isArray(data.candidate.certifications) ? data.candidate.certifications.length : 'Not an array');
      console.log('Projects:', typeof data.candidate.projects, Array.isArray(data.candidate.projects) ? data.candidate.projects.length : 'Not an array');
      
      // Afficher un échantillon des données d'expérience si disponibles
      if (Array.isArray(data.candidate.experiences) && data.candidate.experiences.length > 0) {
        console.log('Sample experience:', JSON.stringify(data.candidate.experiences[0]));
      }
      
      // Afficher un échantillon des données d'éducation si disponibles
      if (Array.isArray(data.candidate.education) && data.candidate.education.length > 0) {
        console.log('Sample education:', JSON.stringify(data.candidate.education[0]));
      }
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
