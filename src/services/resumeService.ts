
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ResumeData {
  id?: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  parsed: boolean;
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

// Upload a resume file to storage
export const uploadResume = async (file: File, userId: string): Promise<ResumeData | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  
  console.log('Uploading file to storage:', filePath);
  
  try {
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      throw new Error(uploadError.message);
    }
    
    console.log('File uploaded successfully, creating resume record');
    
    // Create resume record in database
    const resumeData: ResumeData = {
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      parsed: false
    };
    
    // Utiliser une insertion directe avec SQL plutôt que l'API pour contourner l'erreur de récursion
    const { data, error } = await supabase
      .rpc('insert_resume', { 
        p_user_id: userId,
        p_file_name: file.name,
        p_file_path: filePath,
        p_file_type: file.type,
        p_file_size: file.size
      });
      
    if (error) {
      console.error('Error creating resume record:', error);
      
      // Si l'insertion échoue, supprimer le fichier téléchargé pour nettoyer
      await supabase.storage
        .from('resumes')
        .remove([filePath]);
        
      throw new Error(error.message);
    }
    
    console.log('Resume record created successfully:', data);
    return {
      ...resumeData,
      id: data
    };
  } catch (error: any) {
    console.error('Resume upload failed:', error);
    return null;
  }
};

// Fetch all resumes for a user
export const getUserResumes = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select(`
        *,
        candidates(*)
      `)
      .eq('user_id', userId);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return [];
  }
};

// Delete a resume
export const deleteResume = async (resumeId: string, filePath: string) => {
  try {
    // Delete resume record
    const { error: deleteRecordError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
      
    if (deleteRecordError) throw deleteRecordError;
    
    // Delete file from storage
    const { error: deleteFileError } = await supabase.storage
      .from('resumes')
      .remove([filePath]);
      
    if (deleteFileError) throw deleteFileError;
    
    return true;
  } catch (error) {
    console.error('Error deleting resume:', error);
    return false;
  }
};

// Create or update a candidate from resume data
export const saveCandidate = async (candidateData: CandidateData) => {
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
};

// Get candidates for a user
export const getUserCandidates = async (userId: string) => {
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
};
