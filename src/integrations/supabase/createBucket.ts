
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return false;
    }
    
    // If bucket already exists, return success
    if (buckets?.some(bucket => bucket.name === 'resumes')) {
      console.log('Resumes bucket already exists');
      return true;
    }
    
    // Create the bucket as public
    const { error } = await supabase.storage.createBucket('resumes', {
      public: true, // Make the bucket public
      fileSizeLimit: 52428800 // 50MB limit
    });
    
    if (error) {
      console.error('Error creating resumes bucket:', error.message);
      return false;
    }
    
    console.log('Resumes bucket created successfully');
    return true;
  } catch (error) {
    console.error('Exception during bucket creation:', error);
    return false;
  }
};
