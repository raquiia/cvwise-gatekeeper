import { supabase } from '@/integrations/supabase/client';

export interface CandidateReference {
  id: string;
  candidate_id: string;
  user_id: string;
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  verified: boolean;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReferenceData {
  candidate_id: string;
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

export interface UpdateReferenceData {
  name?: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  notes?: string;
}

export const candidateReferencesService = {
  async getReferencesForCandidate(candidateId: string): Promise<CandidateReference[]> {
    const { data, error } = await supabase
      .from('candidate_references')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching references:', error);
      throw error;
    }

    return data || [];
  },

  async addReference(referenceData: CreateReferenceData): Promise<CandidateReference> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('candidate_references')
      .insert({
        ...referenceData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reference:', error);
      throw error;
    }

    return data;
  },

  async updateReference(referenceId: string, referenceData: UpdateReferenceData): Promise<CandidateReference> {
    const { data, error } = await supabase
      .from('candidate_references')
      .update(referenceData)
      .eq('id', referenceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reference:', error);
      throw error;
    }

    return data;
  },

  async deleteReference(referenceId: string): Promise<void> {
    const { error } = await supabase
      .from('candidate_references')
      .delete()
      .eq('id', referenceId);

    if (error) {
      console.error('Error deleting reference:', error);
      throw error;
    }
  },

  async verifyReference(referenceId: string, notes?: string): Promise<CandidateReference> {
    const { data, error } = await supabase
      .from('candidate_references')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', referenceId)
      .select()
      .single();

    if (error) {
      console.error('Error verifying reference:', error);
      throw error;
    }

    return data;
  },

  async unverifyReference(referenceId: string): Promise<CandidateReference> {
    const { data, error } = await supabase
      .from('candidate_references')
      .update({
        verified: false,
        verified_at: null,
        notes: null
      })
      .eq('id', referenceId)
      .select()
      .single();

    if (error) {
      console.error('Error unverifying reference:', error);
      throw error;
    }

    return data;
  }
};