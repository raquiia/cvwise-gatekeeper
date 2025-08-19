import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface RecruiterTask {
  id: string;
  user_id: string;
  candidate_id?: string | null;
  task_type: string;
  title: string;
  description?: string | null;
  scheduled_date: string;
  interview_type?: string | null;
  business_manager?: string | null;
  candidate_profile_url?: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRecruiterTaskData {
  candidate_id?: string;
  task_type: RecruiterTask['task_type'];
  title: string;
  description?: string;
  scheduled_date: string;
  interview_type?: 'ec1' | 'ec2';
  business_manager?: string;
  candidate_profile_url?: string;
  priority?: RecruiterTask['priority'];
}

export const recruiterTasksService = {
  async getTasksForUser(userId: string): Promise<RecruiterTask[]> {
    try {
      const { data, error } = await supabase
        .from('recruiter_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching recruiter tasks:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTasksForUser:', error);
      return [];
    }
  },

  async getTodayTasks(userId: string): Promise<RecruiterTask[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('recruiter_tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_date', startOfDay)
        .lte('scheduled_date', endOfDay)
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching today tasks:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTodayTasks:', error);
      return [];
    }
  },

  async getPendingBMTasks(userId: string): Promise<RecruiterTask[]> {
    try {
      const { data, error } = await supabase
        .from('recruiter_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('task_type', 'bm_interview')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending BM tasks:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingBMTasks:', error);
      return [];
    }
  },

  async getTasksForDate(userId: string, date: Date): Promise<RecruiterTask[]> {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('recruiter_tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_date', startOfDay)
        .lte('scheduled_date', endOfDay)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching tasks for date:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTasksForDate:', error);
      return [];
    }
  },

  async getCompletedTasksForDate(userId: string, date: Date): Promise<RecruiterTask[]> {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('recruiter_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed tasks for date:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCompletedTasksForDate:', error);
      return [];
    }
  },

  async getUrgentAndTodayTasks(userId: string): Promise<RecruiterTask[]> {
    try {
      const [urgentBMTasks, todayTasks] = await Promise.all([
        this.getPendingBMTasks(userId),
        this.getTodayTasks(userId)
      ]);

      // Combiner les tâches en évitant les doublons
      const allTasks = [...urgentBMTasks];
      
      // Ajouter les tâches du jour qui ne sont pas déjà dans les tâches BM urgentes
      todayTasks.forEach(task => {
        if (!urgentBMTasks.find(urgent => urgent.id === task.id)) {
          allTasks.push(task);
        }
      });

      return allTasks;
    } catch (error) {
      console.error('Error in getUrgentAndTodayTasks:', error);
      return [];
    }
  },

  async createTask(userId: string, taskData: CreateRecruiterTaskData): Promise<RecruiterTask | null> {
    try {
      const { data, error } = await supabase
        .from('recruiter_tasks')
        .insert({
          user_id: userId,
          ...taskData,
          priority: taskData.priority || 'medium'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating recruiter task:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createTask:', error);
      return null;
    }
  },

  async updateTaskStatus(taskId: string, status: RecruiterTask['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recruiter_tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task status:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTaskStatus:', error);
      return false;
    }
  },

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recruiter_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return false;
    }
  },

  // Spécifique aux tâches d'entretien BM
  async createBMInterviewTask(
    userId: string, 
    candidateId: string, 
    candidateName: string,
    candidatePosition: string,
    businessManager: string, 
    interviewType: 'ec1' | 'ec2',
    scheduledDate: string
  ): Promise<RecruiterTask | null> {
    const taskData: CreateRecruiterTaskData = {
      candidate_id: candidateId,
      task_type: 'bm_interview',
      title: `Programmer entretien ${interviewType.toUpperCase()} avec ${businessManager}`,
      description: `Candidat: ${candidateName} - Poste: ${candidatePosition}\nActions: Envoyer email au candidat et informer le BM`,
      scheduled_date: scheduledDate,
      interview_type: interviewType,
      business_manager: businessManager,
      candidate_profile_url: `/candidates/${candidateId}`,
      priority: 'high'
    };

    return this.createTask(userId, taskData);
  }
};