
import { v4 as uuidv4 } from 'uuid';
import { resumeStorageService } from './storage/resumeStorageService';
import { supabase } from '@/integrations/supabase/client';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

// Re-export des interfaces
import type { ResumeData, CandidateData } from './data/resumeDataService';
export type { ResumeData, CandidateData };

/**
 * Version simplifiée du téléchargement d'un CV
 */
export const uploadResume = async (file: File, userId: string): Promise<ResumeData | null> => {
  try {
    // S'assurer que le bucket existe
    await ensureResumesBucketExists();
    
    // Générer un chemin de fichier unique
    const fileExt = file.name.split('.').pop() || 'pdf';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // D'abord insérer l'enregistrement dans la base de données
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
      console.error('Erreur DB:', dbError.message);
      return null;
    }
    
    // Ensuite télécharger le fichier
    const uploadResult = await resumeStorageService.uploadFile(file, userId);
    
    if (!uploadResult) {
      // Si échec d'upload, supprimer l'enregistrement
      await supabase.from('resumes').delete().eq('id', resumeRecord.id);
      console.error('Échec téléchargement du fichier');
      return null;
    }
    
    return resumeRecord as ResumeData;
  } catch (error: any) {
    console.error('Exception complète:', error.message);
    return null;
  }
};

/**
 * Récupère tous les CV d'un utilisateur
 */
export const getUserResumes = async (userId: string): Promise<ResumeData[]> => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erreur récupération CV:', error.message);
      return [];
    }
    
    return data as ResumeData[];
  } catch (error) {
    console.error('Exception récupération CV:', error);
    return [];
  }
};

/**
 * Supprime un CV
 */
export const deleteResume = async (resumeId: string, filePath: string): Promise<boolean> => {
  try {
    // Supprimer l'enregistrement
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
      
    if (error) {
      console.error('Erreur suppression DB:', error.message);
      return false;
    }
    
    // Supprimer le fichier
    await resumeStorageService.deleteFile(filePath);
    return true;
  } catch (error) {
    console.error('Exception suppression CV:', error);
    return false;
  }
};

// Re-export des services existants
export { resumeAnalysisService } from './analysis/resumeAnalysisService';
export { candidateDataService } from './data/candidateDataService';
