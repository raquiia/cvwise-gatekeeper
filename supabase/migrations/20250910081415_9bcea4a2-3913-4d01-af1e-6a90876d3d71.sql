-- Create candidate_recruitment_processes table
CREATE TABLE public.candidate_recruitment_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL,
  hub_id UUID REFERENCES public.hubs(id),
  recruiter_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'prise_contact',
  process_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_recruitment_processes ENABLE ROW LEVEL SECURITY;

-- Add current_process_id to candidates table
ALTER TABLE public.candidates ADD COLUMN current_process_id UUID REFERENCES public.candidate_recruitment_processes(id);

-- Add process_id to candidate_notes table
ALTER TABLE public.candidate_notes ADD COLUMN process_id UUID REFERENCES public.candidate_recruitment_processes(id);

-- Create policies for candidate_recruitment_processes
CREATE POLICY "Users can view processes for their candidates"
ON public.candidate_recruitment_processes
FOR SELECT
USING (
  EXISTS(
    SELECT 1 FROM public.candidates c 
    WHERE c.id = candidate_recruitment_processes.candidate_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view processes where they are the recruiter"
ON public.candidate_recruitment_processes
FOR SELECT
USING (recruiter_id = auth.uid());

CREATE POLICY "Users can create processes for their candidates"
ON public.candidate_recruitment_processes
FOR INSERT
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.candidates c 
    WHERE c.id = candidate_recruitment_processes.candidate_id 
    AND c.user_id = auth.uid()
  )
  AND recruiter_id = auth.uid()
);

CREATE POLICY "Users can update processes they created"
ON public.candidate_recruitment_processes
FOR UPDATE
USING (recruiter_id = auth.uid());

-- Create trigger to update updated_at
CREATE TRIGGER update_candidate_recruitment_processes_updated_at
BEFORE UPDATE ON public.candidate_recruitment_processes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to start new recruitment process
CREATE OR REPLACE FUNCTION public.start_new_recruitment_process(
  p_candidate_id UUID,
  p_hub_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_process_id UUID;
  v_next_process_number INTEGER;
  v_recruiter_id UUID;
BEGIN
  -- Get current user ID
  v_recruiter_id := auth.uid();
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get next process number for this candidate
  SELECT COALESCE(MAX(process_number), 0) + 1
  INTO v_next_process_number
  FROM candidate_recruitment_processes
  WHERE candidate_id = p_candidate_id;
  
  -- Create new recruitment process
  INSERT INTO candidate_recruitment_processes (
    candidate_id,
    hub_id,
    recruiter_id,
    process_number,
    notes
  ) VALUES (
    p_candidate_id,
    p_hub_id,
    v_recruiter_id,
    v_next_process_number,
    p_notes
  )
  RETURNING id INTO v_process_id;
  
  -- Update candidate's current process and reset status
  UPDATE candidates 
  SET 
    current_process_id = v_process_id,
    detailed_status = 'prise_contact',
    hub_id = p_hub_id,
    updated_at = now()
  WHERE id = p_candidate_id;
  
  RETURN v_process_id;
END;
$$;

-- Create function to get candidate recruitment history
CREATE OR REPLACE FUNCTION public.get_candidate_recruitment_history(p_candidate_id UUID)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check access rights
  IF NOT EXISTS(
    SELECT 1 FROM candidates c 
    WHERE c.id = p_candidate_id 
    AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied or candidate not found';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', crp.id,
    'process_number', crp.process_number,
    'status', crp.status,
    'outcome', crp.outcome,
    'started_at', crp.started_at,
    'ended_at', crp.ended_at,
    'notes', crp.notes,
    'hub', jsonb_build_object(
      'id', h.id,
      'name', h.name,
      'city', h.city
    ),
    'recruiter', jsonb_build_object(
      'id', p.id,
      'first_name', p.first_name,
      'last_name', p.last_name
    )
  )
  FROM candidate_recruitment_processes crp
  LEFT JOIN hubs h ON crp.hub_id = h.id
  LEFT JOIN profiles p ON crp.recruiter_id = p.id
  WHERE crp.candidate_id = p_candidate_id
  ORDER BY crp.process_number DESC;
END;
$$;