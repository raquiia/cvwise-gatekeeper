
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    console.log('Checking if "resumes" bucket exists...');
    
    // Check if bucket already exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      // Continue anyway to avoid blocking the app
      return true;
    }
    
    // Check if resumes bucket exists
    const resumesBucket = buckets?.find(bucket => bucket.name === 'resumes');
    
    if (!resumesBucket) {
      console.log('The "resumes" bucket does not exist, creating...');
      
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket('resumes', {
        public: false,
        fileSizeLimit: 10485760, // 10 MB
      });
      
      if (createError) {
        // Only log error if it's not "already exists"
        if (createError.message !== 'The resource already exists') {
          console.error('Error creating "resumes" bucket:', createError);
        } else {
          console.log('Bucket "resumes" already exists according to error response');
        }
        // Continue anyway to allow uploads
        return true;
      }
      
      console.log('The "resumes" bucket was created successfully');
    } else {
      console.log('The "resumes" bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing bucket:', error);
    // Important: Return true to allow the app to continue
    return true;
  }
};
