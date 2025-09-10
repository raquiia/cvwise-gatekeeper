import { supabase } from '@/integrations/supabase/client';

export interface RecruitmentProcess {
  id: string;
  process_number: number;
  status: string;
  outcome?: string;
  started_at: string;
  ended_at?: string;
  notes?: string;
  hub: {
    id: string;
    name: string;
    city: string;
  };
  recruiter: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export const recruitmentProcessService = {
  async startNewProcess(candidateId: string, hubId: string, notes?: string): Promise<string> {
    const { data, error } = await supabase.rpc('start_new_recruitment_process', {
      p_candidate_id: candidateId,
      p_hub_id: hubId,
      p_notes: notes
    });

    if (error) {
      console.error('Error starting new recruitment process:', error);
      throw error;
    }

    return data;
  },

  async getCandidateRecruitmentHistory(candidateId: string): Promise<RecruitmentProcess[]> {
    const { data, error } = await supabase.rpc('get_candidate_recruitment_history', {
      p_candidate_id: candidateId
    });

    if (error) {
      console.error('Error fetching recruitment history:', error);
      throw error;
    }

    return (data as unknown as RecruitmentProcess[]) || [];
  },

  async updateProcessStatus(processId: string, status: string, outcome?: string): Promise<void> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (outcome) {
      updateData.outcome = outcome;
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('candidate_recruitment_processes')
      .update(updateData)
      .eq('id', processId);

    if (error) {
      console.error('Error updating process status:', error);
      throw error;
    }
  }
};