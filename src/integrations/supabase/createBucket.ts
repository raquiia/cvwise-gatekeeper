
import { supabase } from './client';

export const ensureResumesBucketExists = async (): Promise<boolean> => {
  try {
    console.log('Vérification/création du bucket "resumes"...');
    
    // Simplification: utiliser uniquement createBucket sans vérification préalable
    // L'erreur "déjà existe" est attendue et sera ignorée
    const { error } = await supabase.storage.createBucket('resumes', {
      public: false,
      fileSizeLimit: 10485760, // 10 MB
    });
    
    if (error) {
      // Si le bucket existe déjà, ce n'est pas une erreur critique
      if (error.message === 'The resource already exists') {
        console.log('Le bucket "resumes" existe déjà');
        return true;
      }
      // Pour tout autre type d'erreur, on l'affiche mais on continue
      console.warn('Erreur possible avec le bucket:', error.message);
    } else {
      console.log('Le bucket "resumes" a été créé avec succès');
    }
    
    return true;
  } catch (error) {
    // En cas d'erreur, on log mais on ne bloque pas l'utilisateur
    console.warn('Erreur lors de l\'initialisation du bucket:', error);
    return true; // On retourne true pour ne pas bloquer l'utilisateur
  }
};
