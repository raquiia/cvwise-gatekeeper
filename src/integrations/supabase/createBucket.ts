
import { supabase } from './client';

/**
 * Ensures that the 'resumes' bucket exists in Supabase storage
 */
export const ensureResumesBucketExists = async (): Promise<void> => {
  try {
    console.log('Checking if resumes bucket exists...');
    
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'resumes');
    
    if (bucketExists) {
      console.log('Resumes bucket already exists');
      return;
    }
    
    console.log('Creating resumes bucket...');
    
    // Create the bucket since it does not exist
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
      console.error('Error creating resumes bucket:', error);
      throw error;
    }
    
    console.log('Resumes bucket created successfully');
  } catch (error) {
    console.error('Error in ensureResumesBucketExists:', error);
    // Don't throw - we want the application to continue even if bucket creation fails
  }
};
