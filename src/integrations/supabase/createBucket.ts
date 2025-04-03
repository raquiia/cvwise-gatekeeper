
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    console.log('Checking if "resumes" bucket exists...');
    
    // Check if bucket already exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      return false;
    }
    
    // Check if resumes bucket exists
    const resumesBucket = buckets?.find(bucket => bucket.name === 'resumes');
    
    if (!resumesBucket) {
      console.log('The "resumes" bucket does not exist, creating...');
      
      // Create bucket with simplified approach
      const { error: createError } = await supabase.storage.createBucket('resumes', {
        public: false,
        fileSizeLimit: 10485760, // 10 MB
      });
      
      if (createError) {
        console.error('Error creating "resumes" bucket:', createError);
        return false;
      }
      
      console.log('The "resumes" bucket was created successfully');
    } else {
      console.log('The "resumes" bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing bucket:', error);
    return false;
  }
};
