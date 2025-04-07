
import { resumeStorageService } from '../storage/resumeStorageService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Download a resume file
 */
export const downloadResume = async (filePath: string, fileName: string): Promise<boolean> => {
  try {
    console.log('Starting file download for:', filePath);
    
    // Attempt to get a public URL first
    const { data: publicUrlData, error: publicUrlError } = await supabase
      .storage
      .from('resumes')
      .createSignedUrl(filePath, 60);
    
    if (!publicUrlError && publicUrlData && publicUrlData.signedUrl) {
      console.log('Got signed URL:', publicUrlData.signedUrl);
      
      // Use the signed URL to download the file
      const response = await fetch(publicUrlData.signedUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('File downloaded successfully using signed URL');
      return true;
    } else {
      console.warn('Could not get signed URL, falling back to direct download:', publicUrlError);
      
      // Fallback to direct download if signed URL fails
      const { data, error } = await resumeStorageService.downloadFile(filePath);
      
      if (error || !data) {
        console.error('Download error:', error);
        throw new Error(error?.message || 'Failed to download file');
      }
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('File downloaded successfully using direct download');
      return true;
    }
  } catch (error: any) {
    console.error('Error downloading resume:', error);
    throw error;
  }
};

/**
 * Delete a resume and its associated candidates
 */
export const deleteResume = async (resumeId: string, filePath: string): Promise<boolean> => {
  try {
    console.log('Deleting resume record, associated candidates, and file:', { resumeId, filePath });
    
    // 1. Supprimer d'abord les candidats associés à ce CV
    try {
      const { error: candidatesError } = await supabase
        .from('candidates')
        .delete()
        .eq('resume_id', resumeId);
      
      if (candidatesError) {
        console.error('Error deleting associated candidates:', candidatesError.message);
        // Continue despite errors with candidates deletion
      } else {
        console.log(`Successfully deleted candidates associated with resume ${resumeId}`);
      }
    } catch (candidateDeleteError) {
      console.error('Exception when deleting associated candidates:', candidateDeleteError);
      // Continue despite errors with candidates deletion
    }
    
    // 2. Utiliser une procédure RPC sécurisée pour supprimer le CV
    try {
      const { error } = await supabase.rpc('delete_resume_by_id', {
        resume_id_param: resumeId
      });
      
      if (error) {
        console.error('Error deleting resume record:', error.message);
        throw new Error(`Erreur lors de la suppression du CV: ${error.message}`);
      }
    } catch (resumeDeleteError) {
      console.error('Exception when deleting resume record:', resumeDeleteError);
      throw resumeDeleteError;
    }
    
    // 3. Supprimer le fichier de stockage
    try {
      await resumeStorageService.deleteFile(filePath);
      console.log(`Successfully deleted resume file: ${filePath}`);
    } catch (storageError: any) {
      console.error('Error deleting resume file:', storageError);
      // Continue despite errors with file deletion
    }
    
    return true;
  } catch (error: any) {
    console.error('Exception deleting resume:', error);
    throw error;
  }
};
