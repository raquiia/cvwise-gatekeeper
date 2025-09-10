import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecruiterPermissions {
  canEdit: boolean;
  isOwner: boolean;
  isActiveRecruiter: boolean;
  processId?: string;
}

export const useRecruiterPermissions = (candidateId: string) => {
  const [permissions, setPermissions] = useState<RecruiterPermissions>({
    canEdit: false,
    isOwner: false,
    isActiveRecruiter: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if user is candidate owner
        const { data: candidate } = await supabase
          .from('candidates')
          .select('user_id, current_process_id')
          .eq('id', candidateId)
          .single();

        if (!candidate) {
          setLoading(false);
          return;
        }

        const isOwner = candidate.user_id === user.id;

        // Check if user is active recruiter for this candidate
        let isActiveRecruiter = false;
        let processId: string | undefined;

        if (candidate.current_process_id) {
          const { data: process } = await supabase
            .from('candidate_recruitment_processes')
            .select('id, recruiter_id, status, ended_at')
            .eq('id', candidate.current_process_id)
            .eq('recruiter_id', user.id)
            .single();

          if (process && process.status !== 'completed' && !process.ended_at) {
            isActiveRecruiter = true;
            processId = process.id;
          }
        }

        setPermissions({
          canEdit: isOwner || isActiveRecruiter,
          isOwner,
          isActiveRecruiter,
          processId
        });
      } catch (error) {
        console.error('Error checking recruiter permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      checkPermissions();
    }
  }, [candidateId]);

  return { permissions, loading };
};