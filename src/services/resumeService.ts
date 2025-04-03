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

/**
 * Télécharge un CV dans le stockage et crée un enregistrement dans la base de données
 */
export const uploadResume = async (file: File, userId: string): Promise<ResumeData | null> => {
  try {
    console.log('Starting upload process for file:', file.name);
    console.log('User ID:', userId);
    
    // Ensure the storage bucket exists
    try {
      await ensureResumesBucketExists();
    } catch (bucketError) {
      console.error('Error checking/creating bucket:', bucketError);
      // Continue anyway to prevent blocking the upload process
    }
    
    // Téléchargement du fichier
    const fileData = await resumeStorageService.uploadFile(file, userId);
    
    if (!fileData) {
      throw new Error("Échec du téléchargement du fichier");
    }
    
    console.log('File uploaded successfully:', fileData);
    
    // Création de l'enregistrement dans la base de données
    try {
      const resumeId = await resumeDataService.createResumeRecord(
        userId,
        fileData.fileName,
        fileData.filePath,
        fileData.fileType,
        fileData.fileSize
      );
      
      if (!resumeId) {
        // Si l'insertion échoue, supprimer le fichier téléchargé
        await resumeStorageService.deleteFile(fileData.filePath);
        throw new Error("Échec de la création de l'enregistrement du CV");
      }
      
      console.log('Resume record created with ID:', resumeId);
      
      return {
        id: resumeId,
        user_id: userId,
        file_name: fileData.fileName,
        file_path: fileData.filePath,
        file_type: fileData.fileType,
        file_size: fileData.fileSize,
        parsed: false
      };
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Si l'insertion échoue, supprimer le fichier téléchargé
      await resumeStorageService.deleteFile(fileData.filePath);
      throw dbError;
    }
  } catch (error: any) {
    console.error('Resume upload failed:', error);
    throw error;
  }
};

/**
 * Récupère tous les CV d'un utilisateur
 */
export const getUserResumes = async (userId: string): Promise<ResumeData[]> => {
  try {
    console.log('Getting resumes for user:', userId);
    const resumes = await resumeDataService.getUserResumes(userId);
    console.log('Retrieved resumes:', resumes);
    return resumes;
  } catch (error) {
    console.error('Error in getUserResumes:', error);
    throw error;
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
