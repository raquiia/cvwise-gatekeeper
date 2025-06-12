
import { supabase, SUPABASE_API_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { analyzeResume } from './resume/resumeAnalysisService';

export interface ResumeAnalysisResult {
  success: boolean;
  candidateId?: string;
  error?: string;
  analysisData?: any;
}

// Re-export des fonctions depuis le module resume/resumeOperations
export { uploadResume, getUserResumes, checkDuplicateResume } from './resume/resumeOperations';

// Re-export du type ResumeData depuis le bon module
export type { ResumeData } from './data/resumeDataService';

// Fonctions de téléchargement et suppression
export const downloadResume = async (filePath: string, fileName: string): Promise<boolean> => {
  try {
    console.log('Downloading resume from path:', filePath);
    
    const { data, error } = await supabase.storage
      .from('resumes')
      .download(filePath);
    
    if (error) {
      console.error('Error downloading file:', error);
      return false;
    }
    
    // Créer un blob et déclencher le téléchargement
    const blob = data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error: any) {
    console.error('Exception during download:', error);
    return false;
  }
};

export const deleteResume = async (resumeId: string, filePath: string): Promise<boolean> => {
  try {
    console.log('Deleting resume:', resumeId, 'at path:', filePath);
    
    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .remove([filePath]);
    
    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continuer même si la suppression du fichier échoue
    }
    
    // Supprimer l'enregistrement de la base de données
    const { error: dbError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
    
    if (dbError) {
      console.error('Error deleting resume from database:', dbError);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('Exception during resume deletion:', error);
    return false;
  }
};

// Export the analyzeResume function from the resume analysis service
export { analyzeResume } from './resume/resumeAnalysisService';

export const extractCandidateInfo = async (resumeId: string) => {
  try {
    console.log('🔍 Extracting candidate info for resume:', resumeId);

    const response = await fetch(`${SUPABASE_API_URL}/functions/v1/extract-candidate-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ resumeId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📄 Candidate info extraction result:', result);

    return result;
  } catch (error: any) {
    console.error('❌ Error extracting candidate info:', error);
    throw error;
  }
};
