
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Extraire le texte d'un CV à partir de son ID
 */
export const extractResumeText = async (resumeId: string, filePath: string): Promise<{ success: boolean; message?: string; text?: string }> => {
  try {
    console.log('Starting text extraction for resume:', resumeId);
    
    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for file');
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }
    
    // Appel à l'edge function d'extraction de texte
    const { data, error } = await supabase.functions.invoke('extract-cv-text', {
      body: { 
        pdfUrl: urlData.publicUrl,
        resumeId: resumeId
      }
    });
    
    if (error) {
      console.error('Error invoking extract-cv-text function:', error);
      throw new Error(`Erreur lors de l'extraction du texte: ${error.message}`);
    }
    
    if (!data || !data.success) {
      console.error('Text extraction failed:', data?.error || 'Raison inconnue');
      throw new Error(data?.error || 'Extraction du texte échouée');
    }
    
    console.log('Text extraction successful');
    
    // Retourner le texte extrait
    return { 
      success: true, 
      message: "Texte extrait avec succès",
      text: data.data?.text || ''
    };
  } catch (error: any) {
    console.error('Text extraction error:', error);
    toast({
      title: "Échec de l'extraction",
      description: error.message || "Une erreur est survenue lors de l'extraction du texte",
      variant: "destructive",
    });
    return { 
      success: false, 
      message: error.message || "Échec de l'extraction du texte"
    };
  }
};

/**
 * Analyser un CV avec l'IA et créer automatiquement un candidat
 */
export const analyzeResume = async (resumeId: string, resumeText: string): Promise<{ success: boolean; message?: string; candidateId?: string }> => {
  try {
    console.log('Starting AI analysis for resume:', resumeId);
    
    if (!resumeText || resumeText.trim() === '') {
      throw new Error('Le texte du CV est vide ou non défini');
    }
    
    console.log(`Text length being sent to OpenAI: ${resumeText.length} characters`);
    console.log('Sample of the text being sent:', resumeText.substring(0, 200) + '...');
    
    // Appel à l'edge function d'analyse de CV
    const { data, error } = await supabase.functions.invoke('resume-ai-analysis', {
      body: { 
        resumeId: resumeId,
        resumeText: resumeText
      }
    });
    
    if (error) {
      console.error('Error invoking resume-ai-analysis function:', error);
      throw new Error(`Erreur lors de l'analyse du CV: ${error.message}`);
    }
    
    if (!data || !data.success) {
      console.error('Resume analysis failed:', data?.error || 'Raison inconnue');
      throw new Error(data?.error || 'Analyse du CV échouée');
    }
    
    console.log('AI analysis successful, candidate created:', data.candidate?.id);
    
    // Vérifier les structures complexes pour debugging
    if (data.candidate) {
      // Check résumé des données analysées
      console.log('Parsed data from OpenAI:', data.parsed_data ? JSON.stringify(data.parsed_data).substring(0, 200) + '...' : 'No parsed data');
      
      // Vérifier les structures complexes pour debugging
      console.log('Experiences:', typeof data.candidate.experiences, Array.isArray(data.candidate.experiences) ? data.candidate.experiences.length : 'Not an array');
      console.log('Education:', typeof data.candidate.education, Array.isArray(data.candidate.education) ? data.candidate.education.length : 'Not an array');
      console.log('Skills:', typeof data.candidate.skills, Array.isArray(data.candidate.skills) ? data.candidate.skills.length : 'Not an array');
      console.log('Languages:', typeof data.candidate.languages, Array.isArray(data.candidate.languages) ? data.candidate.languages.length : 'Not an array');
      console.log('Certifications:', typeof data.candidate.certifications, Array.isArray(data.candidate.certifications) ? data.candidate.certifications.length : 'Not an array');
      console.log('Projects:', typeof data.candidate.projects, Array.isArray(data.candidate.projects) ? data.candidate.projects.length : 'Not an array');
      
      // Afficher un échantillon des données d'expérience si disponibles
      if (Array.isArray(data.candidate.experiences) && data.candidate.experiences.length > 0) {
        console.log('Sample experience:', JSON.stringify(data.candidate.experiences[0]));
      }
      
      // Afficher un échantillon des données d'éducation si disponibles
      if (Array.isArray(data.candidate.education) && data.candidate.education.length > 0) {
        console.log('Sample education:', JSON.stringify(data.candidate.education[0]));
      }
    }
    
    toast({
      title: "Analyse terminée",
      description: "Le CV a été analysé avec succès et un candidat a été créé",
    });
    
    return { 
      success: true, 
      message: "CV analysé avec succès",
      candidateId: data.candidate?.id
    };
  } catch (error: any) {
    console.error('Resume analysis error:', error);
    toast({
      title: "Échec de l'analyse",
      description: error.message || "Une erreur est survenue lors de l'analyse du CV",
      variant: "destructive",
    });
    return { 
      success: false, 
      message: error.message || "Échec de l'analyse du CV"
    };
  }
};

