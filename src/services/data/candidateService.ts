
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface CandidateData {
  id?: string;
  user_id?: string;
  resume_id?: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  location?: string;
  years_experience?: number;
  company?: string;
  skills?: Json;
  availability?: string;
  salary_expectations?: string;
  mobility?: string;
  contract_type?: string;
  remote_preference?: string;
  travel_willingness?: string;
  career_objectives?: string;
  professional_values?: string;
  work_authorization?: string;
  interests?: string;
  education?: Json;
  experiences?: Json;
  certifications?: Json;
  languages?: Json;
  professional_references?: Json;
  professional_networks?: Json;
  continuous_training?: Json;
  special_permits?: Json;
  industries?: Json;
  projects?: Json;
  detailed_status?: string;
  status?: string;
  score?: number;
  profile_completeness?: number;
  notes?: string;
  last_updated_at?: string;
}

export interface UpdateCandidateOptions {
  skipValidation?: boolean;
}

export const candidateService = {
  // Get all candidates
  getAllCandidates: async (): Promise<CandidateData[]> => {
    try {
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erreur lors de la récupération des candidats: ${error.message}`);
      }

      return candidates || [];
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  },

  // Get user candidates
  getUserCandidates: async (): Promise<CandidateData[]> => {
    try {
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erreur lors de la récupération des candidats: ${error.message}`);
      }

      return candidates || [];
    } catch (error: any) {
      console.error('Error fetching user candidates:', error);
      throw error;
    }
  },

  // Get candidate by ID
  getCandidateById: async (id: string): Promise<CandidateData | null> => {
    try {
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erreur lors de la récupération du candidat: ${error.message}`);
      }

      return candidate || null;
    } catch (error: any) {
      console.error('Error fetching candidate:', error);
      throw error;
    }
  },

  // Create a new candidate
  createCandidate: async (candidateData: Partial<CandidateData> & { first_name: string; last_name: string; user_id: string }): Promise<CandidateData> => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert(candidateData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erreur lors de la création du candidat: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  },

  // Update an existing candidate
  updateCandidate: async (candidateData: Partial<CandidateData> & { id: string }): Promise<CandidateData> => {
    console.log('candidateService.updateCandidate called with:', candidateData);
    
    try {
      const { data, error } = await supabase
        .from('candidates')
        .update({
          first_name: candidateData.first_name,
          last_name: candidateData.last_name,
          email: candidateData.email,
          phone: candidateData.phone,
          position: candidateData.position,
          location: candidateData.location,
          years_experience: candidateData.years_experience,
          company: candidateData.company,
          skills: candidateData.skills,
          availability: candidateData.availability,
          salary_expectations: candidateData.salary_expectations,
          mobility: candidateData.mobility,
          contract_type: candidateData.contract_type,
          remote_preference: candidateData.remote_preference,
          travel_willingness: candidateData.travel_willingness,
          career_objectives: candidateData.career_objectives,
          professional_values: candidateData.professional_values,
          work_authorization: candidateData.work_authorization,
          interests: candidateData.interests,
          education: candidateData.education,
          experiences: candidateData.experiences,
          certifications: candidateData.certifications,
          languages: candidateData.languages,
          professional_references: candidateData.professional_references,
          professional_networks: candidateData.professional_networks,
          continuous_training: candidateData.continuous_training,
          special_permits: candidateData.special_permits,
          industries: candidateData.industries,
          projects: candidateData.projects,
          publications: candidateData.publications,
          notes: candidateData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateData.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error in updateCandidate:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      console.log('candidateService.updateCandidate success:', data);
      return data;
    } catch (error: any) {
      console.error('Error in updateCandidate:', error);
      throw error;
    }
  },

  // Delete a candidate
  deleteCandidate: async (id: string, force?: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erreur lors de la suppression du candidat: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  },
};

// Format candidate data for display
export const formatCandidateData = (candidate: any): CandidateData => {
  return {
    ...candidate,
    skills: candidate.skills || [],
    education: candidate.education || [],
    experiences: candidate.experiences || [],
    certifications: candidate.certifications || [],
    languages: candidate.languages || [],
    professional_references: candidate.professional_references || [],
    professional_networks: candidate.professional_networks || [],
    continuous_training: candidate.continuous_training || [],
    special_permits: candidate.special_permits || [],
    industries: candidate.industries || [],
    projects: candidate.projects || [],
    publications: candidate.publications || [],
  };
};
