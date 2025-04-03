
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
    const bucketExists = await ensureResumesBucketExists();
    
    // Even if bucket creation reported an error, try to upload anyway
    // as it might be just that the bucket already exists
    
    // Upload the file to storage
    const filePath = await resumeStorageService.uploadFile(file, userId);
    if (!filePath) {
      console.error('File upload failed');
      return null;
    }
    
    console.log('File uploaded successfully, creating database record');
    
    // Utiliser la fonction SQL sécurisée pour insérer le CV
    try {
      const { data, error } = await supabase.rpc('insert_resume', {
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
      
      // Récupérer l'enregistrement complet
      const resumeId = data;
      const { data: resumeRecord, error: fetchError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching created resume:', fetchError.message);
        return null;
      }
      
      console.log('Resume record created successfully:', resumeRecord);
      return resumeRecord as ResumeData;
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
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching resumes:', error.message);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} resumes`);
    return data as ResumeData[];
  } catch (error) {
    console.error('Exception fetching resumes:', error);
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
