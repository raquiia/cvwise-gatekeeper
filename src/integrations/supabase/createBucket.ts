
import { supabase } from './client';

export const ensureResumesBucketExists = async () => {
  try {
    // Vérifier si le bucket existe déjà
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erreur lors de la vérification des buckets:', error);
      throw error;
    }
    
    const resumesBucketExists = buckets.some(bucket => bucket.name === 'resumes');
    
    if (!resumesBucketExists) {
      console.log('Le bucket "resumes" n\'existe pas, création en cours...');
      
      // Créer le bucket
      const { error: createError } = await supabase.storage.createBucket('resumes', {
        public: false,
        fileSizeLimit: 10485760, // 10 MB
      });
      
      if (createError) {
        console.error('Erreur lors de la création du bucket "resumes":', createError);
        throw createError;
      }
      
      console.log('Bucket "resumes" créé avec succès');
      
      // Ajouter des politiques de sécurité pour le bucket
      // Permettre aux utilisateurs authentifiés de lire les fichiers
      const { error: policyError } = await supabase.storage.from('resumes').setPublic(false);
      
      if (policyError) {
        console.error('Erreur lors de la configuration des politiques du bucket:', policyError);
      }
    } else {
      console.log('Le bucket "resumes" existe déjà');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du bucket:', error);
  }
};
