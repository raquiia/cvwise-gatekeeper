
import { resumeStorageService } from '../storage/resumeStorageService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Download a resume file
 */
export const downloadResume = async (filePath: string, fileName: string): Promise<boolean> => {
  try {
    console.log('Starting file download for:', filePath);
    
    // Force bucket creation to ensure it exists
    await supabase.storage.createBucket('resumes', {
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    }).catch(err => {
      // Ignore "bucket already exists" errors
      if (!err.message?.includes('already exists')) {
        console.warn('Bucket creation warning:', err.message);
      }
    });
    
    // Try to get the file directly from public URL first
    try {
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
        
      if (data && data.publicUrl) {
        console.log('Using public URL download path');
        const response = await fetch(data.publicUrl);
        
        if (!response.ok) {
          console.warn(`Public URL fetch failed with status: ${response.status}`);
          throw new Error('Public URL fetch failed');
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
      }
    } catch (publicUrlError) {
      console.warn('Public URL method failed, trying signed URL approach:', publicUrlError);
    }
    
    // Try signed URL approach
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60);
      
      if (!signedError && signedData && signedData.signedUrl) {
        console.log('Using signed URL download path');
        const response = await fetch(signedData.signedUrl);
        
        if (!response.ok) {
          console.warn(`Signed URL fetch failed with status: ${response.status}`);
          throw new Error(`Signed URL fetch failed: ${response.status}`);
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
      }
    } catch (signedUrlError) {
      console.warn('Signed URL method failed, trying direct download:', signedUrlError);
    }
    
    // Last resort: try direct download
    console.log('Attempting direct storage download as last resort');
    const { data, error } = await supabase.storage
      .from('resumes')
      .download(filePath);
      
    if (error || !data) {
      console.error('All download methods failed. Final error:', error);
      throw new Error(error?.message || 'Failed to download file after all attempts');
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
