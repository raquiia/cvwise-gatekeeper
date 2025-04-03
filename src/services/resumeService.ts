
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
 * Télécharge un CV pour un utilisateur spécifique
 */
export const uploadResume = async (file: File, userId: string): Promise<ResumeData | null> => {
  try {
    console.log('Démarrage du processus de téléchargement pour:', file.name);
    
    // 1. Vérifier/créer le bucket
    await ensureResumesBucketExists();
    
    // 2. Générer un chemin de fichier unique
    const fileExt = file.name.split('.').pop() || 'pdf';
    const filePath = `${userId}/${uuidv4()}.${fileExt}`;
    
    // 3. Créer d'abord l'enregistrement en base de données
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
    
    // 4. Télécharger le fichier vers le stockage
    try {
      const uploadResult = await resumeStorageService.uploadFile(file, userId);
      
      if (!uploadResult) {
        console.warn('Échec du téléchargement du fichier, mais l\'enregistrement en base de données existe');
      }
    } catch (uploadError) {
      console.warn('Erreur lors du téléchargement du fichier, continuons avec l\'enregistrement DB', uploadError);
    }
    
    return resumeRecord as ResumeData;
  } catch (error: any) {
    console.error('Échec complet du téléchargement:', error);
    return null;
  }
};

/**
 * Récupère tous les CV d'un utilisateur
 */
export const getUserResumes = async (userId: string): Promise<ResumeData[]> => {
  try {
    console.log('Récupération des CV pour l\'utilisateur:', userId);
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erreur lors de la récupération des CV:', error);
      return [];
    }
    
    return data as ResumeData[];
  } catch (error) {
    console.error('Erreur dans getUserResumes:', error);
    return [];
  }
};

/**
 * Supprime un CV (enregistrement et fichier)
 */
export const deleteResume = async (resumeId: string, filePath: string): Promise<boolean> => {
  try {
    // Suppression de l'enregistrement
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
      
    if (error) {
      console.error('Erreur lors de la suppression de l\'enregistrement:', error);
      return false;
    }
    
    // Suppression du fichier
    await resumeStorageService.deleteFile(filePath);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du CV:', error);
    return false;
  }
};

/**
 * Analyse un CV
 */
export const analyzeResume = resumeAnalysisService.analyzeResume;

/**
 * Enregistre un candidat
 */
export const saveCandidate = candidateDataService.saveCandidate;

/**
 * Récupère tous les candidats d'un utilisateur
 */
export const getUserCandidates = candidateDataService.getUserCandidates;
