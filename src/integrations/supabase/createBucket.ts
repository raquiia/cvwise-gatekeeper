
import { supabase } from './client';

export const ensureResumesBucketExists = async () => {
  try {
    console.log('Checking if "resumes" bucket exists...');
    
    // Check if bucket already exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      throw error;
    }
    
    console.log('Available buckets:', buckets);
    
    const resumesBucket = buckets.find(bucket => bucket.name === 'resumes');
    
    if (!resumesBucket) {
      console.log('The "resumes" bucket does not exist, creating...');
      
      try {
        // Create bucket
        const { data, error: createError } = await supabase.storage.createBucket('resumes', {
          public: false,
          fileSizeLimit: 10485760, // 10 MB
        });
        
        if (createError) {
          console.error('Error creating "resumes" bucket:', createError);
          throw createError;
        }
        
        console.log('The "resumes" bucket was created successfully:', data);
        
        // Set bucket policies to allow authenticated users to upload files
        try {
          const { error: policyError } = await supabase.storage.from('resumes').createPolicy(
            'authenticated can upload',
            {
              name: 'authenticated can upload',
              definition: {
                role_id: 'authenticated',
                operations: ['INSERT', 'SELECT', 'UPDATE', 'DELETE']
              }
            }
          );
          
          if (policyError) {
            console.error('Error creating bucket policy:', policyError);
          } else {
            console.log('Bucket policy created successfully');
          }
        } catch (policyError) {
          console.error('Error creating bucket policy:', policyError);
        }
      } catch (createBucketError) {
        console.error('Failed to create bucket:', createBucketError);
        // Check again if bucket exists (it might have been created in another session)
        const { data: checkBuckets } = await supabase.storage.listBuckets();
        if (checkBuckets.some(bucket => bucket.name === 'resumes')) {
          console.log('Bucket "resumes" actually exists despite creation error.');
          return;
        }
        throw createBucketError;
      }
    } else {
      console.log('The "resumes" bucket already exists');
    }
    
    // Test upload to verify bucket is working
    try {
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testFilePath = 'test/test-file.txt';
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(testFilePath, testFile, { upsert: true });
      
      if (uploadError) {
        console.error('Test upload failed:', uploadError);
      } else {
        console.log('Test upload succeeded:', uploadData);
        
        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from('resumes')
          .remove([testFilePath]);
          
        if (deleteError) {
          console.error('Error cleaning up test file:', deleteError);
        } else {
          console.log('Test file cleaned up successfully');
        }
      }
    } catch (testError) {
      console.error('Error testing bucket access:', testError);
    }
  } catch (error) {
    console.error('Error initializing bucket:', error);
  }
};
