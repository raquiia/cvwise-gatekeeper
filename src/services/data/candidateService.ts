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

// COMPLETELY REWRITTEN: More robust value extraction
const simpleExtractValue = (field: any): string | undefined => {
  console.log('🔍 Simple extracting field:', field, 'Type:', typeof field);
  
  // If null or undefined, return undefined
  if (field === null || field === undefined) {
    console.log('⚪ Field is null/undefined');
    return undefined;
  }
  
  // If it's already a string and not empty/undefined
  if (typeof field === 'string') {
    if (field === '' || field === 'undefined' || field === 'null') {
      console.log('⚪ Field is empty string or "undefined"');
      return undefined;
    }
    console.log('✅ Field is valid string:', field);
    return field;
  }
  
  // If it's a number, convert to string
  if (typeof field === 'number') {
    console.log('✅ Field is number, converting:', field);
    return String(field);
  }
  
  // CRITICAL FIX: Better handling of object structures
  if (typeof field === 'object' && !Array.isArray(field)) {
    console.log('🔄 Field is object, checking structure:', field);
    
    // Check for the problematic _type: undefined structure
    if (field.hasOwnProperty('_type') && field._type === 'undefined') {
      console.log('⚠️ Found _type: undefined structure');
      
      // But check if the value property actually contains real data
      if (field.hasOwnProperty('value') && 
          field.value !== 'undefined' && 
          field.value !== null && 
          field.value !== '' && 
          field.value !== undefined) {
        console.log('✅ Found real data in _type:undefined object.value:', field.value);
        return String(field.value);
      }
      
      console.log('⚪ _type:undefined object has no real value');
      return undefined;
    }
    
    // Check for simple value property
    if (field.hasOwnProperty('value')) {
      const value = field.value;
      if (value === null || value === undefined || value === 'undefined' || value === '') {
        console.log('⚪ Object.value is empty');
        return undefined;
      }
      console.log('✅ Found object.value:', value);
      return String(value);
    }
    
    console.log('⚠️ Object has no recognizable value structure');
    return undefined;
  }
  
  console.log('⚠️ Unknown field type, converting to string');
  return String(field);
};

// Helper function to safely extract number values
const extractNumberValue = (field: any): number | undefined => {
  console.log('🔢 Extracting number from:', field);
  
  if (!field || field === null || field === undefined) return undefined;
  if (typeof field === 'number') return field;
  
  // Handle object structures
  if (typeof field === 'object' && !Array.isArray(field)) {
    if (field._type === 'undefined') return undefined;
    if (field.hasOwnProperty('value')) {
      const val = field.value;
      if (val === null || val === undefined || val === 'undefined' || val === '') return undefined;
      const parsed = parseInt(String(val), 10);
      return isNaN(parsed) ? undefined : parsed;
    }
  }
  
  const parsed = parseInt(String(field), 10);
  return isNaN(parsed) ? undefined : parsed;
};

// CRITICAL FIX: Completely rewrite the formatCandidateData function
const formatCandidateData = (candidate: any): CandidateData => {
  if (!candidate) return null as unknown as CandidateData;
  
  console.log('🚀 RAW CANDIDATE DATA FROM DATABASE:', JSON.stringify(candidate, null, 2));
  
  // Convert JSON fields to arrays if they're strings or ensure they're arrays
  const ensureArray = (field: Json | null): any[] => {
    if (!field) return [];
    
    // Handle the _type: undefined structure for arrays
    if (typeof field === 'object' && !Array.isArray(field) && field._type === 'undefined') {
      if (field.hasOwnProperty('value') && Array.isArray(field.value)) {
        return field.value;
      }
      return [];
    }
    
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
    email: simpleExtractValue(candidate.email),
    phone: simpleExtractValue(candidate.phone),
    position: simpleExtractValue(candidate.position),
    years_experience: extractNumberValue(candidate.years_experience),
    location: simpleExtractValue(candidate.location),
    skills: ensureArray(candidate.skills),
    score: extractNumberValue(candidate.score),
    status: simpleExtractValue(candidate.status) || 'pending',
    detailed_status: simpleExtractValue(candidate.detailed_status),
    company: simpleExtractValue(candidate.company),
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    experiences: ensureArray(candidate.experiences),
    education: ensureArray(candidate.education),
    certifications: ensureArray(candidate.certifications),
    languages: ensureArray(candidate.languages),
    publications: ensureArray(candidate.publications),
    interests: simpleExtractValue(candidate.interests),
    professional_references: ensureArray(candidate.professional_references),
    availability: simpleExtractValue(candidate.availability),
    salary_expectations: simpleExtractValue(candidate.salary_expectations),
    mobility: simpleExtractValue(candidate.mobility),
    contract_type: simpleExtractValue(candidate.contract_type),
    remote_preference: simpleExtractValue(candidate.remote_preference),
    travel_willingness: simpleExtractValue(candidate.travel_willingness),
    professional_networks: ensureArray(candidate.professional_networks),
    continuous_training: ensureArray(candidate.continuous_training),
    career_objectives: simpleExtractValue(candidate.career_objectives),
    professional_values: simpleExtractValue(candidate.professional_values),
    work_authorization: simpleExtractValue(candidate.work_authorization),
    special_permits: ensureArray(candidate.special_permits),
    industries: ensureArray(candidate.industries),
    projects: ensureArray(candidate.projects),
    profile_completeness: extractNumberValue(candidate.profile_completeness),
    last_updated_at: candidate.last_updated_at
  };

  console.log('🎯 FORMATTED CANDIDATE DATA:', JSON.stringify(formatted, null, 2));
  console.log('🏢 Company value specifically:', formatted.company);
  console.log('🏠 Remote preference value specifically:', formatted.remote_preference);
  console.log('🚗 Mobility value specifically:', formatted.mobility);
  console.log('💰 Salary expectations value specifically:', formatted.salary_expectations);
  console.log('📝 Contract type value specifically:', formatted.contract_type);
  console.log('📞 Phone value specifically:', formatted.phone);
  console.log('📧 Email value specifically:', formatted.email);

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
