-- ==============================================================================
-- Vita Earn — Migration de Sécurisation & Durcissement (Security Hardening)
-- Conforme au Guide d'Audit des Systèmes de Paiement, JWT et Webhooks
-- Date : 18 Novembre 2026
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROTECTION ABSOLUE DES CHAMPS SENSIBLES DU PROFIL (RÔLE, ACTIVATION, KYC)
-- Empêche formellement tout utilisateur de s'auto-attribuer le rôle admin
-- ou d'activer son compte via l'API Supabase cliente.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si l'appel ne provient pas du rôle service_role (clé serveur sécurisée),
  -- interdire toute modification de role, is_activated, et kyc_status
  IF current_user != 'service_role' AND COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'Sécurité : Modification non autorisée du rôle utilisateur.';
    END IF;

    IF OLD.is_activated IS DISTINCT FROM NEW.is_activated THEN
      RAISE EXCEPTION 'Sécurité : Modification non autorisée du statut d activation (requiert un paiement vérifié).';
    END IF;

    IF OLD.kyc_status IS DISTINCT FROM NEW.kyc_status THEN
      RAISE EXCEPTION 'Sécurité : Modification non autorisée du statut KYC.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_sensitive_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_sensitive_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- Durcissement explicite de la politique RLS UPDATE sur profiles
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les champs autorises de leur profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent modifier les champs autorises de leur profil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND is_activated = (SELECT p.is_activated FROM public.profiles p WHERE p.id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 2. TABLE WEBHOOK_EVENTS (Anti-rejeu & Idempotence des Webhooks)
-- Conforme à la Section 7 du Guide Technique d'Audit
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'duplicate', 'failed', 'ignored')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_webhook_provider_event UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id ON public.webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(processing_status);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seul le service_role et les admins accedent aux webhooks" ON public.webhook_events;
CREATE POLICY "Seul le service_role et les admins accedent aux webhooks"
  ON public.webhook_events FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------------------------
-- 3. PERMISSIONS SUR LES PROCÉDURES FINANCIÈRES
-- activate_account, request_withdrawal, review_withdrawal
-- Ne doivent JAMAIS être exécutables par le rôle public/anon
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.activate_account(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_account(UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.request_withdrawal(UUID, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, BIGINT, TEXT, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.review_withdrawal(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_withdrawal(UUID, TEXT, UUID, TEXT) TO service_role;
