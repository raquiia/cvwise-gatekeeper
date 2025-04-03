
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service responsable de la gestion du stockage des CV
 */
export const resumeStorageService = {
  /**
   * Télécharge un fichier CV dans le bucket de stockage
   */
  uploadFile: async (file: File, userId: string): Promise<{ filePath: string; fileName: string; fileType: string; fileSize: number } | null> => {
    try {
      // Vérifier que le type de fichier est supporté
      const validTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain',
        'application/rtf',
        'text/rtf'
      ];
      
      if (!validTypes.includes(file.type)) {
        throw new Error(`Type de fichier non supporté: ${file.type}`);
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error(`Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`);
      }
      
      const fileExt = file.name.split('.').pop() || 'pdf';
      const uniqueFileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${uniqueFileName}`;
      
      console.log('Téléchargement du fichier vers le stockage:', filePath);
      
      // Convertir le fichier en ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Télécharger le fichier
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true
        });
        
      if (error) {
        console.error('Erreur de téléchargement:', error);
        return null;
      }
      
      return {
        filePath,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };
    } catch (error: any) {
      console.error('Échec du téléchargement du fichier:', error);
      return null;
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
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  },
  
  /**
   * Télécharge un fichier CV du bucket de stockage
   */
  downloadFile: async (filePath: string): Promise<Blob | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filePath);
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
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
        
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL du fichier:', error);
      return null;
    }
  }
};