// Define type interfaces for candidate data
export interface CandidateExperience {
  title?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  description?: string;
  skills?: string[];
}

export interface CandidateEducation {
  degree?: string;
  institution?: string;
  school?: string;
  start_date?: string;
  end_date?: string;
  year?: string;
  location?: string;
  description?: string;
}

export interface CandidateCertification {
  name?: string;
  title?: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface CandidateLanguage {
  language?: string;
  level?: string;
}

export interface CandidateProject {
  name?: string;
  title?: string;
  description?: string;
  technologies?: string;
  date?: string;
  role?: string;
  url?: string;
}

export interface CandidateReference {
  name?: string;
  position?: string;
  company?: string;
  contact?: string;
}

export interface CandidateNetwork {
  platform?: string;
  name?: string;
  url?: string;
}

export interface CandidateData {
  id: string;
  resume_id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  years_experience?: number;
  location?: string;
  interests?: string;
  availability?: string;
  salary_expectations?: string;
  mobility?: string;
  contract_type?: string;
  remote_preference?: string;
  travel_willingness?: string;
  career_objectives?: string;
  professional_values?: string;
  work_authorization?: string;
  status?: string;
  score?: number;
  profile_completeness?: number;
  created_at?: string;
  updated_at?: string;
  skills: string[];
  experiences: CandidateExperience[];
  education: CandidateEducation[];
  certifications: CandidateCertification[];
  languages: CandidateLanguage[];
  projects: CandidateProject[];
  professional_references: CandidateReference[];
  professional_networks: CandidateNetwork[];
  industries: string[];
}

/**
 * Récupérer les données complètes d'un candidat
 */
export const getCompleteCandidateData = async (candidateId: string): Promise<CandidateData> => {
  try {
    console.log('Fetching complete data for candidate:', candidateId);
    
    // Utiliser une requête directe à la table au lieu d'une fonction RPC pour éviter
    // les problèmes de récursion infinie dans les politiques RLS
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();
    
    if (error) {
      console.error('Error fetching candidate data:', error);
      throw new Error(`Erreur lors de la récupération des données du candidat: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Candidat non trouvé');
    }
    
    // Formater les données au format CandidateData
    const formattedData: CandidateData = {
      ...data,
      experiences: ensureArrayWithType<CandidateExperience>(data.experiences),
      education: ensureArrayWithType<CandidateEducation>(data.education),
      skills: ensureArrayWithType<string>(data.skills),
      languages: ensureArrayWithType<CandidateLanguage>(data.languages),
      certifications: ensureArrayWithType<CandidateCertification>(data.certifications),
      projects: ensureArrayWithType<CandidateProject>(data.projects),
      professional_references: ensureArrayWithType<CandidateReference>(data.professional_references),
      professional_networks: ensureArrayWithType<CandidateNetwork>(data.professional_networks),
      industries: ensureArrayWithType<string>(data.industries)
    };
    
    console.log('Formatted candidate data:', {
      experiences: formattedData.experiences.length,
      education: formattedData.education.length,
      languages: formattedData.languages.length
    });
    
    return formattedData;
  } catch (error: any) {
    console.error('Error getting complete candidate data:', error);
    toast({
      title: "Erreur de données",
      description: error.message || "Une erreur est survenue lors de la récupération des données du candidat",
      variant: "destructive",
    });
    throw error;
  }
};

/**
 * Assure qu'un champ possiblement JSON, array ou string est transformé en tableau du type spécifié
 */
function ensureArrayWithType<T>(data: unknown): T[] {
  if (!data) return [];
  
  // Si c'est déjà un tableau, le retourner
  if (Array.isArray(data)) {
    return data as T[];
  }
  
  // Si c'est une string, essayer de la parser comme JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed as T[] : [data as unknown as T];
    } catch (e) {
      // Si le parsing échoue, retourner la string comme élément unique du tableau
      return [data as unknown as T];
    }
  }
  
  // Si c'est un objet JSON, le retourner comme élément unique du tableau
  if (typeof data === 'object' && data !== null) {
    return [data as T];
  }
  
  // Pour les valeurs primitives (number, boolean), les retourner comme élément unique
  return [data as unknown as T];
}

/**
 * Version simplifiée sans type générique pour la compatibilité avec le code existant
 */
function ensureArray(data: unknown): any[] {
  return ensureArrayWithType<any>(data);
}
