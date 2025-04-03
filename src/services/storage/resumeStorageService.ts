
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service responsable de la gestion du stockage des CV
 * Cette couche d'abstraction facilitera une migration future vers AWS S3
 */
export const resumeStorageService = {
  /**
   * Télécharge un fichier CV dans le bucket de stockage
   */
  uploadFile: async (file: File, userId: string): Promise<{ filePath: string; fileName: string; fileType: string; fileSize: number } | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const uniqueFileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${uniqueFileName}`;
      
      console.log('Uploading file to storage:', filePath);
      
      // Vérifier que le type de fichier est supporté
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Type de fichier non supporté: ${file.type}`);
      }
      
      // Convertir le fichier en ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Tentative d'upload direct
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true
        });
        
      if (error) {
        console.error('Error uploading file to storage:', error);
        throw new Error(`Erreur lors du téléchargement: ${error.message}`);
      }
      
      console.log('File uploaded successfully:', data);
      
      return {
        filePath,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };
    } catch (error: any) {
      console.error('File upload failed:', error);
      throw error; // Propager l'erreur pour une meilleure gestion
    }
  },
  
  /**
   * Supprime un fichier CV du bucket de stockage
   */
  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('resumes')
        .remove([filePath]);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      return false;
    }
  },
  
  /**
   * Télécharge un fichier CV du bucket de stockage
   */
  downloadFile: async (filePath: string): Promise<Blob | null> => {
    try {
      console.log('Downloading file:', filePath);
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filePath);
        
      if (error) {
        console.error('Download error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data received during download');
      }
      
      return data;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  },
  
  /**
   * Récupère l'URL publique d'un fichier CV
   */
  getFileUrl: async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 3600); // URL valide 1 heure
        
      if (error) {
        console.error('Error getting file URL:', error);
        throw error;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }
};
