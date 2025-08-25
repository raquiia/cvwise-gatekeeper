-- Create candidate_documents table for HR document management
CREATE TABLE public.candidate_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('cv', 'proposal', 'recommendation_letter', 'salary_grid', 'case_study')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on candidate_documents
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for candidate_documents
CREATE POLICY "Users can view their own candidate documents" 
ON public.candidate_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own candidate documents" 
ON public.candidate_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidate documents" 
ON public.candidate_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidate documents" 
ON public.candidate_documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create salary_calculations table for salary grid calculations
CREATE TABLE public.salary_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL,
  user_id UUID NOT NULL,
  base_city TEXT NOT NULL,
  category_group TEXT NOT NULL,
  base_salary INTEGER NOT NULL,
  ms_bonus INTEGER DEFAULT 0,
  experience_bonus INTEGER DEFAULT 0,
  stage_bonus INTEGER DEFAULT 0,
  adequation_bonus INTEGER DEFAULT 0,
  final_monthly INTEGER NOT NULL,
  final_annual INTEGER NOT NULL,
  calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on salary_calculations
ALTER TABLE public.salary_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for salary_calculations
CREATE POLICY "Users can view their own salary calculations" 
ON public.salary_calculations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own salary calculations" 
ON public.salary_calculations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salary calculations" 
ON public.salary_calculations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salary calculations" 
ON public.salary_calculations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_candidate_documents_updated_at
BEFORE UPDATE ON public.candidate_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_calculations_updated_at
BEFORE UPDATE ON public.salary_calculations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for candidate documents
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-documents', 'candidate-documents', false);

-- Create storage policies for candidate documents
CREATE POLICY "Users can view their own candidate documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own candidate documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own candidate documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own candidate documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'candidate-documents' AND auth.uid()::text = (storage.foldername(name))[1]);