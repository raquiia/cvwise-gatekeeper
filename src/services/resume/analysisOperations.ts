
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
    
    // Utiliser une approche qui évite la récursion infinie dans les RLS policies
    // Au lieu d'utiliser directement supabase.from('resumes').select()...
    const { data: resumeData, error: resumeError } = await supabase
      .rpc('get_resume_by_id', { p_resume_id: resumeId });
    
    if (resumeError) {
      console.error('Error fetching resume details:', resumeError);
      throw new Error(resumeError.message);
    }
    
    // Vérifier si la requête a retourné des résultats
    if (!resumeData || resumeData.length === 0) {
      console.error('No resume found with ID:', resumeId);
      throw new Error('CV introuvable');
    }
    
    const resume = resumeData[0];
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
