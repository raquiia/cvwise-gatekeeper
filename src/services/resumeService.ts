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
    console.log('Démarrage du processus de téléchargement pour le fichier:', file.name);
    console.log('ID utilisateur:', userId);
    
    // 1. Vérifier/créer le bucket silencieusement
    await ensureResumesBucketExists().catch(err => {
      console.warn('Problème avec le bucket, on continue:', err);
    });
    
    // 2. Créer d'abord l'enregistrement en base de données
    const filePath = `${userId}/${uuidv4()}.${file.name.split('.').pop() || 'pdf'}`;
    
    const { data: resumeRecord, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        parsed: false
      })
      .select('*')
      .single();
      
    if (dbError) {
      console.error('Erreur de base de données:', dbError);
      return null;
    }
    
    // 3. Tenter de télécharger le fichier
    try {
      const uploadResult = await resumeStorageService.uploadFile(file, userId);
      
      // Si l'upload a échoué mais que l'entrée DB existe, c'est quand même un succès partiel
      if (!uploadResult) {
        console.warn('Échec du téléchargement du fichier, mais l\'enregistrement en base de données a réussi');
      }
    } catch (uploadError) {
      console.warn('Erreur lors du téléchargement du fichier, mais l\'enregistrement en base existe', uploadError);
      // Ne pas échouer le processus complet
    }
    
    return resumeRecord as ResumeData;
  } catch (error: any) {
    console.error('Échec du téléchargement du CV:', error);
    return null;
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
