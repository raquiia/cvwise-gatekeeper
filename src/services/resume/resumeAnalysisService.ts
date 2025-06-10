
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AIAnalysisResult {
  score: number;
  explanation: string;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    languages?: number;
    location?: number;
    profileSummary?: number;
    cvStructure?: number;
  };
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

export interface CVAnalysisResult {
  success: boolean;
  candidateData?: any;
  analysis?: AIAnalysisResult;
  error?: string;
}

/**
 * Analyser un CV avec l'IA et sauvegarder le score automatiquement
 */
export const analyzeResumeWithAI = async (
  candidateData: any,
  resumeText: string
): Promise<CVAnalysisResult> => {
  try {
    console.log('🤖 Starting AI analysis for candidate:', candidateData.id);

    // Appeler l'Edge Function d'analyse
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: {
        candidateData,
        resumeText
      }
    });

    if (error) {
      console.error('❌ Error calling analyze-resume function:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    const analysis: AIAnalysisResult = data.analysis;
    
    console.log('✅ AI analysis completed:', {
      score: analysis.score,
      hasExplanation: !!analysis.explanation,
      hasBreakdown: !!analysis.breakdown
    });

    // Sauvegarder automatiquement le score IA en base de données
    await saveAIScoreToDatabase(candidateData.id, analysis);

    return {
      success: true,
      candidateData,
      analysis
    };

  } catch (error: any) {
    console.error('❌ Error in analyzeResumeWithAI:', error);
    toast({
      title: "Erreur d'analyse IA",
      description: error.message || "Impossible d'analyser le CV avec l'IA",
      variant: "destructive",
    });
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sauvegarder le score IA dans la base de données
 */
const saveAIScoreToDatabase = async (
  candidateId: string,
  analysis: AIAnalysisResult
): Promise<void> => {
  try {
    console.log('💾 Saving AI score to database for candidate:', candidateId);

    const { data, error } = await supabase.rpc('save_ai_candidate_score', {
      p_candidate_id: candidateId,
      p_score: analysis.score,
      p_explanation: analysis.explanation,
      p_job_offer_id: null, // Score de complétude générale
      p_breakdown: analysis.breakdown
    });

    if (error) {
      console.error('❌ Error saving AI score:', error);
      throw error;
    }

    console.log('✅ AI score saved successfully:', data);

  } catch (error: any) {
    console.error('❌ Failed to save AI score:', error);
    // Ne pas faire échouer l'analyse si la sauvegarde échoue
    toast({
      title: "Avertissement",
      description: "Le score IA n'a pas pu être sauvegardé en base de données",
      variant: "default",
    });
  }
};

/**
 * Extraire les compétences depuis le texte du CV
 */
export const extractSkillsFromText = (text: string): string[] => {
  // Logique simplifiée d'extraction de compétences
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
    'Python', 'Java', 'C#', 'PHP', 'SQL', 'MongoDB', 'PostgreSQL',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Jenkins'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills;
};

/**
 * Calculer un score de complétude basique
 */
export const calculateCompletenessScore = (candidateData: any): number => {
  let score = 0;
  const fields = [
    'first_name', 'last_name', 'email', 'phone', 'position',
    'location', 'company', 'years_experience'
  ];
  
  fields.forEach(field => {
    if (candidateData[field] && candidateData[field] !== '') {
      score += 10;
    }
  });
  
  if (candidateData.skills && Array.isArray(candidateData.skills) && candidateData.skills.length > 0) {
    score += 10;
  }
  
  if (candidateData.experiences && Array.isArray(candidateData.experiences) && candidateData.experiences.length > 0) {
    score += 10;
  }
  
  return Math.min(score, 100);
};
