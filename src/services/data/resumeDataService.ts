
import { supabase } from '@/integrations/supabase/client';
import { resumeStorageService } from '../storage/resumeStorageService';
import { Json } from '@/integrations/supabase/types';

export interface ResumeData {
  id: string; // Make this required instead of optional
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
  skills?: any[]; // This needs to stay as any[] for compatibility
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
      
      // Utiliser une requête simplifiée sans jointure complexe pour éviter les erreurs RLS
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching resumes:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} resumes:`, data);
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Transformer les données pour correspondre à notre type ResumeData
      const resumesWithCandidates: ResumeData[] = await Promise.all(data.map(async (resume) => {
        // S'assurer que chaque CV a un ID string
        const resumeData: ResumeData = {
          id: resume.id as string,
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
        
        try {
          const { data: candidates, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('resume_id', resume.id);
            
          if (candidateError) {
            console.error(`Error fetching candidates for resume ${resume.id}:`, candidateError);
            return resumeData;
          }
          
          // Transformer les candidats pour s'assurer que les skills sont un tableau
          if (candidates && candidates.length > 0) {
            resumeData.candidates = candidates.map(candidate => ({
              id: candidate.id,
              resume_id: candidate.resume_id,
              user_id: candidate.user_id,
              first_name: candidate.first_name,
              last_name: candidate.last_name,
              email: candidate.email,
              phone: candidate.phone,
              position: candidate.position,
              years_experience: candidate.years_experience,
              location: candidate.location,
              skills: Array.isArray(candidate.skills) ? candidate.skills : [],
              score: candidate.score,
              status: candidate.status
            }));
          }
          
          return resumeData;
        } catch (error) {
          console.error(`Error processing candidates for resume ${resume.id}:`, error);
          return resumeData;
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
