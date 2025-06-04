import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
// Import the unified CandidateData type from candidateService
export { CandidateData } from './candidateService';

// Keep only the resume-specific types and functions here
export interface ResumeData {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
  parsed: boolean;
  user_id: string;
}

export const resumeDataService = {
  getUserResumes: async (): Promise<ResumeData[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_resumes');
      
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching resumes:', error);
      throw new Error(`Failed to get resumes: ${error.message}`);
    }
  },
  
  deleteResume: async (resumeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('delete_resume_by_id', {
        resume_id_param: resumeId
      });
      
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      throw new Error(`Failed to delete resume: ${error.message}`);
    }
  }
};
