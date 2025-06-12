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

export interface TextExtractionResult {
  success: boolean;
  text?: string;
  message?: string;
}

export interface ResumeAnalysisResult {
  success: boolean;
  candidateId?: string;
  candidateData?: any;
  message?: string;
  analysis?: AIAnalysisResult;
}

/**
 * Analyser un CV avec l'IA unifiée (extraction + analyse + scoring en une seule requête)
 */
export const analyzeResumeWithAI = async (
  candidateData: any,
  resumeText: string
): Promise<CVAnalysisResult> => {
  try {
    console.log('🤖 Starting unified AI analysis for candidate:', candidateData.id);

    // Appeler la nouvelle Edge Function unifiée
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: {
        resumeText,
        resumeId: candidateData.resume_id || 'unknown'
      }
    });

    if (error) {
      console.error('❌ Error calling unified analyze-resume function:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Unified analysis failed');
    }

    const analysis: AIAnalysisResult = data.analysis;
    const extractedCandidateData = data.candidateData;
    
    console.log('✅ Unified AI analysis completed:', {
      score: analysis.score,
      hasExplanation: !!analysis.explanation,
      hasBreakdown: !!analysis.breakdown,
      strengthsCount: analysis.strengths?.length || 0,
      weaknessesCount: analysis.weaknesses?.length || 0,
      recommendationsCount: analysis.recommendations?.length || 0,
      extractedName: `${extractedCandidateData.first_name} ${extractedCandidateData.last_name}`
    });

    // Sauvegarder automatiquement le score IA en base de données
    await saveAIScoreToDatabase(candidateData.id, analysis);

    return {
      success: true,
      candidateData: extractedCandidateData,
      analysis
    };

  } catch (error: any) {
    console.error('❌ Error in unified analyzeResumeWithAI:', error);
    toast({
      title: "Erreur d'analyse IA unifiée",
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
 * Extraire le texte d'un CV à partir de son ID
 */
export const extractResumeText = async (resumeId: string): Promise<TextExtractionResult> => {
  try {
    console.log('Starting text extraction for resume:', resumeId);
    
    // Get the file path from the database
    console.log('Fetching resume data from database');
    const { data: resumeData, error: fetchError } = await supabase
      .from("resumes")
      .select("file_path")
      .eq("id", resumeId)
      .single();
      
    if (fetchError) {
      console.error('Failed to get resume data:', fetchError);
      throw new Error('Impossible de récupérer les informations du CV');
    }
    
    if (!resumeData || !resumeData.file_path) {
      throw new Error('Chemin du fichier non trouvé pour ce CV');
    }
    
    const filePath = resumeData.file_path;
    console.log('Got file path from database:', filePath);
    
    // Get the public URL for the file
    console.log('Getting public URL for file path:', filePath);
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for file');
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }
    
    console.log('Public URL obtained:', urlData.publicUrl);
    
    // Ensure the request body is properly formatted
    const requestBody = { 
      pdfUrl: urlData.publicUrl,
      resumeId: resumeId
    };
    
    console.log('Request body for edge function:', requestBody);
    
    // Call the edge function with the PDF URL
    console.log('Invoking extract-cv-text edge function');
    const { data, error } = await supabase.functions.invoke('extract-cv-text', {
      body: requestBody
    });
    
    console.log('Edge function response:', { data, error });
    
    if (error) {
      console.error('Error invoking extract-cv-text function:', error);
      throw new Error(`Erreur lors de l'extraction du texte: ${error.message}`);
    }
    
    if (!data) {
      console.error('No data received from edge function');
      throw new Error('Aucune réponse reçue de la fonction d\'extraction');
    }
    
    if (!data.success) {
      console.error('Text extraction failed:', data.error || 'Raison inconnue');
      throw new Error(data.error || 'Extraction du texte échouée');
    }
    
    console.log('Text extraction successful, length:', data.data?.text?.length || 0);
    
    // Check that extracted text is not empty
    if (!data.data?.text || data.data.text.trim() === '') {
      throw new Error('Le texte extrait est vide');
    }
    
    console.log('Sample of extracted text:', data.data.text.substring(0, 200) + '...');
    
    // Return the extracted text
    return { 
      success: true, 
      message: "Texte extrait avec succès",
      text: data.data.text
    };
  } catch (error: any) {
    console.error('Text extraction error:', error);
    return { 
      success: false, 
      message: error.message || "Échec de l'extraction du texte"
    };
  }
};

/**
 * Analyser un CV complet (extraction + analyse IA + sauvegarde) - version unifiée
 */
export const analyzeResume = async (
  resumeId: string,
  resumeText?: string,
  overwriteExisting: boolean = false
): Promise<ResumeAnalysisResult> => {
  try {
    let text = resumeText;
    
    // Si le texte n'est pas fourni, l'extraire
    if (!text) {
      const extractResult = await extractResumeText(resumeId);
      if (!extractResult.success || !extractResult.text) {
        return {
          success: false,
          message: extractResult.message || 'Impossible d\'extraire le texte du CV'
        };
      }
      text = extractResult.text;
    }

    // Appeler directement l'analyse unifiée
    const result = await analyzeResumeWithAI({ resume_id: resumeId }, text);
    
    if (result.success && result.candidateData) {
      return {
        success: true,
        candidateId: result.candidateData.id,
        candidateData: result.candidateData,
        analysis: result.analysis
      };
    }

    return {
      success: false,
      message: result.error || 'Échec de l\'analyse unifiée'
    };

  } catch (error: any) {
    console.error('Error in unified analyzeResume:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Sauvegarder le score IA dans la base de données avec TOUS les nouveaux paramètres
 */
const saveAIScoreToDatabase = async (
  candidateId: string,
  analysis: AIAnalysisResult
): Promise<void> => {
  try {
    console.log('💾 Saving comprehensive AI score to database for candidate:', candidateId);
    console.log('📊 Analysis data to save:', {
      score: analysis.score,
      explanationLength: analysis.explanation?.length || 0,
      strengthsCount: analysis.strengths?.length || 0,
      weaknessesCount: analysis.weaknesses?.length || 0,
      recommendationsCount: analysis.recommendations?.length || 0,
      breakdown: analysis.breakdown
    });

    // S'assurer que les arrays sont au bon format
    const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
    const weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
    const recommendations = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];

    console.log('🔧 Formatted arrays for database:', {
      strengthsCount: strengths.length,
      weaknessesCount: weaknesses.length,
      recommendationsCount: recommendations.length,
      strengthsSample: strengths.slice(0, 1),
      weaknessesSample: weaknesses.slice(0, 1),
      recommendationsSample: recommendations.slice(0, 1)
    });

    // Utiliser la fonction RPC mise à jour avec TOUS les nouveaux paramètres
    const { data, error } = await supabase.rpc('save_ai_candidate_score', {
      p_candidate_id: candidateId,
      p_score: analysis.score,
      p_explanation: analysis.explanation || '',
      p_job_offer_id: null, // Score de complétude générale
      p_breakdown: analysis.breakdown || {},
      p_strengths: strengths,
      p_weaknesses: weaknesses,
      p_recommendations: recommendations
    });

    if (error) {
      console.error('❌ Error saving comprehensive AI score:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Comprehensive AI score saved successfully:', {
      savedData: data,
      candidateId: candidateId
    });

    // Vérifier que la sauvegarde a bien fonctionné
    if (!data || data.length === 0) {
      console.warn('⚠️ Save operation completed but no data returned');
      throw new Error('No data returned from save operation');
    } else {
      console.log('🎉 AI score save confirmed with data:', data[0]);
    }

  } catch (error: any) {
    console.error('❌ Failed to save comprehensive AI score:', error);
    throw error; // Re-throw pour que l'appelant puisse gérer l'erreur
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
