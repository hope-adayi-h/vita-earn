-- ==============================================================================
-- Migration : Ajout de username et country à profiles
-- Permet la connexion par nom d'utilisateur et l'affichage du pays de résidence.
-- ==============================================================================

-- 1. Ajout des colonnes à public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Togo';

-- 2. Index de performance pour la recherche rapide par nom d'utilisateur
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(LOWER(username));

-- 3. Mise à jour du trigger handle_new_user pour enregistrer le username et le country
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Création du profil utilisateur avec username et country
  INSERT INTO public.profiles (id, full_name, username, country, role, is_activated, kyc_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    LOWER(NULLIF(NEW.raw_user_meta_data->>'username', '')),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Togo'),
    'user',
    FALSE,
    'none'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Création du portefeuille
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Journalisation de l'inscription
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, payload)
  VALUES (
    NEW.id,
    'user_registered',
    'auth.users',
    NEW.id::TEXT,
    jsonb_build_object(
      'email', NEW.email,
      'username', NEW.raw_user_meta_data->>'username',
      'country', NEW.raw_user_meta_data->>'country'
    )
  );

  RETURN NEW;
END;
$$;
