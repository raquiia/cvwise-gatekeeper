
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { extractFieldValue, extractNumberValue, extractArrayValue } from '@/components/candidates/edit/dataExtractionUtils';

// Defining the complete CandidateData interface with all properties
export interface CandidateData {
  id?: string;
  user_id?: string;
  resume_id?: string;
  first_name: string; // Changed from optional to required
  last_name: string; // Changed from optional to required
  email?: string;
  phone?: string;
  position?: string;
  years_experience?: number;
  location?: string;
  skills?: any[];
  score?: number;
  status?: string;
  detailed_status?: string;
  company?: string;
  created_at?: string;
  updated_at?: string;
  
  // Additional candidate fields for detailed view
  experiences?: any[];
  education?: any[];
  certifications?: any[];
  languages?: any[];
  publications?: any[];
  interests?: string;
  professional_references?: any[];
  availability?: string;
  salary_expectations?: string;
  mobility?: string;
  contract_type?: string;
  remote_preference?: string;
  travel_willingness?: string;
  professional_networks?: any[];
  continuous_training?: any[];
  career_objectives?: string;
  professional_values?: string;
  work_authorization?: string;
  special_permits?: any[];
  industries?: any[];
  projects?: any[];
  profile_completeness?: number;
  last_updated_at?: string;
  matchDetails?: any; // For matching functionality
}

// Define options for creating and updating candidates
export interface CreateCandidateOptions {
  user_id: string; // Required
  first_name: string; // Required
  last_name: string; // Required
  resume_id?: string;
  email?: string;
  phone?: string;
  position?: string;
  years_experience?: number;
  location?: string;
  skills?: any[];
  score?: number;
  status?: string;
  detailed_status?: string;
  company?: string;
  experiences?: any[];
  education?: any[];
  certifications?: any[];
  languages?: any[];
  publications?: any[];
  interests?: string;
  professional_references?: any[];
  availability?: string;
  salary_expectations?: string;
  mobility?: string;
  contract_type?: string;
  remote_preference?: string;
  travel_willingness?: string;
  professional_networks?: any[];
  continuous_training?: any[];
  career_objectives?: string;
  professional_values?: string;
  work_authorization?: string;
  special_permits?: any[];
  industries?: any[];
  projects?: any[];
  profile_completeness?: number;
}

export interface UpdateCandidateOptions extends Partial<Omit<CandidateData, 'id'>> {
  id: string;
}

// Valid status values for detailed_status field
const VALID_DETAILED_STATUSES = [
  'initial', 'contact', 'prequalification', 'ec1', 'ec2', 
  'presentation_client', 'en_mission', 'refus', 'ancien_employe'
];

// ULTRA-ROBUSTE: Fonction d'extraction améliorée pour tous les formats de données
const extractStringValue = (field: any): string | undefined => {
  console.log('🔍 Enhanced extracting field:', field, 'Type:', typeof field);
  
  // Si null ou undefined, return undefined
  if (field === null || field === undefined) {
    console.log('⚪ Field is null/undefined');
    return undefined;
  }
  
  // Si c'est déjà une chaîne valide
  if (typeof field === 'string') {
    // Si c'est vide, "undefined", ou "null" string, return undefined
    if (field === '' || field === 'undefined' || field === 'null') {
      console.log('⚪ Field is empty string or string "undefined"');
      return undefined;
    }
    console.log('✅ Field is valid string:', field);
    return field;
  }
  
  // CORRECTION CRITIQUE: Gérer les objets complexes avec _type et value
  if (typeof field === 'object' && field !== null) {
    console.log('🔧 Field is object, checking for _type/value structure:', field);
    
    // Format problématique: {_type: "undefined", value: "actual_data"}
    if (field.hasOwnProperty('_type') && field.hasOwnProperty('value')) {
      console.log('🎯 Found _type/value structure - value:', field.value);
      
      // Si le value contient des vraies données (pas "undefined"), on le retourne
      if (field.value && field.value !== 'undefined' && field.value !== 'null' && field.value !== '') {
        console.log('✅ Extracted real value from object:', field.value);
        return String(field.value);
      } else {
        console.log('⚪ Object value is empty or undefined');
        return undefined;
      }
    }
    
    // Format direct: {value: "some_data"}
    if (field.hasOwnProperty('value') && !field.hasOwnProperty('_type')) {
      console.log('🎯 Found simple value structure:', field.value);
      if (field.value && field.value !== 'undefined' && field.value !== 'null' && field.value !== '') {
        console.log('✅ Extracted value from simple object:', field.value);
        return String(field.value);
      }
    }
    
    console.log('⚠️ Object format not recognized, returning undefined');
    return undefined;
  }
  
  // Si c'est un nombre, convertir en string
  if (typeof field === 'number') {
    console.log('✅ Field is number, converting:', field);
    return String(field);
  }
  
  console.log('⚠️ Field has unexpected type, returning undefined');
  return undefined;
};

