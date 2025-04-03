import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

export const resumeStorageService = {
  uploadFile: async (file: File, userId: string): Promise<string | null> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      console.log(`Uploading file to ${filePath}`);
      
      // Upload the file
      const { error } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error('Upload error:', error.message);
        return null;
      }
      
      console.log('File uploaded successfully');
      return filePath;
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
      console.error('Error getting file URL:', error);
      return null;
    }
  }
};
