
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
    
    // Ensure bucket exists first
    const bucketExists = await ensureResumesBucketExists();
    if (!bucketExists) {
      console.error('Failed to ensure bucket exists');
      return null;
    }
    
    // Upload the file to storage first
    const filePath = await resumeStorageService.uploadFile(file, userId);
    if (!filePath) {
      console.error('File upload failed');
      return null;
    }
    
    console.log('File uploaded successfully, creating database record');
    
    // Then create a database record
    const { data: resumeRecord, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        parsed: false
      })
      .select('*')
      .single();
      
    if (dbError) {
      console.error('Database error:', dbError.message);
      // Clean up the file if database insert fails
      await resumeStorageService.deleteFile(filePath);
      return null;
    }
    
    console.log('Resume record created successfully:', resumeRecord);
    return resumeRecord as ResumeData;
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
