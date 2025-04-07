
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
      
      // Set bucket to public
      const { error: policiesError } = await supabase.storage.from('resumes').getPublicUrl('test');
      
      if (policiesError) {
        console.error('Warning: Could not set public URL policies for bucket:', policiesError);
      }
      
      console.log('Resumes bucket created successfully');
    } else {
      console.log('Resumes bucket already exists');
    }
  } catch (error) {
    console.error('Exception during bucket creation:', error);
  }
};
