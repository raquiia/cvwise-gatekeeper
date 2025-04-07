
import { supabase } from '@/integrations/supabase/client';
import { resumeDataService } from './resumeDataService';
import { CandidateData } from './resumeDataService';

/**
 * Service responsable de la gestion des données des candidats
 */
export const candidateDataService = {
  /**
   * Récupérer tous les candidats d'un utilisateur
   */
  getUserCandidates: async (userId: string): Promise<CandidateData[]> => {
    try {
      console.log("Fetching candidates for user:", userId);
      
      const { data, error } = await supabase.rpc('get_user_candidates', {
        user_id_param: userId
      });
      
      if (error) {
        console.error("Error fetching candidates:", error.message);
        throw new Error(`Erreur lors de la récupération des candidats: ${error.message}`);
      }
      
      if (!data) {
        console.log("No candidates found for user:", userId);
        return [];
      }
      
      console.log(`Retrieved ${data.length} candidates`);
      return data;
    } catch (error: any) {
      console.error("Exception in getUserCandidates:", error);
      throw new Error(error.message || "Impossible de récupérer les candidats");
    }
  },
  
  /**
   * Récupérer un candidat par son ID
   */
  getCandidateById: async (candidateId: string): Promise<CandidateData | null> => {
    try {
      const { data, error } = await supabase.rpc('get_candidate_by_id', {
        candidate_id_param: candidateId
      });
      
      if (error) {
        console.error("Error fetching candidate:", error.message);
        throw new Error(`Erreur lors de la récupération du candidat: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      return data[0] as unknown as CandidateData;
    } catch (error: any) {
      console.error("Exception in getCandidateById:", error);
      throw new Error(error.message || "Impossible de récupérer le candidat");
    }
  },
  
  /**
   * Supprimer un candidat par son ID et le CV associé
   */
  deleteCandidate: async (candidateId: string): Promise<boolean> => {
    try {
      console.log(`Starting deletion of candidate with ID: ${candidateId}`);
      
      // 1. Récupérer d'abord le candidat pour obtenir le resume_id
      const { data: candidate, error: fetchError } = await supabase
        .from('candidates')
        .select('resume_id')
        .eq('id', candidateId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching candidate for deletion:", fetchError.message);
        throw new Error(`Erreur lors de la récupération du candidat: ${fetchError.message}`);
      }
      
      // 2. Supprimer le candidat
      const { error: deleteError } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);
      
      if (deleteError) {
        console.error("Error deleting candidate:", deleteError.message);
        throw new Error(`Erreur lors de la suppression du candidat: ${deleteError.message}`);
      }
      
      console.log(`Candidate ${candidateId} deleted successfully`);
      
      // 3. Si le candidat avait un resume_id, supprimer également le CV
      if (candidate && candidate.resume_id) {
        console.log(`Associated resume found: ${candidate.resume_id}, proceeding with resume deletion`);
        
        // Récupérer le CV pour obtenir le file_path
        const { data: resume, error: resumeError } = await supabase
          .from('resumes')
          .select('file_path')
          .eq('id', candidate.resume_id)
          .single();
        
        if (resumeError) {
          console.error("Error fetching resume for deletion:", resumeError.message);
          // Ne pas bloquer le processus si la récupération du CV échoue
          return true;
        }
        
        if (resume && resume.file_path) {
          // Utiliser la fonction de suppression de CV qui gère à la fois le fichier et l'enregistrement
          const { deleteResume } = await import('../resume/fileOperations');
          await deleteResume(candidate.resume_id, resume.file_path);
          console.log(`Associated resume ${candidate.resume_id} deleted successfully`);
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Exception in deleteCandidate:", error);
      throw new Error(error.message || "Impossible de supprimer le candidat");
    }
  }
};
