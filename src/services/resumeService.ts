import { v4 as uuidv4 } from 'uuid';
import { resumeStorageService } from './storage/resumeStorageService';
import { resumeDataService } from './data/resumeDataService';
import { candidateDataService } from './data/candidateDataService';
import { resumeAnalysisService } from './analysis/resumeAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

// Re-exporter les interfaces pour compatibilité
import type { ResumeData, CandidateData } from './data/resumeDataService';
export type { ResumeData, CandidateData };

export const uploadResume = async (file: File, userId: string): Promise<ResumeData | null> => {
  try {
    console.log('Starting upload process for file:', file.name);
    console.log('User ID:', userId);
    
    // Vérifier que le bucket existe - ne pas bloquer l'upload si l'initialisation échoue
    const bucketExists = await ensureResumesBucketExists();
    if (!bucketExists) {
      console.warn('Warning: Could not verify bucket existence, continuing anyway');
    }
    
    // Téléchargement du fichier avec gestion d'erreur améliorée
    let fileData;
    try {
      fileData = await resumeStorageService.uploadFile(file, userId);
    } catch (uploadError: any) {
      console.error('File upload error:', uploadError);
      throw new Error(uploadError.message || "Échec du téléchargement du fichier");
    }
    
    if (!fileData) {
      throw new Error("Échec du téléchargement du fichier");
    }
    
    console.log('File uploaded successfully:', fileData);
    
    // Création de l'enregistrement dans la base de données
    try {
      // Utiliser directement l'insertion Supabase plutôt que de passer par le service
      const { data: resumeRecord, error } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          file_name: fileData.fileName,
          file_path: fileData.filePath,
          file_type: fileData.fileType,
          file_size: fileData.fileSize,
          parsed: false
        })
        .select('*')
        .single();
        
      if (error) {
        // Si l'insertion échoue, tenter de supprimer le fichier téléchargé
        try {
          await resumeStorageService.deleteFile(fileData.filePath);
        } catch (deleteError) {
          console.error('Error deleting file after failed DB insert:', deleteError);
        }
        throw error;
      }
      
      console.log('Resume record created:', resumeRecord);
      
      return resumeRecord as ResumeData;
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // Tenter de supprimer le fichier téléchargé en cas d'erreur
      try {
        await resumeStorageService.deleteFile(fileData.filePath);
      } catch (deleteError) {
        console.error('Error deleting file after failed DB insert:', deleteError);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Resume upload failed:', error);
    throw error;
  }
};

export const getUserResumes = async (userId: string): Promise<ResumeData[]> => {
  try {
    console.log('Getting resumes for user:', userId);
    
    // Tentative directe d'accès aux données
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching resumes directly:', error);
        throw error;
      }
      
      console.log('Retrieved resumes:', data);
      
      return data as ResumeData[];
    } catch (directError) {
      console.error('Direct fetch failed, trying service method:', directError);
      
      // Fallback à l'ancienne méthode
      const resumes = await resumeDataService.getUserResumes(userId);
      console.log('Retrieved resumes via service:', resumes);
      return resumes;
    }
  } catch (error) {
    console.error('Error in getUserResumes:', error);
    // Retourner un tableau vide en cas d'erreur pour éviter le blocage de l'interface
    return [];
  }
};

/**
 * Supprime un CV (enregistrement et fichier)
 */
export const deleteResume = async (resumeId: string, filePath: string): Promise<boolean> => {
  try {
    // Suppression de l'enregistrement
    const recordDeleted = await resumeDataService.deleteResumeRecord(resumeId);
    
    if (!recordDeleted) {
      throw new Error("Échec de la suppression de l'enregistrement du CV");
    }
    
    // Suppression du fichier
    const fileDeleted = await resumeStorageService.deleteFile(filePath);
    
    if (!fileDeleted) {
      console.warn("Le fichier n'a pas pu être supprimé, mais l'enregistrement a été supprimé");
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting resume:', error);
    return false;
  }
};

/**
 * Enregistre un candidat
 */
export const saveCandidate = candidateDataService.saveCandidate;

/**
 * Récupère tous les candidats d'un utilisateur
 */
export const getUserCandidates = candidateDataService.getUserCandidates;

/**
 * Analyse un CV
 */
export const analyzeResume = resumeAnalysisService.analyzeResume;
