
-- Add missing RLS policies for ai_candidate_scores table
CREATE POLICY "Users can view their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR DELETE
USING (auth.uid() = user_id);
