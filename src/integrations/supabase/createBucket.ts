
import { supabase } from './client';

// This function can be run once to ensure the resumes bucket exists
export const ensureResumesBucketExists = async () => {
  try {
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking storage buckets:', listError);
      return false;
    }
    
    const resumesBucket = buckets?.find(bucket => bucket.name === 'resumes');
    
    if (!resumesBucket) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket('resumes', {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (createError) {
        console.error('Error creating resumes bucket:', createError);
        return false;
      }
      
      console.log('Resumes bucket created successfully');
      
      // Note: createPolicy is not directly available in newer Supabase JS client
      // Policies should be defined in migrations or via the Supabase dashboard
      // This part is left as a comment for reference
      /*
      const { error: policyError } = await supabase.storage.from('resumes').createPolicy(
        'authenticated-users-policy',
        {
          name: 'authenticated-users-policy',
          definition: {
            role: 'authenticated',
            action: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
            conditions: { "auth.uid": 'eq.user_id' }
          }
        }
      );
      
      if (policyError) {
        console.error('Error setting bucket policy:', policyError);
      }
      */
      
      return true;
    }
    
    console.log('Resumes bucket already exists');
    return true;
  } catch (error) {
    console.error('Error ensuring resumes bucket exists:', error);
    return false;
  }
};
