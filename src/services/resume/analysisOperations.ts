
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { candidateService, CandidateData } from '@/services/data/candidateService';
import { extractResumeText } from './resumeAnalysisService';

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
  analysis?: any;
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

    // 1. Extraire le texte du CV
    const extractResult = await extractResumeText(resumeId);
    
    if (!extractResult.success || !extractResult.text) {
      throw new Error(extractResult.message || 'Erreur lors de l\'extraction du texte');
    }

    const resumeText = extractResult.text;
    console.log('✅ Text extracted, length:', resumeText?.length);

    onProgress?.({ current: 2, total: 4, status: 'analyzing', currentFile: 'Analyse IA du CV...' });

    // 2. Analyser le CV avec l'IA pour extraire les informations du candidat ET le scoring
    const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-resume', {
      body: { 
        resumeText,
        resumeId 
      }
    });

    if (analysisError) {
      console.error('❌ Edge function error:', analysisError);
      throw new Error(`Erreur lors de l'analyse du CV: ${analysisError.message}`);
    }

    if (!analysisData?.success) {
      console.error('❌ Analysis failed:', analysisData);
      throw new Error(analysisData?.error || 'Erreur lors de l\'analyse du CV');
    }

    console.log('✅ Resume analyzed successfully:', {
      candidateName: `${analysisData.candidateData?.first_name} ${analysisData.candidateData?.last_name}`,
      hasAnalysis: !!analysisData.analysis,
      hasAddress: !!(analysisData.candidateData?.address || analysisData.candidateData?.city),
      analysisDetails: {
        score: analysisData.analysis?.score,
        strengthsCount: analysisData.analysis?.strengths?.length || 0,
        weaknessesCount: analysisData.analysis?.weaknesses?.length || 0,
        recommendationsCount: analysisData.analysis?.recommendations?.length || 0
      }
    });

    onProgress?.({ current: 3, total: 4, status: 'saving', currentFile: 'Sauvegarde en base...' });

    // 3. Créer ou mettre à jour le candidat en base
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const candidateToSave = {
      ...analysisData.candidateData,
      resume_id: resumeId,
      user_id: user.id,
      last_updated_at: new Date().toISOString()
    };

    let finalCandidate: CandidateData;
    
    // Vérifier si un candidat existe déjà pour ce CV
    const { data: existingCandidates } = await supabase
      .from('candidates')
      .select('id')
      .eq('resume_id', resumeId)
      .limit(1);

    if (existingCandidates && existingCandidates.length > 0) {
      // Mise à jour d'un candidat existant
      finalCandidate = await candidateService.updateCandidate({
        ...candidateToSave,
        id: existingCandidates[0].id
      });
    } else {
      // Création d'un nouveau candidat
      finalCandidate = await candidateService.createCandidate(candidateToSave);
    }

    // 4. Sauvegarder le score IA complet si disponible avec TOUS les nouveaux paramètres
    if (analysisData.analysis && finalCandidate.id) {
      try {
        console.log('💾 Saving comprehensive AI analysis with full details...');
        console.log('📊 Analysis data to save:', {
          score: analysisData.analysis.score,
          explanationLength: analysisData.analysis.explanation?.length || 0,
          strengthsCount: analysisData.analysis.strengths?.length || 0,
          weaknessesCount: analysisData.analysis.weaknesses?.length || 0,
          recommendationsCount: analysisData.analysis.recommendations?.length || 0,
          breakdown: analysisData.analysis.breakdown
        });
        
        // Utiliser la fonction RPC mise à jour avec TOUS les nouveaux paramètres
        const { error: scoreError } = await supabase.rpc('save_ai_candidate_score', {
          p_candidate_id: finalCandidate.id,
          p_score: analysisData.analysis.score,
          p_explanation: analysisData.analysis.explanation,
          p_job_offer_id: null, // Score de complétude générale
          p_breakdown: analysisData.analysis.breakdown || {},
          p_strengths: analysisData.analysis.strengths || [],
          p_weaknesses: analysisData.analysis.weaknesses || [],
          p_recommendations: analysisData.analysis.recommendations || []
        });

        if (scoreError) {
          console.error('❌ Error saving comprehensive AI score:', scoreError);
        } else {
          console.log('✅ Comprehensive AI analysis saved successfully with all details');
        }
      } catch (scoreError) {
        console.error('❌ Exception saving comprehensive AI score:', scoreError);
      }
    }

    onProgress?.({ current: 4, total: 4, status: 'completed' });

    console.log('✅ Resume analysis completed successfully for candidate:', finalCandidate.id);

    toast({
      title: "Analyse terminée",
      description: `Le CV de ${finalCandidate.first_name} ${finalCandidate.last_name} a été analysé avec succès avec analyse IA complète`,
    });

    return {
      success: true,
      candidateData: finalCandidate,
      analysis: analysisData.analysis
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
