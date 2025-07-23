import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface CandidateData {
  id?: string;
  user_id?: string;
  resume_id?: string;
  created_at?: string;
  updated_at?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  location?: string;
  // Explicit address fields
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
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
  // Nouvelles colonnes AI
  ai_score?: number;
  ai_explanation?: string;
  ai_breakdown?: Json;
  ai_strengths?: Json;
  ai_weaknesses?: Json;
  ai_recommendations?: Json;
  ai_analyzed_at?: string;
  // Propriétés pour la détection de propriété
  isOwnCandidate?: boolean;
  owner_first_name?: string;
  owner_last_name?: string;
}

export interface UpdateCandidateOptions {
  skipValidation?: boolean;
}

export const candidateService = {
  // Get ALL candidates from the platform (global mode)
  getAllCandidates: async (): Promise<CandidateData[]> => {
    try {
      console.log('🌍 [candidateService] Fetching ALL candidates from platform...');
      
      // Utiliser une requête qui récupère tous les candidats avec les infos de propriétaire
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select(`
          *,
          profiles!candidates_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [candidateService] Supabase error in getAllCandidates:', error);
        throw new Error(`Erreur lors de la récupération de tous les candidats: ${error.message}`);
      }

      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      
      // Enrichir avec les informations de propriété
      const enrichedCandidates = (candidates || []).map(candidate => ({
        ...candidate,
        isOwnCandidate: candidate.user_id === currentUserId,
        owner_first_name: candidate.profiles?.first_name || '',
        owner_last_name: candidate.profiles?.last_name || ''
      }));

      console.log(`✅ [candidateService] Retrieved ${enrichedCandidates.length} candidates globally`);
      console.log(`📊 [candidateService] Own candidates: ${enrichedCandidates.filter(c => c.isOwnCandidate).length}`);
      console.log(`📊 [candidateService] Other candidates: ${enrichedCandidates.filter(c => !c.isOwnCandidate).length}`);

      return enrichedCandidates;
    } catch (error: any) {
      console.error('❌ [candidateService] Error fetching all candidates:', error);
      throw error;
    }
  },

  // Get user candidates ONLY (local mode)
  getUserCandidates: async (): Promise<CandidateData[]> => {
    try {
      console.log('👤 [candidateService] Fetching USER candidates only...');
      
      const { data: candidates, error } = await supabase
        .from('candidates')
        .select(`
          *,
          profiles!candidates_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [candidateService] Supabase error in getUserCandidates:', error);
        throw new Error(`Erreur lors de la récupération des candidats utilisateur: ${error.message}`);
      }

      // Tous les candidats retournés sont des candidats propres
      const enrichedCandidates = (candidates || []).map(candidate => ({
        ...candidate,
        isOwnCandidate: true,
        owner_first_name: candidate.profiles?.first_name || '',
        owner_last_name: candidate.profiles?.last_name || ''
      }));

      console.log(`✅ [candidateService] Retrieved ${enrichedCandidates.length} user candidates`);

      return enrichedCandidates;
    } catch (error: any) {
      console.error('❌ [candidateService] Error fetching user candidates:', error);
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
    console.log('candidateService.updateCandidate called with AI data:', {
      id: candidateData.id,
      ai_score: candidateData.ai_score,
      ai_explanation: candidateData.ai_explanation?.substring(0, 50),
      ai_strengths_count: Array.isArray(candidateData.ai_strengths) ? candidateData.ai_strengths.length : 0,
      ai_weaknesses_count: Array.isArray(candidateData.ai_weaknesses) ? candidateData.ai_weaknesses.length : 0,
      ai_recommendations_count: Array.isArray(candidateData.ai_recommendations) ? candidateData.ai_recommendations.length : 0,
    });
    
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
          address: candidateData.address,
          postal_code: candidateData.postal_code,
          city: candidateData.city,
          country: candidateData.country,
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
          notes: candidateData.notes,
          ai_score: candidateData.ai_score,
          ai_explanation: candidateData.ai_explanation,
          ai_breakdown: candidateData.ai_breakdown,
          ai_strengths: candidateData.ai_strengths,
          ai_weaknesses: candidateData.ai_weaknesses,
          ai_recommendations: candidateData.ai_recommendations,
          ai_analyzed_at: candidateData.ai_analyzed_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateData.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error in updateCandidate:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      console.log('candidateService.updateCandidate success with AI data:', {
        id: data.id,
        ai_score: data.ai_score,
        ai_analyzed_at: data.ai_analyzed_at
      });
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
    ai_strengths: candidate.ai_strengths || [],
    ai_weaknesses: candidate.ai_weaknesses || [],
    ai_recommendations: candidate.ai_recommendations || [],
    ai_breakdown: candidate.ai_breakdown || {},
    // Conserver les informations de propriété
    isOwnCandidate: candidate.isOwnCandidate || false,
    owner_first_name: candidate.owner_first_name || '',
    owner_last_name: candidate.owner_last_name || ''
  };
};
