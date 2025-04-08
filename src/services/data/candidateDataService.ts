
import { supabase } from '@/integrations/supabase/client';
import { resumeDataService } from './resumeDataService';
import { CandidateData } from '../resume/analysisOperations';
import { Json } from '@/integrations/supabase/types';

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
      
      // Utilisez la fonction RPC qui a été optimisée pour éviter la récursion
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
      
      // Transform the skills field from Json to string[] to match the CandidateData interface
      const transformedData = data.map(candidate => ({
        ...candidate,
        // Convert skills from Json to string[]
        skills: Array.isArray(candidate.skills) ? candidate.skills : 
                (typeof candidate.skills === 'string' ? [candidate.skills] : [])
      })) as CandidateData[];
      
      return transformedData;
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
      console.log("Fetching candidate by ID:", candidateId);
      
      // Utiliser la fonction RPC sécurisée qui contourne les politiques RLS
      const { data, error } = await supabase.rpc('get_candidate_by_id_secure', {
        candidate_id_param: candidateId
      });
      
      if (error) {
        console.error("Error fetching candidate using RPC:", error.message);
        
        // Fallback: essayer une requête directe si la RPC échoue
        const { data: directData, error: directError } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();
          
        if (directError) {
          console.error("Direct query also failed:", directError.message);
          throw new Error(`Erreur lors de la récupération du candidat: ${directError.message}`);
        }
        
        if (!directData) {
          return null;
        }
        
        return directData as unknown as CandidateData;
      }
      
      if (!data || data.length === 0) {
        console.log("No candidate found with ID:", candidateId);
        return null;
      }
      
      // L'API RPC retourne un tableau, prendre le premier élément
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
      // Use direct query instead of RLS-protected endpoint to avoid recursion
      const { data: candidateData, error: candidateFetchError } = await supabase
        .from('candidates')
        .select('resume_id')
        .eq('id', candidateId)
        .single();
      
      if (candidateFetchError) {
        if (candidateFetchError.message.includes('recursion')) {
          console.error("RLS recursion detected during candidate fetch, trying direct deletion");
          // Continue with deletion even if we can't fetch the candidate
        } else {
          console.error("Error fetching candidate for deletion:", candidateFetchError.message);
          throw new Error(`Erreur lors de la récupération du candidat: ${candidateFetchError.message}`);
        }
      }
      
      // Store resume_id for later use if found
      const resumeId = candidateData?.resume_id;
      
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
      if (resumeId) {
        console.log(`Associated resume found: ${resumeId}, proceeding with resume deletion`);
        
        try {
          // Récupérer le CV pour obtenir le file_path
          const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('file_path')
            .eq('id', resumeId)
            .single();
          
          if (resumeError) {
            console.error("Error fetching resume for deletion:", resumeError.message);
            // Ne pas bloquer le processus si la récupération du CV échoue
            return true;
          }
          
          if (resume && resume.file_path) {
            // Utiliser la fonction de suppression de CV qui gère à la fois le fichier et l'enregistrement
            const { deleteResume } = await import('../resume/fileOperations');
            await deleteResume(resumeId, resume.file_path);
            console.log(`Associated resume ${resumeId} deleted successfully`);
          }
        } catch (resumeDeleteError: any) {
          console.error("Error while deleting associated resume:", resumeDeleteError);
          // Le candidat a été supprimé avec succès, donc considérons l'opération comme réussie
          // même si la suppression du CV associé a échoué
          return true;
        }
      } else {
        console.log(`No associated resume found for candidate ${candidateId}, skipping resume deletion`);
      }
      
      return true;
    } catch (error: any) {
      console.error("Exception in deleteCandidate:", error);
      throw new Error(error.message || "Impossible de supprimer le candidat");
    }
  }
};
