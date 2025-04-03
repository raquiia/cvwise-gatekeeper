
import { supabase } from '@/integrations/supabase/client';
import { resumeStorageService } from '../storage/resumeStorageService';
import { Json } from '@/integrations/supabase/types';

export interface ResumeData {
  id: string;
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
      console.log('Creating resume record with data:', {
        userId,
        fileName,
        filePath,
        fileType,
        fileSize
      });
      
      // Utiliser la fonction SQL sécurisée pour insérer le CV
      const { data: resumeId, error } = await supabase.rpc('insert_resume', {
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
      
      console.log('Resume record created successfully with ID:', resumeId);
      return resumeId as string;
    } catch (error: any) {
      console.error('Error creating resume record:', error);
      throw error;
    }
  },
  
  /**
   * Récupère tous les CV d'un utilisateur
   */
  getUserResumes: async (userId: string): Promise<ResumeData[]> => {
    try {
      console.log('Fetching resumes for user:', userId);
      
      // Use direct SQL function call to avoid RLS policy recursion
      const { data, error } = await supabase.rpc('get_user_resumes', {
        user_id_param: userId
      });
      
      if (error) {
        console.error('Error fetching resumes:', error);
        throw error;
      }
      
      console.log('Fetched resumes:', data);
      
      if (!data || data.length === 0) {
        console.log('No resumes found for user:', userId);
        return [];
      }
      
      // Convert the data to the ResumeData format
      const resumesWithCandidates: ResumeData[] = data.map((resume: any) => {
        const resumeData: ResumeData = {
          id: resume.id,
          user_id: resume.user_id,
          file_name: resume.file_name,
          file_path: resume.file_path,
          file_type: resume.file_type,
          file_size: resume.file_size,
          parsed: resume.parsed || false,
          created_at: resume.created_at,
          updated_at: resume.updated_at,
          candidates: []
        };
        
        if (resume.candidates && resume.candidates.length > 0) {
          resumeData.candidates = resume.candidates as CandidateData[];
        }
        
        return resumeData;
      });
      
      return resumesWithCandidates;
    } catch (error: any) {
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
