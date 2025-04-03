
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
      const { data, error } = await supabase
        .from('candidates')
        .upsert(candidateData)
        .select();
        
      if (error) throw error;
      return data[0];
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
      return data;
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
      return data;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }
};
