
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const resumeStorageService = {
  uploadFile: async (file: File, userId: string): Promise<string | null> => {
    try {
      // Génération d'un nom de fichier unique
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Upload direct sans vérifications complexes
      const { error } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);
        
      if (error) {
        console.error('Erreur upload:', error.message);
        return null;
      }
      
      return filePath;
    } catch (error) {
      console.error('Exception upload:', error);
      return null;
    }
  },
  
  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      await supabase.storage.from('resumes').remove([filePath]);
      return true;
    } catch (error) {
      console.error('Erreur suppression:', error);
      return false;
    }
  },
  
  getFileUrl: async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Erreur URL:', error);
      return null;
    }
  }
};
