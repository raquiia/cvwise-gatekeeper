
import { supabase, SUPABASE_API_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { aiScoringService } from './aiScoringService';

export interface ResumeAnalysisResult {
  success: boolean;
  candidateId?: string;
  error?: string;
  analysisData?: any;
}

export const analyzeResume = async (resumeId: string): Promise<ResumeAnalysisResult> => {
  try {
    console.log('🚀 Starting resume analysis for resume:', resumeId);

    // Appeler la fonction Edge pour l'analyse IA
    const response = await fetch(`${SUPABASE_API_URL}/functions/v1/resume-ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ 
        resumeId: resumeId,
        comprehensive: true // Demander une analyse complète
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resume analysis API error:', response.status, errorText);
      throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📊 Resume analysis result:', result);

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    // Sauvegarder le score IA si nous avons les données nécessaires
    if (result.candidateId && result.aiScore) {
      console.log('💾 Saving AI score to database...');
      
      const saveResult = await aiScoringService.saveAIScore(
        result.candidateId,
        result.aiScore.score || 0,
        result.aiScore.explanation || '',
        result.aiScore.breakdown || {},
        result.aiScore.strengths || [],
        result.aiScore.weaknesses || [],
        result.aiScore.recommendations || []
      );

      if (saveResult.success) {
        console.log('✅ AI score saved successfully');
      } else {
        console.error('❌ Failed to save AI score:', saveResult.error);
      }
    }

    return {
      success: true,
      candidateId: result.candidateId,
      analysisData: result
    };

  } catch (error: any) {
    console.error('❌ Resume analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

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
