
import { supabase } from '@/integrations/supabase/client';
import { resumeAnalysisService } from '../analysis/resumeAnalysisService';
import { resumeDataService } from '../data/resumeDataService';

/**
 * Analyze a resume by its ID
 */
export const analyzeResume = async (resumeId: string): Promise<{ success: boolean; message: string; candidateId?: string }> => {
  try {
    console.log('Starting resume analysis for ID:', resumeId);
    
    // Récupérer les informations du CV
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (error) {
      console.error('Error fetching resume details:', error);
      throw new Error(error.message);
    }
    
    if (!resume) {
      throw new Error('CV introuvable');
    }
    
    console.log('Resume found, proceeding with analysis');
    
    // Récupérer le contenu du fichier
    const { downloadFile } = resumeStorageService;
    const { data: fileData, error: downloadError } = await downloadFile(resume.file_path);
    
    if (downloadError || !fileData) {
      console.error('Error downloading file for analysis:', downloadError);
      throw new Error(downloadError?.message || 'Impossible de télécharger le fichier pour analyse');
    }
    
    console.log('File downloaded, starting text extraction');
    
    // Extraire et analyser le texte du fichier
    const resumeText = await resumeAnalysisService.extractTextFromFile(fileData, resume.file_type);
    if (!resumeText) {
      throw new Error('Impossible d\'extraire le texte du CV');
    }
    
    console.log('Text extracted, analyzing content');
    
    // Analyser le contenu du CV
    const analysis = await resumeAnalysisService.analyzeResume(resumeText);
    if (!analysis) {
      throw new Error('Échec de l\'analyse du CV');
    }
    
    console.log('Resume analyzed, creating candidate profile');
    
    // Créer un candidat à partir de l'analyse
    const candidateData = {
      resume_id: resumeId,
      user_id: resume.user_id,
      ...analysis
    };
    
    // Insérer le candidat dans la base de données
    const { data: candidateResult, error: insertError } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error creating candidate:', insertError);
      throw new Error(insertError.message);
    }
    
    console.log('Candidate created successfully, updating resume status');
    
    // Marquer le CV comme analysé
    await resumeDataService.markResumeAsParsed(resumeId);
    
    console.log('Resume marked as parsed');
    
    return { 
      success: true, 
      message: 'Analyse terminée avec succès',
      candidateId: candidateResult?.id
    };
  } catch (error: any) {
    console.error('Error in analyzeResume:', error);
    return { 
      success: false, 
      message: error.message || 'Une erreur est survenue lors de l\'analyse du CV' 
    };
  }
};

// Import manquant
import { resumeStorageService } from '../storage/resumeStorageService';
