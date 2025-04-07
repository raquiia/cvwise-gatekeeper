
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

/**
 * Service pour gérer le stockage des CV
 */
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
      // Première méthode: URL publique standard
      const { data } = await supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
        
      if (data && data.publicUrl) {
        console.log('Got public URL successfully:', data.publicUrl.substring(0, 50) + '...');
        return data.publicUrl;
      }
      
      // Seconde méthode: URL signée (fallback)
      console.log('Public URL not available, trying signed URL');
      const { data: signedData, error: signedError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60 * 15); // 15 minutes
      
      if (signedError) {
        console.error('Error getting signed URL:', signedError);
        return null;
      }
      
      if (signedData && signedData.signedUrl) {
        console.log('Got signed URL successfully:', signedData.signedUrl.substring(0, 50) + '...');
        return signedData.signedUrl;
      }
      
      console.error('Could not get any URL for file');
      return null;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  },
  
  downloadFile: async (filePath: string): Promise<{ data: Blob | null; error: Error | null }> => {
    try {
      console.log('Starting download process for:', filePath);
      
      // First get the public URL
      const publicUrl = await resumeStorageService.getFileUrl(filePath);
      if (!publicUrl) {
        return { data: null, error: new Error('Failed to get public URL for the file') };
      }
      
      console.log('Got URL for download:', publicUrl.substring(0, 50) + '...');
      
      // Try to download directly using fetch with retries
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Download attempt ${attempts}/${maxAttempts}`);
          
          const response = await fetch(publicUrl, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
          });
          
          if (!response.ok) {
            console.warn(`HTTP error! Status: ${response.status}`);
            if (attempts < maxAttempts) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log('Successfully downloaded file via URL, size:', blob.size);
          return { data: blob, error: null };
        } catch (fetchError) {
          console.error(`Error downloading via URL (attempt ${attempts}):`, fetchError);
          
          if (attempts < maxAttempts) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          // Fallback to storage API after all attempts failed
          break;
        }
      }
      
      // Fallback to storage API
      console.log('Falling back to storage API download...');
      try {
        // Ensure bucket exists
        await ensureResumesBucketExists();
        
        const { data, error } = await supabase.storage
          .from('resumes')
          .download(filePath);
          
        if (error) {
          console.error('Storage API download error:', error);
          return { data: null, error: new Error(`Storage API download failed: ${error.message}`) };
        }
        
        if (!data) {
          return { data: null, error: new Error('No data received from Storage API') };
        }
        
        console.log('Successfully downloaded file via Storage API');
        return { data, error: null };
      } catch (storageError) {
        console.error('Exception during Storage API download:', storageError);
        return { 
          data: null, 
          error: new Error(`Storage API download exception: ${storageError instanceof Error ? storageError.message : String(storageError)}`) 
        };
      }
    } catch (error) {
      console.error('Top-level exception during download process:', error);
      return { 
        data: null, 
        error: new Error(`Download process failed: ${error instanceof Error ? error.message : String(error)}`) 
      };
    }
  },
  
  /**
   * Télécharge un CV depuis le stockage et le renvoie sous forme de fichier
   * @param resumeId L'ID du CV à télécharger
   * @returns Le fichier du CV ou null en cas d'erreur
   */
  downloadResumeAsFile: async (resumeId: string): Promise<File | null> => {
    try {
      // Récupérer les données du CV
      const { data: resumeData, error: resumeError } = await supabase
        .rpc('get_resume_by_id', { p_resume_id: resumeId });
        
      if (resumeError || !resumeData || resumeData.length === 0) {
        console.error('Error fetching resume for file download:', resumeError);
        throw new Error('CV introuvable');
      }
      
      const resume = resumeData[0];
      console.log('Found resume, downloading file:', resume.file_path);
      
      // Essayer d'abord avec l'API fetch via l'URL publique
      try {
        const fileUrl = await resumeStorageService.getFileUrl(resume.file_path);
        
        if (fileUrl) {
          console.log('Got URL for direct download:', fileUrl.substring(0, 50) + '...');
          
          const response = await fetch(fileUrl, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
          });
          
          if (response.ok) {
            const blob = await response.blob();
            console.log('Direct download successful, size:', blob.size);
            
            const file = new File([blob], resume.file_name, { 
              type: resume.file_type 
            });
            
            return file;
          } else {
            console.warn('Direct download failed, status:', response.status);
          }
        }
      } catch (urlError) {
        console.warn('Error downloading via URL, falling back to storage API:', urlError);
      }
      
      // Fallback à la méthode storage si l'URL échoue
      console.log('Falling back to storage API for file download');
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(resume.file_path);
        
      if (error) {
        console.error('Storage API download error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data received from Storage API');
      }
      
      console.log('Storage API download successful');
      
      // Convertir le blob en File
      const file = new File([data], resume.file_name, { 
        type: resume.file_type 
      });
      
      return file;
    } catch (error) {
      console.error('Error downloading resume as file:', error);
      return null;
    }
  },
};
