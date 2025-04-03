
import { supabase } from '@/integrations/supabase/client';
import { resumeStorageService } from '../storage/resumeStorageService';

export interface ResumeData {
  id?: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  parsed: boolean;
  created_at?: string;
  updated_at?: string;
  candidates?: CandidateData[];
}

export interface CandidateData {
  id?: string;
  resume_id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  years_experience?: number;
  location?: string;
  skills?: any[];
  score?: number;
  status?: string;
}

/**
 * Service responsable de la gestion des données des CV
 * Cette couche d'abstraction facilitera une migration future vers une API REST
 */
export const resumeDataService = {
  /**
   * Crée un enregistrement de CV dans la base de données
   */
  createResumeRecord: async (
    userId: string,
    fileName: string,
    filePath: string,
    fileType: string,
    fileSize: number
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .rpc('insert_resume', { 
          p_user_id: userId,
          p_file_name: fileName,
          p_file_path: filePath,
          p_file_type: fileType,
          p_file_size: fileSize
        });
        
      if (error) {
        console.error('Error creating resume record:', error);
        throw new Error(error.message);
      }
      
      console.log('Resume record created successfully with ID:', data);
      return data as string;
    } catch (error) {
      console.error('Error creating resume record:', error);
      return null;
    }
  },
  
  /**
   * Récupère tous les CV d'un utilisateur
   */
  getUserResumes: async (userId: string): Promise<ResumeData[]> => {
    try {
      console.log('Fetching resumes for user:', userId);
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching resumes:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} resumes`);
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Process each resume to get its candidates
      const resumesWithCandidates = await Promise.all(data.map(async (resume) => {
        try {
          const { data: candidates, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('resume_id', resume.id);
            
          if (candidateError) {
            console.error(`Error fetching candidates for resume ${resume.id}:`, candidateError);
            return { ...resume, candidates: [] };
          }
          
          return { ...resume, candidates: candidates || [] };
        } catch (error) {
          console.error(`Error processing candidates for resume ${resume.id}:`, error);
          return { ...resume, candidates: [] };
        }
      }));
      
      return resumesWithCandidates;
    } catch (error) {
      console.error('Error in getUserResumes:', error);
      return [];
    }
  },
  
  /**
   * Supprime un enregistrement de CV de la base de données
   */
  deleteResumeRecord: async (resumeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting resume record:', error);
      return false;
    }
  },
  
  /**
   * Marque un CV comme analysé
   */
  markResumeAsParsed: async (resumeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('resumes')
        .update({ parsed: true })
        .eq('id', resumeId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking resume as parsed:', error);
      return false;
    }
  }
};
