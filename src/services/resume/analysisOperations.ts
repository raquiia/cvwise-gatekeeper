
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
    
    // Récupérer les informations du CV
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (error) {
      console.error('Error fetching resume details:', error);
      throw new Error(error.message);
    }
    
    if (!resume) {
      throw new Error('CV introuvable');
    }
    
    console.log('Resume found, proceeding with analysis');
    
    // Appeler directement le service d'analyse avec l'ID du CV
    // Le Edge Function s'occupera de l'extraction et de l'analyse du contenu
    const analysisResult = await resumeAnalysisService.analyzeResume(resumeId);
    
    if (!analysisResult.success) {
      throw new Error(analysisResult.message || 'Échec de l\'analyse du CV');
    }
    
    console.log('Resume analyzed successfully:', analysisResult);
    
    // Marquer le CV comme analysé
    await resumeDataService.markResumeAsParsed(resumeId);
    
    console.log('Resume marked as parsed');
    
    return { 
      success: true, 
      message: 'Analyse terminée avec succès',
      candidateId: analysisResult.candidateId
    };
  } catch (error: any) {
    console.error('Error in analyzeResume:', error);
    return { 
      success: false, 
      message: error.message || 'Une erreur est survenue lors de l\'analyse du CV' 
    };
  }
};
