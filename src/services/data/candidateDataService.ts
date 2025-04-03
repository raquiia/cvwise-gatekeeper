import { supabase } from '@/integrations/supabase/client';
import { CandidateData } from './resumeDataService';
import { Json } from '@/integrations/supabase/types';

/**
 * Helper function to ensure skills are properly parsed as arrays
 */
const processSkills = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      skills: Array.isArray(item.skills) ? item.skills : 
              (typeof item.skills === 'string' ? JSON.parse(item.skills) : [])
    }));
  }
  
  return {
    ...data,
    skills: Array.isArray(data.skills) ? data.skills : 
            (typeof data.skills === 'string' ? JSON.parse(data.skills) : [])
  };
};

/**
 * Helper function to safely parse JSON data
 */
const safelyParseJsonField = (field: Json | null): any[] => {
  if (!field) return [];
  
  if (Array.isArray(field)) return field;
  
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  
  return [];
};

/**
 * Service responsable de la gestion des données des candidats
 * Cette couche d'abstraction facilitera une migration future vers une API REST
 */
export const candidateDataService = {
  /**
   * Crée ou met à jour un candidat
   */
  saveCandidate: async (candidateData: CandidateData): Promise<CandidateData | null> => {
    try {
      // Ensure skills is an array
      const dataToSave = {
        ...candidateData,
        skills: Array.isArray(candidateData.skills) ? candidateData.skills : []
      };
      
      const { data, error } = await supabase
        .from('candidates')
        .upsert(dataToSave)
        .select();
        
      if (error) throw error;
      
      // Transform the returned data to match our expected format
      if (data && data[0]) {
        return processSkills(data[0]) as CandidateData;
      }
      
      return null;
    } catch (error) {
      console.error('Error saving candidate:', error);
      return null;
    }
  },
  
  /**
   * Récupère tous les candidats d'un utilisateur
   */
  getUserCandidates: async (userId: string): Promise<CandidateData[]> => {
    try {
      console.log('Fetching candidates for user:', userId);
      
      // Utiliser directement RPC pour appeler la fonction SQL
      const { data, error } = await supabase.rpc('get_user_candidates', {
        user_id_param: userId
      });
        
      if (error) {
        console.error('RPC error fetching candidates:', error);
        throw error;
      }
      
      console.log('Candidates data from RPC:', data);
      
      if (!data || !Array.isArray(data)) {
        console.log('No candidates returned or invalid data format');
        return [];
      }
      
      // Transformer les données pour correspondre à notre format
      const transformedData = data.map((candidate: any) => {
        // Create a new object without modifying the original candidate object
        return {
          id: candidate.id,
          user_id: candidate.user_id,
          resume_id: candidate.resume_id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          years_experience: candidate.years_experience,
          location: candidate.location,
          // Safely parse all JSON fields
          skills: safelyParseJsonField(candidate.skills),
          experiences: safelyParseJsonField(candidate.experiences),
          education: safelyParseJsonField(candidate.education),
          certifications: safelyParseJsonField(candidate.certifications),
          languages: safelyParseJsonField(candidate.languages),
          projects: safelyParseJsonField(candidate.projects),
          industries: safelyParseJsonField(candidate.industries),
          // Other fields
          score: candidate.score,
          status: candidate.status,
          company: candidate.company || '',
          created_at: candidate.created_at,
          updated_at: candidate.updated_at,
          interests: candidate.interests,
          availability: candidate.availability,
          salary_expectations: candidate.salary_expectations,
          mobility: candidate.mobility,
          contract_type: candidate.contract_type,
          remote_preference: candidate.remote_preference,
          travel_willingness: candidate.travel_willingness,
          career_objectives: candidate.career_objectives,
          professional_values: candidate.professional_values,
          work_authorization: candidate.work_authorization,
          profile_completeness: candidate.profile_completeness
        };
      });
      
      return transformedData as CandidateData[];
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  },
  
  /**
   * Récupère un candidat par son ID
   */
  getCandidateById: async (candidateId: string): Promise<CandidateData | null> => {
    try {
      // Utiliser la fonction RPC sécurisée pour éviter la récursion infinie dans les policies
      const { data, error } = await supabase.rpc('get_candidate_by_id', {
        candidate_id_param: candidateId
      });
        
      if (error) {
        console.error('RPC error fetching candidate by ID:', error);
        throw error;
      }
      
      console.log('Candidate data from RPC:', data);
      
      // Check if we got any data back
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No candidate found with ID:', candidateId);
        return null;
      }
      
      // Transformer les données pour correspondre à notre format
      const candidate = data[0] as any;
      const transformedData = {
        id: candidate.id,
        user_id: candidate.user_id,
        resume_id: candidate.resume_id,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone,
        position: candidate.position,
        years_experience: candidate.years_experience,
        location: candidate.location,
        // Safely parse all JSON fields
        skills: safelyParseJsonField(candidate.skills),
        experiences: safelyParseJsonField(candidate.experiences),
        education: safelyParseJsonField(candidate.education),
        certifications: safelyParseJsonField(candidate.certifications),
        languages: safelyParseJsonField(candidate.languages),
        projects: safelyParseJsonField(candidate.projects),
        industries: safelyParseJsonField(candidate.industries),
        // Other fields
        score: candidate.score,
        status: candidate.status,
        company: candidate.company || '',
        created_at: candidate.created_at,
        updated_at: candidate.updated_at,
        interests: candidate.interests,
        availability: candidate.availability,
        salary_expectations: candidate.salary_expectations,
        mobility: candidate.mobility,
        contract_type: candidate.contract_type,
        remote_preference: candidate.remote_preference,
        travel_willingness: candidate.travel_willingness,
        career_objectives: candidate.career_objectives,
        professional_values: candidate.professional_values,
        work_authorization: candidate.work_authorization,
        profile_completeness: candidate.profile_completeness
      };
      
      return transformedData as CandidateData;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
  }
};
