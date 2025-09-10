-- Create countries table
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- ISO country code (FR, DE, etc.)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hubs table
CREATE TABLE public.hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(country_id, name)
);

-- Add hub_id to profiles table
ALTER TABLE public.profiles ADD COLUMN hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL;

-- Add hub_id to candidates table
ALTER TABLE public.candidates ADD COLUMN hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;

-- RLS policies for countries
CREATE POLICY "Anyone can view active countries" ON public.countries
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage countries" ON public.countries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS policies for hubs  
CREATE POLICY "Anyone can view active hubs" ON public.hubs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage hubs" ON public.hubs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create indexes for performance
CREATE INDEX idx_hubs_country_id ON public.hubs(country_id);
CREATE INDEX idx_hubs_city ON public.hubs(city);
CREATE INDEX idx_profiles_hub_id ON public.profiles(hub_id);
CREATE INDEX idx_candidates_hub_id ON public.candidates(hub_id);

-- Create trigger to automatically assign candidate to recruiter's hub
CREATE OR REPLACE FUNCTION public.assign_candidate_to_recruiter_hub()
RETURNS TRIGGER AS $$
BEGIN
  -- If no hub_id is specified, assign the recruiter's hub
  IF NEW.hub_id IS NULL THEN
    NEW.hub_id := (
      SELECT hub_id 
      FROM public.profiles 
      WHERE id = NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_candidate_hub
  BEFORE INSERT ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_candidate_to_recruiter_hub();

-- Insert default countries and hubs
INSERT INTO public.countries (name, code) VALUES 
  ('France', 'FR'),
  ('Allemagne', 'DE'),
  ('Espagne', 'ES'),
  ('Italie', 'IT');

-- Insert default hubs for France
INSERT INTO public.hubs (country_id, name, city) VALUES 
  ((SELECT id FROM public.countries WHERE code = 'FR'), 'Hub Paris', 'Paris'),
  ((SELECT id FROM public.countries WHERE code = 'FR'), 'Hub Lyon', 'Lyon'),
  ((SELECT id FROM public.countries WHERE code = 'FR'), 'Hub Marseille', 'Marseille'),
  ((SELECT id FROM public.countries WHERE code = 'DE'), 'Hub Berlin', 'Berlin'),
  ((SELECT id FROM public.countries WHERE code = 'DE'), 'Hub Munich', 'Munich');