
import { supabase } from '@/integrations/supabase/client';
import { ResumeData } from '../data/resumeDataService';

// Extrait le texte d'un CV via la fonction Edge
export const extractResumeText = async (resumeId: string, resumeUrl: string): Promise<{ success: boolean; text?: string; error?: string }> => {
  try {
    console.log(`Extraction du texte pour le CV ${resumeId}`);
    
    const { data, error } = await supabase.functions.invoke('extract-cv-text', {
      body: {
        resumeId,
        pdfUrl: resumeUrl
      }
    });
    
    if (error) {
      console.error('Erreur lors de l\'extraction du texte:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Extraction de texte réussie:', data);
    
    if (!data.success) {
      return { success: false, error: data.error || 'Échec de l\'extraction du texte' };
    }
    
    // Déclencher automatiquement l'analyse AI après l'extraction
    if (data.success && data.data && data.data.text) {
      console.log('Texte extrait, lancement de l\'analyse AI automatique');
      
      try {
        await analyzeResume(resumeId, data.data.text);
        console.log('Analyse AI déclenchée automatiquement après extraction');
      } catch (aiError) {
        console.error('Erreur lors du lancement automatique de l\'analyse AI:', aiError);
        // On continue malgré l'erreur d'analyse pour au moins retourner le texte
      }
    }
    
    return { 
      success: true, 
      text: data.data?.text || ''
    };
  } catch (error: any) {
    console.error('Exception lors de l\'extraction du texte:', error);
    return { success: false, error: error.message || 'Erreur lors de l\'extraction du texte' };
  }
};

// Analyse un CV avec l'IA et crée un candidat
export const analyzeResume = async (resumeId: string, resumeText?: string): Promise<{ success: boolean; candidateId?: string; error?: string }> => {
  try {
    console.log(`Analyse IA du CV ${resumeId}`);
    
    // Obtenir l'URL publique du fichier CV
    const { data: resume } = await supabase
      .from('resumes')
      .select('file_path')
      .eq('id', resumeId)
      .single();
    
    if (!resume) {
      console.error('CV non trouvé dans la base de données');
      return { success: false, error: 'CV non trouvé' };
    }
    
    const { data: signedUrl } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resume.file_path, 3600); // URL valide 1 heure
    
    console.log('URL signée créée pour le CV:', signedUrl?.signedUrl);
    
    // Appeler la fonction Edge d'analyse
    const { data, error } = await supabase.functions.invoke('resume-ai-analysis', {
      body: {
        resumeId,
        resumeText,
        pdfUrl: signedUrl?.signedUrl
      }
    });
    
    if (error) {
      console.error('Erreur lors de l\'appel à la fonction d\'analyse:', error);
      return { success: false, error: error.message };
    }
    
    if (!data || !data.success) {
      console.error('Échec de l\'analyse IA:', data?.message || 'Raison inconnue');
      return { 
        success: false, 
        error: data?.message || 'Échec de l\'analyse IA' 
      };
    }
    
    console.log('Analyse IA réussie, candidat créé avec ID:', data.candidate?.id);
    
    return { 
      success: true, 
      candidateId: data.candidate?.id
    };
  } catch (error: any) {
    console.error('Exception lors de l\'analyse IA:', error);
    return { success: false, error: error.message || 'Erreur lors de l\'analyse IA' };
  }
};
