
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
      
      // Using a stored procedure to avoid RLS recursion error
      const { data, error } = await supabase.rpc('get_user_candidates', {
        user_id_param: userId
      });
        
      if (error) {
        console.error('RPC error fetching candidates:', error);
        throw error;
      }
      
      console.log('Candidates data from RPC:', data);
      
      // Try direct query if RPC doesn't return data
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('Falling back to direct query...');
        const { data: directData, error: directError } = await supabase
          .from('candidates')
          .select('*')
          .eq('user_id', userId);
          
        if (directError) {
          console.error('Direct query error:', directError);
          throw directError;
        }
        
        console.log('Direct query results:', directData);
        return processSkills(directData) as CandidateData[];
      }
      
      return processSkills(data) as CandidateData[];
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
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (error) throw error;
      
      // Transform the data to match our expected format
      if (data) {
        return processSkills(data) as CandidateData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }
};
