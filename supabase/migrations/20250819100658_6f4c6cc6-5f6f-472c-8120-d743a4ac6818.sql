-- Add completed_at field to recruiter_tasks table
ALTER TABLE public.recruiter_tasks 
ADD COLUMN completed_at timestamp with time zone;

-- Create trigger to automatically set completed_at when status changes to 'completed'
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changing to 'completed', set completed_at
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = now();
  END IF;
  
  -- If status is changing from 'completed' to something else, clear completed_at
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic completed_at management
CREATE TRIGGER trigger_set_completed_at
  BEFORE UPDATE ON public.recruiter_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_completed_at();