
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
export const analyzeResume = async (resumeId: string, resumeText: string): Promise<{ success: boolean; message?: string; candidateId?: string }> => {
  try {
    console.log('Starting AI analysis for resume:', resumeId);
    
    if (!resumeText || resumeText.trim() === '') {
      throw new Error('Le texte du CV est vide ou non défini');
    }
    
    console.log(`Text length being sent to OpenAI: ${resumeText.length} characters`);
    console.log('Sample of the text being sent:', resumeText.substring(0, 200) + '...');
    
    // Appel à l'edge function d'analyse de CV
    const { data, error } = await supabase.functions.invoke('resume-ai-analysis', {
      body: { 
        resumeId: resumeId,
        resumeText: resumeText
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
      
      // Afficher un échantillon des données d'expérience si disponibles
      if (Array.isArray(data.candidate.experiences) && data.candidate.experiences.length > 0) {
        console.log('Sample experience:', JSON.stringify(data.candidate.experiences[0]));
      }
      
      // Afficher un échantillon des données d'éducation si disponibles
      if (Array.isArray(data.candidate.education) && data.candidate.education.length > 0) {
        console.log('Sample education:', JSON.stringify(data.candidate.education[0]));
      }
    }
    
    toast({
      title: "Analyse terminée",
      description: "Le CV a été analysé avec succès et un candidat a été créé",
    });
    
    return { 
      success: true, 
      message: "CV analysé avec succès",
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
