
import { supabase } from '@/integrations/supabase/client';

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
