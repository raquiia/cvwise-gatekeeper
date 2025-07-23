
-- Ajouter une clé étrangère entre candidates.user_id et profiles.id
ALTER TABLE public.candidates 
ADD CONSTRAINT candidates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
