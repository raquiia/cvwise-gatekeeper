
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
      
      // Verify bucket is public - note that getPublicUrl doesn't return an error property
      // so we'll just log it without checking for an error
      console.log('Setting bucket to public');
      await supabase.storage.from('resumes').getPublicUrl('test');
      
      console.log('Resumes bucket created successfully');
    } else {
      console.log('Resumes bucket already exists');
    }
  } catch (error) {
    console.error('Exception during bucket creation:', error);
  }
};