// Fonction d'extraction des nombres sécurisée
const extractLocalNumberValue = (field: any): number | undefined => {
  console.log('🔢 Enhanced extracting number from:', field);
  
  if (field === null || field === undefined) return undefined;
  if (typeof field === 'number') return field;
  
  // Gérer les objets complexes
  if (typeof field === 'object' && field !== null) {
    if (field.hasOwnProperty('_type') && field.hasOwnProperty('value')) {
      if (field.value && field.value !== 'undefined' && field.value !== 'null') {
        const parsed = parseInt(String(field.value), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
    }
    if (field.hasOwnProperty('value') && !field.hasOwnProperty('_type')) {
      if (field.value && field.value !== 'undefined' && field.value !== 'null') {
        const parsed = parseInt(String(field.value), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
    }
    return undefined;
  }
  
  if (typeof field === 'string') {
    if (field === '' || field === 'undefined' || field === 'null') return undefined;
    const parsed = parseInt(field, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  
  return undefined;
};

// ENTIÈREMENT RÉÉCRITE: fonction formatCandidateData avec extraction robuste
export const formatCandidateData = (candidate: any): CandidateData => {
  if (!candidate) return null as unknown as CandidateData;
  
  console.log('🚀 RAW CANDIDATE DATA FROM DATABASE:', JSON.stringify(candidate, null, 2));
  
  // CORRECTION CRITIQUE: Ne pas utiliser extractFieldValue sur detailed_status car c'est déjà une chaîne simple
  const rawDetailedStatus = candidate.detailed_status;
  let detailedStatus = 'initial'; // valeur par défaut
  
  if (rawDetailedStatus && typeof rawDetailedStatus === 'string' && rawDetailedStatus.trim() !== '') {
    detailedStatus = rawDetailedStatus.trim();
    console.log('📍 Using direct detailed_status from DB:', detailedStatus);
  } else {
    console.log('📍 No valid detailed_status, using default:', detailedStatus);
  }
  
  const formatted = {
    id: candidate.id,
    user_id: candidate.user_id,
    resume_id: candidate.resume_id,
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: extractFieldValue(candidate.email),
    phone: extractFieldValue(candidate.phone),
    position: extractFieldValue(candidate.position),
    years_experience: extractNumberValue(candidate.years_experience),
    location: extractFieldValue(candidate.location),
    skills: extractArrayValue(candidate.skills),
    score: extractNumberValue(candidate.score),
    status: extractFieldValue(candidate.status) || 'pending',
    detailed_status: detailedStatus, // CORRECTION: utiliser la valeur directe
    company: extractFieldValue(candidate.company),
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    experiences: extractArrayValue(candidate.experiences),
    education: extractArrayValue(candidate.education),
    certifications: extractArrayValue(candidate.certifications),
    languages: extractArrayValue(candidate.languages),
    publications: extractArrayValue(candidate.publications),
    interests: extractFieldValue(candidate.interests),
    professional_references: extractArrayValue(candidate.professional_references),
    availability: extractFieldValue(candidate.availability),
    salary_expectations: extractFieldValue(candidate.salary_expectations),
    mobility: extractFieldValue(candidate.mobility),
    contract_type: extractFieldValue(candidate.contract_type),
    remote_preference: extractFieldValue(candidate.remote_preference),
    travel_willingness: extractFieldValue(candidate.travel_willingness),
    professional_networks: extractArrayValue(candidate.professional_networks),
    continuous_training: extractArrayValue(candidate.continuous_training),
    career_objectives: extractFieldValue(candidate.career_objectives),
    professional_values: extractFieldValue(candidate.professional_values),
    work_authorization: extractFieldValue(candidate.work_authorization),
    special_permits: extractArrayValue(candidate.special_permits),
    industries: extractArrayValue(candidate.industries),
    projects: extractArrayValue(candidate.projects),
    profile_completeness: extractNumberValue(candidate.profile_completeness),
    last_updated_at: candidate.last_updated_at
  };

  console.log('🎯 FORMATTED CANDIDATE DATA:', JSON.stringify(formatted, null, 2));
  console.log('🏷️  Detailed status specifically:', formatted.detailed_status);
  console.log('🏢 Company value specifically:', formatted.company);

  return formatted;
};

// Define the candidate service with all CRUD operations
export const candidateService = {
  getUserCandidates: async (): Promise<CandidateData[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_candidates', {
        user_id_param: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      return data.map(formatCandidateData);
    } catch (error: any) {
      console.error('Error in getUserCandidates:', error);
      throw new Error(`Failed to get candidates: ${error.message}`);
    }
  },
  
  getCandidateById: async (candidateId: string): Promise<CandidateData> => {
    try {
      console.log('🔍 Fetching candidate by ID:', candidateId);
      
      const { data, error } = await supabase.rpc('get_candidate_by_id', {
        candidate_id_param: candidateId
      });
      
      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }
      
      console.log('📥 RAW RPC RESPONSE:', JSON.stringify(data, null, 2));
      
      if (!data || data.length === 0) {
        throw new Error('Candidate not found');
      }
      
      // This should be formatted as a single CandidateData object
      const formatted = formatCandidateData(data[0]);
      console.log('✅ FINAL FORMATTED RESULT:', JSON.stringify(formatted, null, 2));
      
      return formatted;
    } catch (error: any) {
      console.error('Error in getCandidateById:', error);
      throw new Error(`Failed to get candidate: ${error.message}`);
    }
  },
  
  createCandidate: async (options: CreateCandidateOptions): Promise<CandidateData> => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert(options)
        .select('*')
        .single();
      
      if (error) throw error;
      return formatCandidateData(data);
    } catch (error: any) {
      console.error('Error in createCandidate:', error);
      throw new Error(`Failed to create candidate: ${error.message}`);
    }
  },
  
  updateCandidate: async (options: UpdateCandidateOptions): Promise<CandidateData> => {
    try {
      const { id, ...updateData } = options;
      
      console.log('Updating candidate with ID:', id);
      console.log('Update data received:', updateData);
      
      // CRITICAL FIX: Only validate detailed_status if it's explicitly being updated
      // Don't modify it if it's not provided in the update
      if (updateData.hasOwnProperty('detailed_status') && updateData.detailed_status !== undefined) {
        if (!updateData.detailed_status || updateData.detailed_status === '') {
          updateData.detailed_status = 'initial';
        } else if (!VALID_DETAILED_STATUSES.includes(updateData.detailed_status)) {
          console.warn(`Invalid detailed_status "${updateData.detailed_status}", setting to initial`);
          updateData.detailed_status = 'initial';
        }
      }
      
      console.log('Final update data being sent to RPC:', updateData);
      
      // Use the secure RPC function to bypass RLS issues
      const { data, error } = await supabase.rpc(
        'update_candidate_secure',
        {
          p_candidate_id: id,
          p_data: updateData
        }
      );
      
      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Update returned no data');
      }
      
      console.log('Update successful, returned data:', data);
      return formatCandidateData(data[0]);
    } catch (error: any) {
      console.error('Error in updateCandidate:', error);
      throw new Error(`Failed to update candidate: ${error.message}`);
    }
  },
  
  deleteCandidate: async (candidateId: string, deleteResume: boolean = false): Promise<boolean> => {
    try {
      let resumeId: string | null = null;
      
      if (deleteResume) {
        try {
          const { data, error } = await supabase
            .from('candidates')
            .select('resume_id')
            .eq('id', candidateId)
            .single();
          
          if (!error && data) {
            resumeId = data.resume_id;
          }
        } catch (err) {
          console.warn('Failed to get resume_id for candidate:', err);
        }
      }
      
      console.log(`Starting deletion process for candidate ${candidateId}, resume: ${resumeId}`);
      
      const { data, error } = await supabase.rpc('delete_candidate_secure', {
        candidate_id_param: candidateId
      });
      
      if (error) {
        console.error('Error during candidate deletion via RPC:', error);
        
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? String(error.message || 'Unknown error') 
          : 'Unknown error';
          
        if (errorMessage.includes('infinite recursion') || 
            errorMessage.includes('recursion infinie') ||
            errorMessage.includes('recursive')) {
          throw new Error(`Erreur de récursion infinie détectée lors de la suppression. Il s'agit d'un problème de configuration de sécurité. Veuillez réessayer plus tard.`);
        }
        
        throw new Error(`Failed to delete candidate: ${errorMessage}`);
      }
      
      console.log(`Successfully deleted candidate ${candidateId} via secure RPC function`);
      
      if (deleteResume && resumeId) {
        await handleResumeDelete(resumeId);
      }
      
      return true;
    } catch (error: unknown) {
      console.error('Error in deleteCandidate:', error);
      
      const errorMessage = error && 
        typeof error === 'object' && 'message' in error ? 
        String(error.message || 'Unknown error') : 
        'Unknown error';
        
      if (errorMessage.includes('infinite recursion') || 
          errorMessage.includes('recursion infinie') ||
          errorMessage.includes('recursive')) {
        throw new Error(`Erreur de récursion infinie détectée lors de la suppression. Il s'agit d'un problème de configuration de sécurité. Veuillez réessayer plus tard.`);
      }
      
      throw new Error(`Failed to delete candidate: ${errorMessage}`);
    }
  },
  
  updateCandidateStatus: async (candidateId: string, status: string): Promise<CandidateData> => {
    try {
      const { data, error } = await supabase.rpc(
        'update_candidate_secure',
        {
          p_candidate_id: candidateId,
          p_data: { status }
        }
      );
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Update status returned no data');
      }
      
      return formatCandidateData(data[0]);
    } catch (error: any) {
      console.error('Error in updateCandidateStatus:', error);
      throw new Error(`Failed to update candidate status: ${error.message}`);
    }
  }
};

// Helper function for resume deletion
async function handleResumeDelete(resumeId: string): Promise<void> {
  console.log(`Attempting to delete resume ${resumeId}`);
  try {
    const { error: resumeError } = await supabase.rpc('delete_resume_by_id', {
      resume_id_param: resumeId
    });
    
    if (resumeError) {
      console.error('Error deleting resume:', resumeError);
    }
  } catch (resumeDeleteError) {
    console.error('Exception deleting resume:', resumeDeleteError);
  }
}
