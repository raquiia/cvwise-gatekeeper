
import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from './resumeDataService';

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
        return {
          ...data[0],
          skills: Array.isArray(data[0].skills) ? data[0].skills : []
        } as CandidateData;
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
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Transform the data to match our expected format
      if (data) {
        return data.map(candidate => ({
          ...candidate,
          skills: Array.isArray(candidate.skills) ? candidate.skills : []
        })) as CandidateData[];
      }
      
      return [];
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
        return {
          ...data,
          skills: Array.isArray(data.skills) ? data.skills : []
        } as CandidateData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }
};
