-- ==============================================================================
-- Migration : Table de configuration du paiement alternatif
-- Permet à l'administrateur de rediriger les utilisateurs vers un lien de paiement
-- externe sécurisé en cas d'indisponibilité de l'agrégateur principal.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.alternative_payment_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payment_url TEXT CHECK (payment_url IS NULL OR payment_url ~* '^https://[a-zA-Z0-9.-]+'),
  button_label TEXT NOT NULL DEFAULT 'Payer via un lien alternatif',
  user_message TEXT NOT NULL DEFAULT 'Si le paiement habituel ne fonctionne pas, utilisez ce lien.',
  target_countries TEXT[] NOT NULL DEFAULT '{}',
  all_countries BOOLEAN NOT NULL DEFAULT FALSE,
  email TEXT,
  whatsapp_number TEXT,
  post_payment_instructions TEXT NOT NULL DEFAULT 'Après ton paiement, envoie la capture d''écran de ta transaction à l''adresse ci-dessous. Ton compte sera activé après vérification.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- Insertion de la ligne unique par défaut si inexistante
INSERT INTO public.alternative_payment_settings (
  id,
  is_enabled,
  payment_url,
  button_label,
  user_message,
  target_countries,
  all_countries,
  email,
  whatsapp_number,
  post_payment_instructions
) VALUES (
  1,
  FALSE,
  NULL,
  'Payer via un lien alternatif',
  'Si le paiement habituel ne fonctionne pas, utilisez ce lien.',
  ARRAY['TG']::TEXT[],
  FALSE,
  'support@vitaearn.com',
  '+22890000000',
  'Après ton paiement, envoie la capture d''écran de ta transaction à l''adresse ci-dessous. Ton compte sera activé après vérification.'
) ON CONFLICT (id) DO NOTHING;

-- Activer Row Level Security
ALTER TABLE public.alternative_payment_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : réservée au service_role et aux administrateurs
DROP POLICY IF EXISTS "Lecture paramètres paiement alternatif par admin" ON public.alternative_payment_settings;
CREATE POLICY "Lecture paramètres paiement alternatif par admin"
ON public.alternative_payment_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Politique de mise à jour : strictement réservée aux administrateurs
DROP POLICY IF EXISTS "Modification paramètres paiement alternatif par admin" ON public.alternative_payment_settings;
CREATE POLICY "Modification paramètres paiement alternatif par admin"
ON public.alternative_payment_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
