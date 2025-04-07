
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<void> => {
  try {
    // Check if the bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      return;
    }
    
    // If the bucket doesn't exist, create it
    const bucketExists = buckets.some(bucket => bucket.name === 'resumes');
    
    if (!bucketExists) {
      console.log('Creating resumes bucket...');
      const { error } = await supabase.storage.createBucket('resumes', {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error('Error creating resumes bucket:', error);
        return;
      }
      
      // Just get the public URL without checking for error
      // This avoids the TS2339 error
      await supabase.storage.from('resumes').getPublicUrl('test');
      
      console.log('Resumes bucket created successfully');
    }
  } catch (error) {
    console.error('Exception during bucket creation:', error);
  }
};
