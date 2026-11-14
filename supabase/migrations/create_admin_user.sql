-- ==============================================================================
-- Vita Earn — Création du compte test Administrateur & Résolution Schéma
-- ==============================================================================

-- 1. Assouplir la colonne username dans profiles
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;

-- 2. Sécuriser wallets.kind avec la vraie valeur de l'enum wallet_kind
DO $$
DECLARE
  v_default_kind TEXT;
BEGIN
  -- Récupérer la première valeur autorisée de l'enum wallet_kind existant
  SELECT enumlabel INTO v_default_kind
  FROM pg_enum
  WHERE enumtypid = 'public.wallet_kind'::regtype
  ORDER BY enumsortorder
  LIMIT 1;

  -- Définir cette valeur légitime comme valeur par défaut et assouplir la contrainte
  IF v_default_kind IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.wallets ALTER COLUMN kind SET DEFAULT %L::public.wallet_kind', v_default_kind);
    EXECUTE 'ALTER TABLE public.wallets ALTER COLUMN kind DROP NOT NULL';
    RAISE NOTICE 'Valeur par defaut appliquee pour wallet_kind: %', v_default_kind;
  ELSE
    ALTER TABLE public.wallets ALTER COLUMN kind DROP NOT NULL;
  END IF;

  -- Assurer l'unicité sur user_id si absente
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_key'
  ) THEN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE public.wallets ALTER COLUMN kind DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 3. Mettre à jour le trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_username TEXT;
BEGIN
  v_referral_code := 'VE' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    phone,
    role,
    is_activated,
    kyc_status,
    referral_code
  ) VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', v_username, ''),
    NEW.raw_user_meta_data->>'phone',
    'user',
    FALSE,
    'none',
    v_referral_code
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    referral_code = COALESCE(public.profiles.referral_code, EXCLUDED.referral_code);

  -- Création automatique du portefeuille (utilise la valeur par défaut légitime de l'enum)
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = NEW.id) THEN
    INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Création / Mise à jour du compte Administrateur Test
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
  admin_email TEXT := 'admin@vitaearn.com';
  admin_password TEXT := 'Admin2026!';
  hashed_password TEXT;
BEGIN
  hashed_password := crypt(admin_password, gen_salt('bf'));

  -- Vérifier si l'utilisateur existe déjà dans auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    UPDATE auth.users
    SET encrypted_password = hashed_password,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_build_object(
          'username', 'admin',
          'full_name', 'Administrateur VitaEarn'
        ),
        updated_at = NOW()
    WHERE id = admin_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_user_id, 'authenticated', 'authenticated',
      admin_email, hashed_password, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"admin","full_name":"Administrateur VitaEarn"}'::jsonb,
      NOW(), NOW(), ''
    );
  END IF;

  -- Mettre à jour le profil avec rôle = 'admin', compte activé et username = 'admin'
  INSERT INTO public.profiles (
    id, username, full_name, role, is_activated, kyc_status, referral_code
  ) VALUES (
    admin_user_id, 'admin', 'Administrateur VitaEarn', 'admin', TRUE, 'verified', 'ADMIN228'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = 'admin',
    role = 'admin',
    is_activated = TRUE,
    kyc_status = 'verified',
    full_name = 'Administrateur VitaEarn';

  -- Création du portefeuille
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = admin_user_id) THEN
    INSERT INTO public.wallets (user_id) VALUES (admin_user_id);
  END IF;

  RAISE NOTICE 'Compte administrateur cree avec succes. ID: %', admin_user_id;
END $$;
