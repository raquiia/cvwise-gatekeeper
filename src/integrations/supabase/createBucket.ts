
import { supabase } from './client';

/**
 * Ensures that the 'resumes' bucket exists in Supabase storage
 */
export const ensureResumesBucketExists = async (): Promise<void> => {
  try {
    console.log('Creating resumes bucket...');
    
    // Try to create the bucket (will fail silently if it already exists)
    const { error } = await supabase.storage.createBucket('resumes', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Resumes bucket already exists');
        
        // Make sure bucket is public
        await supabase.storage.updateBucket('resumes', {
          public: true
        }).catch(err => {
          console.warn('Failed to update bucket visibility:', err);
        });
        
        return;
      }
      
      console.error('Error creating resumes bucket:', error);
      throw error;
    }
    
    console.log('Resumes bucket created successfully');
  } catch (error) {
    console.error('Error creating resumes bucket:', error);
    // Don't throw - we want the application to continue even if bucket creation fails
  }
};
