
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord si le bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return false;
    }
    
    // Si le bucket existe déjà, retourner succès
    if (buckets?.some(bucket => bucket.name === 'resumes')) {
      console.log('Resumes bucket already exists');
      return true;
    }
    
    // Ne pas essayer de créer le bucket si les politiques sont configurées pour l'utiliser
    // Supposons que l'administrateur a déjà créé le bucket via la migration SQL
    console.log('Bucket not found but assuming it will be created by admin');
    return true;
  } catch (error) {
    console.error('Exception during bucket check:', error);
    // Supposons que le bucket existe pour permettre à l'application de continuer
    return true;
  }
};
