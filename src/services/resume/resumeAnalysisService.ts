
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { checkResumeAlreadyAnalyzed } from './resumeValidationService';

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
    
    console.log('AI analysis successful, candidate created or updated:', data.candidate?.id);
    
    // Vérifier les structures de données retournées
    if (data.candidate) {
      // Vérifier chaque section importante pour le débogage
      console.log('Experiences:', typeof data.candidate.experiences, 
        Array.isArray(data.candidate.experiences) ? 
        `Array with ${data.candidate.experiences.length} items` : 
        'Not an array or empty');
      
      console.log('Education:', typeof data.candidate.education, 
        Array.isArray(data.candidate.education) ? 
        `Array with ${data.candidate.education.length} items` : 
        'Not an array or empty');
      
      console.log('Languages:', typeof data.candidate.languages, 
        Array.isArray(data.candidate.languages) ? 
        `Array with ${data.candidate.languages.length} items` : 
        'Not an array or empty');
      
      console.log('Skills:', typeof data.candidate.skills, 
        Array.isArray(data.candidate.skills) ? 
        `Array with ${data.candidate.skills.length} items` : 
        'Not an array or empty');
      
      console.log('Certifications:', typeof data.candidate.certifications, 
        Array.isArray(data.candidate.certifications) ? 
        `Array with ${data.candidate.certifications.length} items` : 
        'Not an array or empty');
    } else {
      console.warn('No candidate data returned from analysis');
    }
    
    // Message de succès différent selon que l'on a écrasé ou créé
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
