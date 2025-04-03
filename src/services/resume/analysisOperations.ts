
import { supabase } from '@/integrations/supabase/client';

/**
 * Analyse un CV pour extraire des informations et créer un candidat
 */
export const analyzeResume = async (resumeId: string): Promise<{ success: boolean; message?: string; candidateId?: string }> => {
  try {
    console.log(`Triggering analysis for resume ID: ${resumeId}`);
    
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: { 
        resumeId,
        extractDetails: true  // Signal to extract detailed information
      }
    });
    
    if (error) {
      console.error('Error calling analyze-resume function:', error);
      throw error;
    }
    
    console.log('Analysis response:', data);
    
    if (data.success) {
      return { 
        success: true, 
        candidateId: data.candidate?.id 
      };
    } else {
      return { 
        success: false, 
        message: data.message || "Une erreur inconnue s'est produite" 
      };
    }
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    return { 
      success: false, 
      message: error.message || "Une erreur s'est produite lors de l'analyse du CV" 
    };
  }
};
