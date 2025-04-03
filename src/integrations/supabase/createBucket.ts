
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
          throw new Error(`Failed to create storage bucket: ${createError.message}`);
        }
        
        console.log('The "resumes" bucket was created successfully:', data);
      } catch (createBucketError: any) {
        console.error('Failed to create bucket:', createBucketError);
        
        // Check again if bucket exists (it might have been created in another session)
        const { data: checkBuckets, error: checkError } = await supabase.storage.listBuckets();
        
        if (checkError) {
          throw new Error(`Failed to verify bucket creation: ${checkError.message}`);
        }
        
        if (checkBuckets.some(bucket => bucket.name === 'resumes')) {
          console.log('Bucket "resumes" actually exists despite creation error.');
          return;
        }
        
        throw createBucketError;
      }
    } else {
      console.log('The "resumes" bucket already exists');
    }
    
    // Test upload to verify bucket is working and policies are correctly set
    try {
      console.log('Testing bucket access with a small file upload...');
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testFilePath = `test/test-file-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(testFilePath, testFile, { upsert: true });
      
      if (uploadError) {
        console.error('Test upload failed:', uploadError);
        throw new Error(`Storage access test failed: ${uploadError.message}`);
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
    } catch (testError: any) {
      console.error('Error testing bucket access:', testError);
      throw new Error(`Storage access test failed: ${testError.message}`);
    }
    
    console.log('Bucket initialization and testing completed successfully');
    return true;
  } catch (error: any) {
    console.error('Error initializing bucket:', error);
    throw error;
  }
};
