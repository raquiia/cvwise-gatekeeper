
import { v4 as uuidv4 } from 'uuid';
import { resumeStorageService } from './storage/resumeStorageService';
import { supabase } from '@/integrations/supabase/client';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

// Re-export des interfaces
import type { ResumeData, CandidateData } from './data/resumeDataService';
export type { ResumeData, CandidateData };

/**
 * Upload a resume file and create a database record
 */
export const uploadResume = async (file: File, userId: string): Promise<ResumeData | null> => {
  try {
    console.log(`Starting upload for ${file.name} (${file.size} bytes)`);
    
    // Ensure bucket exists first, but don't stop the flow if it already exists
    await ensureResumesBucketExists();
    
    // Upload the file to storage
    const filePath = await resumeStorageService.uploadFile(file, userId);
    if (!filePath) {
      console.error('File upload failed');
      return null;
    }
    
    console.log('File uploaded successfully, creating database record');
    
    // Utiliser la fonction SQL sécurisée pour insérer le CV
    try {
      const { data: resumeId, error } = await supabase.rpc('insert_resume', {
        p_user_id: userId,
        p_file_name: file.name,
        p_file_path: filePath,
        p_file_type: file.type,
        p_file_size: file.size
      });
      
      if (error) {
        console.error('Database error:', error.message);
        // Nettoyer le fichier si l'insertion dans la base de données échoue
        // Mais ne pas bloquer en cas d'erreur lors de la suppression
        try {
          await resumeStorageService.deleteFile(filePath);
        } catch (cleanupError) {
          console.warn('Could not clean up file after DB error:', cleanupError);
        }
        return null;
      }
      
      // Au lieu d'essayer de récupérer immédiatement depuis la base de données,
      // construisons simplement l'objet manuellement pour éviter l'erreur de récursion
      const resumeData: ResumeData = {
        id: resumeId as string,
        user_id: userId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        parsed: false,
        created_at: new Date().toISOString(),
        candidates: []
      };
      
      console.log('Resume record created successfully:', resumeData);
      return resumeData;
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Nettoyer en cas d'erreur
      await resumeStorageService.deleteFile(filePath);
      return null;
    }
  } catch (error: any) {
    console.error('Exception during resume upload:', error.message);
    return null;
  }
};

/**
 * Get all resumes for a user
 */
export const getUserResumes = async (userId: string): Promise<ResumeData[]> => {
  try {
    console.log('Fetching resumes for user:', userId);
    
    // Use direct SQL function call to avoid RLS policy recursion
    const { data, error } = await supabase.rpc('get_user_resumes', {
      user_id_param: userId
    });
    
    if (error) {
      console.error('Error fetching resumes:', error.message);
      throw error;
    }
    
    console.log('Successfully fetched resumes:', data);
    
    if (!data || data.length === 0) {
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
  } catch (error) {
    console.error('Error in getUserResumes:', error);
    // En cas d'erreur, retourner un tableau vide mais ne pas bloquer l'interface
    return [];
  }
};

/**
 * Delete a resume and its file
 */
export const deleteResume = async (resumeId: string, filePath: string): Promise<boolean> => {
  try {
    // Delete the database record first
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
      
    if (error) {
      console.error('Error deleting resume record:', error.message);
      return false;
    }
    
    // Then delete the file
    await resumeStorageService.deleteFile(filePath);
    return true;
  } catch (error) {
    console.error('Exception deleting resume:', error);
    return false;
  }
};

// Re-export des services existants
export { resumeAnalysisService } from './analysis/resumeAnalysisService';
export { candidateDataService } from './data/candidateDataService';
