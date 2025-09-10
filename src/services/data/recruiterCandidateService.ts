import { supabase } from '@/integrations/supabase/client';

export interface RecruiterUpdateData {
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  position?: string;
  company?: string;
  salary_expectations?: string;
  availability?: string;
  mobility?: string;
  contract_type?: string;
  remote_preference?: string;
}

export const recruiterCandidateService = {
  async updateCandidateByRecruiter(candidateId: string, updates: RecruiterUpdateData) {
    const { data, error } = await supabase.rpc('update_candidate_by_recruiter', {
      p_candidate_id: candidateId,
      p_updates: updates as any
    });

    if (error) {
      console.error('Error updating candidate by recruiter:', error);
      throw error;
    }

    return data;
  },

  async checkRecruiterPermissions(candidateId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { canEdit: false, isOwner: false, isActiveRecruiter: false };

    // Get candidate and process info
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        user_id,
        current_process_id,
        candidate_recruitment_processes!current_process_id(
          id,
          recruiter_id,
          status,
          ended_at
        )
      `)
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      throw new Error('Candidate not found');
    }

    const isOwner = candidate.user_id === user.id;
    const process = candidate.candidate_recruitment_processes;
    const isActiveRecruiter = process && 
      process.recruiter_id === user.id && 
      process.status !== 'completed' && 
      !process.ended_at;

    return {
      canEdit: isOwner || isActiveRecruiter,
      isOwner,
      isActiveRecruiter: Boolean(isActiveRecruiter),
      processId: process?.id
    };
  }
};