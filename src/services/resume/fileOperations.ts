
import { resumeStorageService } from '../storage/resumeStorageService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Download a resume file
 */
export const downloadResume = async (filePath: string, fileName: string): Promise<boolean> => {
  try {
    console.log('Starting file download for:', filePath);
    
    // Get the public URL
    const { data } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
      
    if (data && data.publicUrl) {
      try {
        console.log('Using public URL for download:', data.publicUrl);
        const response = await fetch(data.publicUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
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
        
        console.log('File downloaded successfully using public URL');
        return true;
      } catch (error) {
        console.error('Error downloading file via public URL:', error);
      }
    }
    
    // Fallback to direct download if public URL failed
    console.log('Falling back to direct download method');
    
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath);
      
    if (downloadError || !downloadData) {
      console.error('Direct download failed:', downloadError);
      throw new Error(downloadError?.message || 'Failed to download file');
    }
    
    // Create a download link
    const url = URL.createObjectURL(downloadData);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('File downloaded successfully using direct download');
    return true;
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
        
        // Fallback to direct delete if RPC fails
        if (error.message.includes('recursion') || error.message.includes('not found')) {
          console.log('Falling back to direct resume deletion');
          const { error: directDeleteError } = await supabase
            .from('resumes')
            .delete()
            .eq('id', resumeId);
            
          if (directDeleteError) {
            console.error('Error in direct resume deletion:', directDeleteError.message);
            throw new Error(`Erreur lors de la suppression directe du CV: ${directDeleteError.message}`);
          }
        } else {
          throw new Error(`Erreur lors de la suppression du CV: ${error.message}`);
        }
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
