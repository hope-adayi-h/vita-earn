-- =============================================================================
-- VITA EARN — MIGRATION : RÉINITIALISATION COMPLÈTE & COMPTE SUPER-ADMINISTRATEUR
-- Date : 18 Novembre 2026
-- Description : Réinitialise proprement toutes les tables de données de test
--               et garantit la présence du compte Super-Admin principal activé.
-- =============================================================================

-- 1. Nettoyage des tables de flux financiers et commandes
TRUNCATE TABLE public.ledger_entries CASCADE;
TRUNCATE TABLE public.withdrawals CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.commissions CASCADE;
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.referrals CASCADE;

-- Si la table webhook_events existe, la vider
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'webhook_events') THEN
    TRUNCATE TABLE public.webhook_events CASCADE;
  END IF;
END $$;

-- 2. Nettoyage des profils de test (conserve uniquement le super admin s'il existe déjà)
DELETE FROM public.profiles WHERE email != 'adayiespoir60@gmail.com';

-- 3. Mise à jour / Création du compte super administrateur
-- Note : Dès que le compte s'enregistre via Supabase Auth avec adayiespoir60@gmail.com,
-- ce trigger ou cet UPDATE garantit son rôle admin et son activation immédiate.
UPDATE public.profiles
SET 
  role = 'admin',
  is_activated = TRUE,
  referral_code = 'VE-ESPOIR',
  full_name = 'Espoir',
  phone = COALESCE(phone, '+228 90 00 00 00')
WHERE email = 'adayiespoir60@gmail.com';

-- 4. Initialisation des réglages de la plateforme par défaut
INSERT INTO public.platform_settings (key, value, description)
VALUES 
  ('activation_fee', '{"amount": 4500, "currency": "XOF"}', 'Frais d''activation unique du compte Vita Earn'),
  ('subscription_commissions', '{"l1": 2000, "l2": 1000, "l3": 500, "platform_margin": 1000}', 'Répartition des commissions d''affiliation sur abonnement'),
  ('withdrawal_settings', '{"min_amount": 1000, "fee_percent": 0, "fixed_fee": 0}', 'Seuil minimum et frais de retrait Mobile Money'),
  ('support_contacts', '{"whatsapp": "+228 90 00 00 00", "telegram": "https://t.me/vitaearn_officiel", "email": "contact@vitaearn.com"}', 'Coordonnées officielles de support')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- 5. Règle stricte pour la protection du Super Admin
CREATE OR REPLACE FUNCTION public.check_super_admin_protection()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email = 'adayiespoir60@gmail.com' AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Le rôle du Super Administrateur principal ne peut pas être rétrogradé.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_super_admin_protect ON public.profiles;
CREATE TRIGGER tr_super_admin_protect
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_super_admin_protection();
