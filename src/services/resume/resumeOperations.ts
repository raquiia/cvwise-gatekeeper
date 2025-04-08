
import { v4 as uuidv4 } from 'uuid';
import { resumeStorageService } from '../storage/resumeStorageService';
import { supabase } from '@/integrations/supabase/client';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';
import type { ResumeData } from '../data/resumeDataService';
import { extractResumeText } from './analysisOperations';

/**
 * Vérifier si un fichier avec le même nom existe déjà pour cet utilisateur
 */
export const checkDuplicateResume = async (fileName: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Checking if file ${fileName} already exists for user ${userId}`);
    
    const { data, error } = await supabase.rpc('check_duplicate_resume', {
      p_file_name: fileName,
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error checking duplicate:', error.message);
      return false; // En cas d'erreur, permettre l'upload
    }
    
    return data === true;
  } catch (error) {
    console.error('Exception checking duplicate:', error);
    return false; // En cas d'erreur, permettre l'upload
  }
};

/**
 * Upload a resume file and create a database record
 */
export const uploadResume = async (file: File, userId: string): Promise<ResumeData | null> => {
  try {
    console.log(`Starting upload for ${file.name} (${file.size} bytes)`);
    
    // Vérifier si le fichier est un doublon
    const isDuplicate = await checkDuplicateResume(file.name, userId);
    if (isDuplicate) {
      console.log(`File ${file.name} is a duplicate for user ${userId}`);
      throw new Error(`Le fichier "${file.name}" existe déjà dans votre bibliothèque`);
    }
    
    // Ensure bucket exists first, but don't stop the flow if it already exists
    await ensureResumesBucketExists();
    
    // Upload the file to storage
    const filePath = await resumeStorageService.uploadFile(file, userId);
    if (!filePath) {
      console.error('File upload failed');
      return null;
    }
    
    console.log('File uploaded successfully, creating database record');
    
    // Utiliser la fonction SQL sécurisée pour insérer le CV
    try {
      const { data: resumeId, error } = await supabase.rpc('insert_resume', {
        p_user_id: userId,
        p_file_name: file.name,
        p_file_path: filePath,
        p_file_type: file.type,
        p_file_size: file.size
      });
      
      if (error) {
        console.error('Database error:', error.message);
        // Nettoyer le fichier si l'insertion dans la base de données échoue
        // Mais ne pas bloquer en cas d'erreur lors de la suppression
        try {
          await resumeStorageService.deleteFile(filePath);
        } catch (cleanupError) {
          console.warn('Could not clean up file after DB error:', cleanupError);
        }
        return null;
      }
      
      // Au lieu d'essayer de récupérer immédiatement depuis la base de données,
      // construisons simplement l'objet manuellement pour éviter l'erreur de récursion
      const resumeData: ResumeData = {
        id: resumeId as string,
        user_id: userId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        parsed: false,
        created_at: new Date().toISOString(),
        candidates: []
      };
      
      console.log('Resume record created successfully:', resumeData);
      
      // Obtenir l'URL signée pour le fichier
      const { data: signedUrl } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 3600); // URL valide 1 heure
      
      // Lancer l'extraction et l'analyse en arrière-plan
      if (signedUrl?.signedUrl) {
        console.log('Starting automatic text extraction and analysis in background');
        setTimeout(async () => {
          try {
            // Extraire le texte et déclencher l'analyse automatiquement
            await extractResumeText(resumeData.id, signedUrl.signedUrl);
            console.log('Background text extraction and analysis completed');
          } catch (analysisError) {
            console.error('Error in background analysis:', analysisError);
          }
        }, 100);
      } else {
        console.warn('Could not create signed URL for background analysis');
      }
      
      return resumeData;
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Nettoyer en cas d'erreur
      await resumeStorageService.deleteFile(filePath);
      return null;
    }
  } catch (error: any) {
    console.error('Exception during resume upload:', error.message);
    throw error; // Remonter l'erreur pour pouvoir l'afficher dans l'interface
  }
};

/**
 * Get all resumes for a user
 */
export const getUserResumes = async (userId: string): Promise<ResumeData[]> => {
  try {
    console.log('Fetching resumes for user:', userId);
    
    // Use the stored procedure that avoids RLS recursion
    const { data, error } = await supabase.rpc('get_user_resumes', {
      user_id_param: userId
    });
    
    if (error) {
      console.error('Error fetching resumes:', error.message);
      throw error;
    }
    
    console.log('Successfully fetched resumes:', data);
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Explicitly cast the data to ResumeData[] to resolve type error
    return data as unknown as ResumeData[];
  } catch (error: any) {
    console.error('Error in getUserResumes:', error);
    // En cas d'erreur, retourner un tableau vide mais ne pas bloquer l'interface
    return [];
  }
};
