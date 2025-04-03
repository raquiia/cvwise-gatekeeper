
import { supabase } from './client';

export const ensureResumesBucketExists = async () => {
  try {
    console.log('Checking if "resumes" bucket exists...');
    
    // Check if bucket already exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      throw new Error(`Failed to check storage buckets: ${error.message}`);
    }
    
    console.log('Available buckets:', buckets);
    
    // Check if resumes bucket exists
    const resumesBucket = buckets.find(bucket => bucket.name === 'resumes');
    
    if (!resumesBucket) {
      console.log('The "resumes" bucket does not exist, creating...');
      
      // Attempt to create bucket with a try/catch to handle errors properly
      try {
        const { data, error: createError } = await supabase.storage.createBucket('resumes', {
          public: false,
          fileSizeLimit: 10485760, // 10 MB
        });
        
        if (createError) {
          // Only throw if it's not a "resource already exists" error
          if (createError.message !== 'The resource already exists') {
            console.error('Error creating "resumes" bucket:', createError);
            throw new Error(`Failed to create storage bucket: ${createError.message}`);
          } else {
            console.log('Bucket "resumes" already exists according to error response');
            return true; // Return true even if we got an "already exists" error
          }
        }
        
        console.log('The "resumes" bucket was created successfully:', data);
        return true;
      } catch (createBucketError: any) {
        // If the bucket already exists, we can consider this a success
        if (createBucketError.message?.includes('already exists')) {
          console.log('Bucket "resumes" already exists (caught from error)');
          return true;
        }
        
        console.error('Failed to create bucket:', createBucketError);
        
        // Check again if bucket exists (it might have been created in another session)
        const { data: checkBuckets } = await supabase.storage.listBuckets();
        
        if (checkBuckets && checkBuckets.some(bucket => bucket.name === 'resumes')) {
          console.log('Bucket "resumes" actually exists despite creation error');
          return true;
        }
        
        throw createBucketError;
      }
    } else {
      console.log('The "resumes" bucket already exists');
      return true;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error initializing bucket:', error);
    // Important: Return true instead of rethrowing to allow the app to continue
    // This prevents the loading spinner from showing forever
    return true;
  }
};
