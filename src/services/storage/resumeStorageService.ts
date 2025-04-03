
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

export const resumeStorageService = {
  uploadFile: async (file: File, userId: string): Promise<string | null> => {
    try {
      // Vérifier que le bucket existe
      await ensureResumesBucketExists();
      
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      console.log(`Uploading file to ${filePath}`);
      
      // Essayer de télécharger le fichier avec retry
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { error } = await supabase.storage
            .from('resumes')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (error) {
            // Vérifier si l'erreur est due au fait que le bucket n'existe pas
            if (error.message.includes('bucket') && retryCount === 0) {
              console.log('Bucket might not exist yet, continuing attempt...');
              retryCount++;
              // Attendre un court instant avant de réessayer
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            
            if (retryCount === maxRetries - 1) {
              console.error('Upload error after retries:', error.message);
              return null;
            }
            
            console.log(`Retry ${retryCount + 1}/${maxRetries} due to error: ${error.message}`);
            retryCount++;
            // Attendre un court instant avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount)));
            continue;
          }
          
          console.log('File uploaded successfully');
          return filePath;
        } catch (e) {
          console.error('Exception during upload attempt:', e);
          retryCount++;
          
          if (retryCount === maxRetries) {
            return null;
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount)));
        }
      }
      
      return null;
    } catch (error) {
      console.error('Exception during upload:', error);
      return null;
    }
  },
  
  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('resumes')
        .remove([filePath]);
        
      if (error) {
        console.error('File deletion error:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception during file deletion:', error);
      // Ne pas bloquer le flux de l'application en cas d'échec de suppression
      return true;
    }
  },
  
  getFileUrl: async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  },
  
  downloadFile: async (filePath: string): Promise<{ data: Blob | null; error: Error | null }> => {
    try {
      // First ensure the bucket exists
      await ensureResumesBucketExists();
      
      console.log('Downloading file:', filePath);
      
      // Try to download the file with retry
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase.storage
            .from('resumes')
            .download(filePath);
            
          if (error) {
            console.error(`Download attempt ${retryCount + 1} failed:`, error.message);
            
            if (retryCount === maxRetries - 1) {
              return { data: null, error: new Error(`Failed to download file: ${error.message}`) };
            }
            
            retryCount++;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          
          console.log('File downloaded successfully');
          return { data, error: null };
        } catch (e: any) {
          console.error('Exception during download attempt:', e);
          
          if (retryCount === maxRetries - 1) {
            return { data: null, error: e };
          }
          
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      return { data: null, error: new Error('Failed to download file after multiple attempts') };
    } catch (error: any) {
      console.error('Exception during download:', error);
      return { data: null, error };
    }
  }
};
