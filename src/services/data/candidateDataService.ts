
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from './resumeDataService';

/**
 * Helper function to ensure skills are properly parsed as arrays
 */
const processSkills = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      skills: Array.isArray(item.skills) ? item.skills : 
              (typeof item.skills === 'string' ? JSON.parse(item.skills) : [])
    }));
  }
  
  return {
    ...data,
    skills: Array.isArray(data.skills) ? data.skills : 
            (typeof data.skills === 'string' ? JSON.parse(data.skills) : [])
  };
};

/**
 * Service responsable de la gestion des données des candidats
 * Cette couche d'abstraction facilitera une migration future vers une API REST
 */
export const candidateDataService = {
  /**
   * Crée ou met à jour un candidat
   */
  saveCandidate: async (candidateData: CandidateData): Promise<CandidateData | null> => {
    try {
      // Ensure skills is an array
      const dataToSave = {
        ...candidateData,
        skills: Array.isArray(candidateData.skills) ? candidateData.skills : []
      };
      
      const { data, error } = await supabase
        .from('candidates')
        .upsert(dataToSave)
        .select();
        
      if (error) throw error;
      
      // Transform the returned data to match our expected format
      if (data && data[0]) {
        return processSkills(data[0]) as CandidateData;
      }
      
      return null;
    } catch (error) {
      console.error('Error saving candidate:', error);
      return null;
    }
  },
  
  /**
   * Récupère tous les candidats d'un utilisateur
   */
  getUserCandidates: async (userId: string): Promise<CandidateData[]> => {
    try {
      console.log('Fetching candidates for user:', userId);
      
      // Utiliser directement RPC pour appeler la fonction SQL
      const { data, error } = await supabase.rpc('get_user_candidates', {
        user_id_param: userId
      });
        
      if (error) {
        console.error('RPC error fetching candidates:', error);
        throw error;
      }
      
      console.log('Candidates data from RPC:', data);
      
      if (!data || !Array.isArray(data)) {
        console.log('No candidates returned or invalid data format');
        return [];
      }
      
      // Transformer les données pour correspondre à notre format (notamment position au lieu de job_position)
      const transformedData = data.map(candidate => ({
        ...candidate,
        position: candidate.job_position, // Remapper job_position vers position
      }));
      
      return processSkills(transformedData) as CandidateData[];
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  },
  
  /**
   * Récupère un candidat par son ID
   */
  getCandidateById: async (candidateId: string): Promise<CandidateData | null> => {
    try {
      // Utiliser la fonction RPC sécurisée pour éviter la récursion infinie dans les policies
      const { data, error } = await supabase.rpc('get_candidate_by_id', {
        candidate_id_param: candidateId
      });
        
      if (error) {
        console.error('RPC error fetching candidate by ID:', error);
        throw error;
      }
      
      console.log('Candidate data from RPC:', data);
      
      // Check if we got any data back
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No candidate found with ID:', candidateId);
        return null;
      }
      
      // Return the first result (should only be one)
      return processSkills(data[0]) as CandidateData;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }
};
