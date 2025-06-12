
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
  error?: string;
}

/**
 * Analyser un CV avec l'IA unifiée (extraction + analyse + scoring en une seule requête)
 */
export const analyzeResumeWithAI = async (
  resumeId: string,
  resumeText: string
): Promise<CVAnalysisResult> => {
  try {
    console.log('🤖 Starting unified AI analysis for resume:', resumeId);

    // Appeler la nouvelle Edge Function unifiée
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: {
        resumeText,
        resumeId
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
 * Créer un candidat en base de données avec les données extraites ET l'analyse IA
 * FINAL: Utilise UNIQUEMENT la table candidates, aucune référence aux tables supprimées
 */
const createCandidateFromExtractedData = async (
  resumeId: string,
  candidateData: any,
  aiAnalysis?: AIAnalysisResult
): Promise<string> => {
  try {
    console.log('📝 Creating candidate in database with extracted data and AI analysis');
    
    const candidateToInsert = {
      resume_id: resumeId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      first_name: candidateData.first_name || '',
      last_name: candidateData.last_name || '',
      email: candidateData.email || '',
      phone: candidateData.phone || '',
      position: candidateData.position || '',
      years_experience: candidateData.years_experience || 0,
      location: candidateData.location || '',
      address: candidateData.address || '',
      postal_code: candidateData.postal_code || '',
      city: candidateData.city || '',
      country: candidateData.country || '',
      company: candidateData.company || '',
      skills: candidateData.skills || [],
      education: candidateData.education || [],
      experiences: candidateData.experiences || [],
      languages: candidateData.languages || [],
      availability: candidateData.availability || '',
      salary_expectations: candidateData.salary_expectations || '',
      contract_type: candidateData.contract_type || '',
      remote_preference: candidateData.remote_preference || '',
      mobility: candidateData.mobility || '',
      career_objectives: candidateData.career_objectives || '',
      interests: candidateData.interests || '',
      // Nouvelles colonnes AI directement stockées dans candidates
      ai_score: aiAnalysis?.score || null,
      ai_explanation: aiAnalysis?.explanation || null,
      ai_breakdown: aiAnalysis?.breakdown || {},
      ai_strengths: aiAnalysis?.strengths || [],
      ai_weaknesses: aiAnalysis?.weaknesses || [],
      ai_recommendations: aiAnalysis?.recommendations || [],
      ai_analyzed_at: aiAnalysis ? new Date().toISOString() : null,
      // Score général basé sur l'analyse AI ou valeur par défaut
      score: aiAnalysis?.score || 50
    };

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateToInsert)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating candidate:', error);
      throw new Error(`Erreur lors de la création du candidat: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('Aucun ID de candidat retourné');
    }

    console.log('✅ Candidate created successfully with ID and AI data:', data.id);
    return data.id;

  } catch (error: any) {
    console.error('❌ Failed to create candidate:', error);
    throw error;
  }
};

/**
 * Analyser un CV complet (extraction + analyse IA + création candidat + sauvegarde) - version unifiée
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

    // Analyser avec l'IA unifiée
    const analysisResult = await analyzeResumeWithAI(resumeId, text);
    
    if (!analysisResult.success || !analysisResult.candidateData) {
      return {
        success: false,
        message: analysisResult.error || 'Échec de l\'analyse unifiée'
      };
    }

    // Créer le candidat en base de données avec les données extraites ET l'analyse IA
    const candidateId = await createCandidateFromExtractedData(
      resumeId, 
      analysisResult.candidateData,
      analysisResult.analysis
    );

    // Marquer le CV comme analysé
    await supabase
      .from('resumes')
      .update({ parsed: true })
      .eq('id', resumeId);

    console.log('🎯 Analysis complete - candidate created with embedded AI analysis:', candidateId);

    return {
      success: true,
      candidateId: candidateId,
      candidateData: { ...analysisResult.candidateData, id: candidateId },
      analysis: analysisResult.analysis,
      message: 'CV analysé et candidat créé avec succès'
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
