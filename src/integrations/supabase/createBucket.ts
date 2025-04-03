
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    // Création simple du bucket, sans vérification ni options complexes
    const { error } = await supabase.storage.createBucket('resumes', {
      public: true // Mettre en public pour simplifier
    });
    
    if (error && error.message !== 'The resource already exists') {
      console.error('Erreur de création du bucket:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Exception lors de la création du bucket:', error);
    return false;
  }
};
