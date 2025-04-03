
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    console.log('Checking if "resumes" bucket exists...');
    
    // Approche simplifiée: tenter directement de créer le bucket sans vérifier son existence
    const { error } = await supabase.storage.createBucket('resumes', {
      public: false,
      fileSizeLimit: 10485760, // 10 MB
    });
    
    // Si l'erreur est due à l'existence du bucket, on considère que c'est un succès
    if (error && error.message === 'The resource already exists') {
      console.log('The "resumes" bucket already exists');
      return true;
    } else if (error) {
      console.error('Error creating "resumes" bucket:', error);
      return false;
    }
    
    console.log('The "resumes" bucket was created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing bucket:', error);
    // On retourne true même en cas d'erreur pour éviter de bloquer le flux
    return true;
  }
};
