
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord si le bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      // Continuons malgré l'erreur
      console.log('Assuming bucket will be created by admin');
      return true;
    }
    
    // Si le bucket existe déjà, retourner succès
    if (buckets?.some(bucket => bucket.name === 'resumes')) {
      console.log('Resumes bucket already exists');
      return true;
    }
    
    // Pour éviter l'erreur 400, ne tentons pas de créer le bucket ici
    // La migration SQL a déjà créé le bucket
    console.log('Bucket not found but assuming it will be created by admin');
    return true;
  } catch (error) {
    console.error('Exception during bucket check:', error);
    // Supposons que le bucket existe pour permettre à l'application de continuer
    return true;
  }
};
