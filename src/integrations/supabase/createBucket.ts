
import { supabase } from './client';

export const ensureResumesBucketExists = async () => {
  try {
    // Check if bucket already exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      throw error;
    }
    
    const resumesBucketExists = buckets.some(bucket => bucket.name === 'resumes');
    
    if (!resumesBucketExists) {
      console.log('The "resumes" bucket does not exist, creating...');
      
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket('resumes', {
        public: false,
        fileSizeLimit: 10485760, // 10 MB
      });
      
      if (createError) {
        console.error('Error creating "resumes" bucket:', createError);
        throw createError;
      }
      
      console.log('The "resumes" bucket was created successfully');
      
      // Set bucket policies
      const { error: policyError } = await supabase.storage.from('resumes').setPublic(false);
      
      if (policyError) {
        console.error('Error configuring bucket policies:', policyError);
      }
    } else {
      console.log('The "resumes" bucket already exists');
    }
  } catch (error) {
    console.error('Error initializing bucket:', error);
  }
};
