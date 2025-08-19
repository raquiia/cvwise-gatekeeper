-- Create recruiter_tasks table for managing recruiter tasks including BM interviews
CREATE TABLE public.recruiter_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_id UUID,
  task_type TEXT NOT NULL CHECK (task_type IN ('bm_interview', 'follow_up', 'preparation', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  interview_type TEXT CHECK (interview_type IN ('ec1', 'ec2')),
  business_manager TEXT,
  candidate_profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recruiter_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks" 
ON public.recruiter_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.recruiter_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.recruiter_tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.recruiter_tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_recruiter_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recruiter_tasks_updated_at
BEFORE UPDATE ON public.recruiter_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_recruiter_tasks_updated_at();

-- Create index for better performance
CREATE INDEX idx_recruiter_tasks_user_date ON public.recruiter_tasks(user_id, scheduled_date);
CREATE INDEX idx_recruiter_tasks_status ON public.recruiter_tasks(status);
CREATE INDEX idx_recruiter_tasks_type ON public.recruiter_tasks(task_type);