
-- Créer une table pour les demandes d'inscription en attente
CREATE TABLE public.pending_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Activer RLS
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent voir toutes les demandes
CREATE POLICY "Admins can view all pending registrations" 
  ON public.pending_registrations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Politique pour que les admins puissent modifier les demandes
CREATE POLICY "Admins can update pending registrations" 
  ON public.pending_registrations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Politique pour permettre l'insertion (pour le processus d'inscription)
CREATE POLICY "Anyone can insert pending registrations" 
  ON public.pending_registrations 
  FOR INSERT 
  WITH CHECK (true);

-- Fonction pour obtenir les demandes d'inscription en attente
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS SETOF pending_registrations
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT * FROM public.pending_registrations 
  WHERE status = 'pending'
  ORDER BY created_at ASC;
$function$;
