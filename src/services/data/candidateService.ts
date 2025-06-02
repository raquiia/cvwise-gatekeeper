
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

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

// FIXED: Helper function to safely extract values - preserving actual data
const safeExtractValue = (field: any): string | undefined => {
  console.log('Processing field:', field, 'Type:', typeof field);
  
  // If null or undefined, return undefined
  if (field === null || field === undefined) {
    return undefined;
  }
  
  // If it's already a string, return it directly (unless it's "undefined" or empty)
  if (typeof field === 'string') {
    if (field === '' || field === 'undefined') {
      return undefined;
    }
    return field;
  }
  
  // Handle object format like {_type: "undefined", value: "some_value"} or {value: "some_value"}
  if (typeof field === 'object' && !Array.isArray(field)) {
    // If it has the _type: "undefined" structure, check the value
    if (field._type === 'undefined' && field.value) {
      if (field.value === "undefined" || field.value === "") {
        return undefined;
      }
      return String(field.value);
    }
    
    // If it has a value property, use it
    if (field.value !== undefined && field.value !== null) {
      if (field.value === "undefined" || field.value === "") {
        return undefined;
      }
      return String(field.value);
    }
    
    // Try to stringify the object if it's not empty
    try {
      const stringified = JSON.stringify(field);
      if (stringified !== '{}' && stringified !== 'null') {
        return stringified;
      }
    } catch (e) {
      // If can't stringify, return undefined
    }
    
    return undefined;
  }
  
  // For any other type, convert to string if it's not empty
  const stringValue = String(field);
  return (stringValue === '' || stringValue === 'undefined' || stringValue === 'null') ? undefined : stringValue;
};

// Helper function to safely extract number values
const extractNumberValue = (field: any): number | undefined => {
  if (!field) return undefined;
  if (typeof field === 'number') return field;
  if (typeof field === 'object' && !Array.isArray(field) && field._type === 'undefined') return undefined;
  if (typeof field === 'object' && !Array.isArray(field) && field.value !== undefined) {
    const val = field.value;
    return typeof val === 'number' ? val : undefined;
  }
  const parsed = parseInt(String(field), 10);
  return isNaN(parsed) ? undefined : parsed;
};

// CRITICAL FIX: Format candidate data to preserve all existing values
const formatCandidateData = (candidate: any): CandidateData => {
  if (!candidate) return null as unknown as CandidateData;
  
  console.log('Raw candidate data received:', candidate);
  
  // Convert JSON fields to arrays if they're strings or ensure they're arrays
  const ensureArray = (field: Json | null): any[] => {
    if (!field) return [];
    if (typeof field === 'object' && !Array.isArray(field) && field._type === 'undefined') return [];
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return [field];
      }
    }
    return Array.isArray(field) ? field : [field];
  };

  const formatted = {
    id: candidate.id,
    user_id: candidate.user_id,
    resume_id: candidate.resume_id,
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: safeExtractValue(candidate.email),
    phone: safeExtractValue(candidate.phone),
    position: safeExtractValue(candidate.position),
    years_experience: extractNumberValue(candidate.years_experience),
    location: safeExtractValue(candidate.location),
    skills: ensureArray(candidate.skills),
    score: extractNumberValue(candidate.score),
    status: safeExtractValue(candidate.status) || 'pending',
    detailed_status: safeExtractValue(candidate.detailed_status),
    company: safeExtractValue(candidate.company), // CRITICAL: This must preserve the actual company value
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    experiences: ensureArray(candidate.experiences),
    education: ensureArray(candidate.education),
    certifications: ensureArray(candidate.certifications),
    languages: ensureArray(candidate.languages),
    publications: ensureArray(candidate.publications),
    interests: safeExtractValue(candidate.interests),
    professional_references: ensureArray(candidate.professional_references),
    availability: safeExtractValue(candidate.availability),
    salary_expectations: safeExtractValue(candidate.salary_expectations),
    mobility: safeExtractValue(candidate.mobility),
    contract_type: safeExtractValue(candidate.contract_type),
    remote_preference: safeExtractValue(candidate.remote_preference),
    travel_willingness: safeExtractValue(candidate.travel_willingness),
    professional_networks: ensureArray(candidate.professional_networks),
    continuous_training: ensureArray(candidate.continuous_training),
    career_objectives: safeExtractValue(candidate.career_objectives),
    professional_values: safeExtractValue(candidate.professional_values),
    work_authorization: safeExtractValue(candidate.work_authorization),
    special_permits: ensureArray(candidate.special_permits),
    industries: ensureArray(candidate.industries),
    projects: ensureArray(candidate.projects),
    profile_completeness: extractNumberValue(candidate.profile_completeness),
    last_updated_at: candidate.last_updated_at
  };

  console.log('Formatted candidate data:', formatted);
  console.log('Company value specifically:', formatted.company);
  console.log('Remote preference value specifically:', formatted.remote_preference);
  console.log('Mobility value specifically:', formatted.mobility);

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
      const { data, error } = await supabase.rpc('get_candidate_by_id', {
        candidate_id_param: candidateId
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Candidate not found');
      }
      
      // This should be formatted as a single CandidateData object
      return formatCandidateData(data[0]);
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
