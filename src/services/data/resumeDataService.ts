
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
  first_name: string; // Changed from optional to required
  last_name: string; // Changed from optional to required
  email?: string;
  phone?: string;
  position?: string;
  years_experience?: number;
  location?: string;
  
  // Add the missing address fields
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  
  skills?: string[] | Json; // Updated to accept both string[] and Json
  score?: number;
  status?: string;
  company?: string;
  created_at?: string;
  updated_at?: string;
  
  // Additional candidate fields for detailed view
  experiences?: {
    title?: string;
    company?: string;
    dates?: string;
    description?: string;
  }[] | Json;
  
  education?: {
    degree?: string;
    institution?: string;
    year?: string;
    description?: string;
  }[] | Json;
  
  certifications?: {
    name?: string;
    issuer?: string;
    date?: string;
  }[] | Json;
  
  languages?: {
    language?: string;
    level?: string;
  }[] | Json;
  
  publications?: {
    title?: string;
    publisher?: string;
    year?: string;
  }[] | Json;
  
  interests?: string;
  
  professional_references?: {
    name?: string;
    position?: string;
    company?: string;
    contact?: string;
  }[] | Json;
  
  availability?: string;
  salary_expectations?: string;
  mobility?: string;
  contract_type?: string;
  remote_preference?: string;
  travel_willingness?: string;
  
  professional_networks?: {
    platform?: string;
    url?: string;
  }[] | Json;
  
  continuous_training?: {
    course?: string;
    provider?: string;
    year?: string;
  }[] | Json;
  
  career_objectives?: string;
  professional_values?: string;
  work_authorization?: string;
  
  special_permits?: string[] | Json;
  industries?: string[] | Json;
  projects?: {
    name?: string;
    description?: string;
    technologies?: string[];
    role?: string;
    year?: string;
  }[] | Json;
  
  profile_completeness?: number;
  last_updated_at?: string;
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
      
      // Use the stored procedure that avoids RLS recursion
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
      
      // Explicitly cast the data to ResumeData[] with type assertion
      return data as unknown as ResumeData[];
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
