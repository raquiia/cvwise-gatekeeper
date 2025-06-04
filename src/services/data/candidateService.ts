import { supabase } from '@/integrations/supabase/client';

export interface CandidateData {
  id?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  location?: string;
  years_experience?: number;
  company?: string;
  skills?: string[];
  availability?: string;
  salary_expectations?: string;
  salary_expectation?: string; // Deprecated, to be removed
  mobility?: boolean;
  contract_type?: string;
  remote_preference?: string;
  travel_willingness?: boolean;
  career_objectives?: string;
  professional_values?: string;
  work_authorization?: string;
  interests?: string;
  resume_id?: string;
  resume_url?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  languages?: string[];
  education?: any[];
  experiences?: any[];
  detailed_status?: string;
  ai_score?: number;
  notes?: string;
  updated_at?: string;
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
  createCandidate: async (candidateData: Omit<CandidateData, 'id' | 'created_at'>): Promise<CandidateData> => {
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
  // Add debugging to the updateCandidate function to see what's happening
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
          notes: candidateData.notes, // This field needs to be added to the database
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
  deleteCandidate: async (id: string): Promise<boolean> => {
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
