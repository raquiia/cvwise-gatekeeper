
import { supabase } from '@/integrations/supabase/client';

/**
 * Service responsable de l'analyse des CV
 * Cette couche d'abstraction facilitera une migration future vers une API REST
 */
export const resumeAnalysisService = {
  /**
   * Déclenche l'analyse d'un CV
   */
  analyzeResume: async (resumeId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeId }
      });
      
      if (error) throw error;
      
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      return { 
        success: false, 
        message: error.message || "Une erreur s'est produite lors de l'analyse du CV" 
      };
    }
  }
};
