
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { candidateService, CandidateData } from '@/services/data/candidateService';
import { analyzeResumeWithAI, AIAnalysisResult, extractResumeText } from './resumeAnalysisService';

export interface AnalysisProgress {
  current: number;
  total: number;
  currentFile?: string;
  status: 'analyzing' | 'extracting' | 'saving' | 'completed' | 'error';
}

export interface AnalysisResult {
  success: boolean;
  candidateData?: CandidateData;
  error?: string;
  analysis?: AIAnalysisResult;
}

/**
 * Analyser un CV unique avec extraction de données et scoring IA
 */
export const analyzeResume = async (
  resumeId: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<AnalysisResult> => {
  try {
    console.log('🚀 Starting resume analysis for:', resumeId);
    
    onProgress?.({ current: 1, total: 4, status: 'extracting', currentFile: 'Extraction du texte...' });

    // 1. Extraire le texte du CV en utilisant la fonction qui fonctionne déjà
    const extractResult = await extractResumeText(resumeId);
    
    if (!extractResult.success || !extractResult.text) {
      throw new Error(extractResult.message || 'Erreur lors de l\'extraction du texte');
    }

    const resumeText = extractResult.text;
    console.log('✅ Text extracted, length:', resumeText?.length);

    onProgress?.({ current: 2, total: 4, status: 'analyzing', currentFile: 'Extraction des informations candidat...' });

    // 2. Extraire les informations du candidat
    const { data: candidateData, error: candidateError } = await supabase.functions.invoke('extract-candidate-info', {
      body: { resumeText, resumeId }
    });

    if (candidateError || !candidateData?.success) {
      throw new Error(candidateData?.error || 'Erreur lors de l\'extraction des informations');
    }

    console.log('✅ Candidate info extracted for:', candidateData.candidate?.first_name, candidateData.candidate?.last_name);

    onProgress?.({ current: 3, total: 4, status: 'analyzing', currentFile: 'Analyse IA du profil...' });

    // 3. Analyser avec l'IA et sauvegarder automatiquement le score
    const aiAnalysis = await analyzeResumeWithAI(candidateData.candidate, resumeText);
    
    if (!aiAnalysis.success) {
      console.warn('⚠️ AI analysis failed but continuing with candidate creation');
    }

    onProgress?.({ current: 4, total: 4, status: 'saving', currentFile: 'Sauvegarde en base...' });

    // 4. Créer ou mettre à jour le candidat en base
    let finalCandidate: CandidateData;
    
    if (candidateData.candidate.id) {
      // Mise à jour d'un candidat existant
      finalCandidate = await candidateService.updateCandidate({
        ...candidateData.candidate,
        resume_id: resumeId,
        last_updated_at: new Date().toISOString()
      });
    } else {
      // Création d'un nouveau candidat
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      finalCandidate = await candidateService.createCandidate({
        ...candidateData.candidate,
        resume_id: resumeId,
        user_id: user.id,
        last_updated_at: new Date().toISOString()
      });
    }

    onProgress?.({ current: 4, total: 4, status: 'completed' });

    console.log('✅ Resume analysis completed successfully for candidate:', finalCandidate.id);

    toast({
      title: "Analyse terminée",
      description: `Le CV de ${finalCandidate.first_name} ${finalCandidate.last_name} a été analysé avec succès${aiAnalysis.success ? ' avec scoring IA' : ''}`,
    });

    return {
      success: true,
      candidateData: finalCandidate,
      analysis: aiAnalysis.analysis
    };

  } catch (error: any) {
    console.error('❌ Resume analysis failed:', error);
    
    onProgress?.({ current: 0, total: 4, status: 'error' });
    
    toast({
      title: "Erreur d'analyse",
      description: error.message || "Impossible d'analyser le CV",
      variant: "destructive",
    });

    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Vérifier si un CV a déjà été analysé
 */
export const checkResumeAlreadyAnalyzed = async (resumeId: string): Promise<boolean> => {
  try {
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('id')
      .eq('resume_id', resumeId)
      .limit(1);

    if (error) {
      console.error('Error checking if resume analyzed:', error);
      return false;
    }

    return (candidates || []).length > 0;
  } catch (error) {
    console.error('Error in checkResumeAlreadyAnalyzed:', error);
    return false;
  }
};

/**
 * Analyser plusieurs CV en lot
 */
export const analyzeBatchResumes = async (
  resumeIds: string[],
  onProgress?: (progress: AnalysisProgress) => void
): Promise<AnalysisResult[]> => {
  const results: AnalysisResult[] = [];
  
  for (let i = 0; i < resumeIds.length; i++) {
    const resumeId = resumeIds[i];
    
    onProgress?.({
      current: i + 1,
      total: resumeIds.length,
      status: 'analyzing',
      currentFile: `CV ${i + 1}/${resumeIds.length}`
    });

    const result = await analyzeResume(resumeId);
    results.push(result);
    
    // Petite pause pour éviter de surcharger l'API
    if (i < resumeIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  onProgress?.({
    current: resumeIds.length,
    total: resumeIds.length,
    status: 'completed'
  });

  return results;
};
