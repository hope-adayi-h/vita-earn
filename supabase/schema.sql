-- ==============================================================================
-- Vita Earn — Schéma Supabase complet (PostgreSQL)
-- Monnaie : FCFA (XOF), entiers sans décimales.
-- Source de vérité pour la base de données.
-- ==============================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES (étend auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
  is_activated BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_status TEXT NOT NULL DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected')),
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les admins peuvent voir tous les profils" ON public.profiles;
CREATE POLICY "Les admins peuvent voir tous les profils"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les champs autorises de leur profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent modifier les champs autorises de leur profil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- role, is_activated et kyc_status ne peuvent jamais etre modifies par le client
  );

-- ==============================================================================
-- 2. WALLETS (Portefeuilles utilisateurs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre portefeuille" ON public.wallets;
CREATE POLICY "Les utilisateurs peuvent voir leur propre portefeuille"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. LEDGER_ENTRIES (Grand livre immuable)
-- RÈGLE : Aucun solde stocké directement. Somme des ledger_entries = solde.
-- Jamais de UPDATE ou DELETE sur cette table.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL, -- en FCFA (positif = crédit, négatif = débit)
  entry_type TEXT NOT NULL CHECK (
    entry_type IN (
      'activation_credit',
      'sale_credit',
      'withdrawal_debit',
      'fee_debit',
      'refund_credit',
      'adjustment',
      'commission_level_1',
      'commission_level_2',
      'commission_level_3'
    )
  ),
  reference_id TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet_id ON public.ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON public.ledger_entries(created_at DESC);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les ecritures de leur portefeuille" ON public.ledger_entries;
CREATE POLICY "Les utilisateurs peuvent voir les ecritures de leur portefeuille"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE wallets.id = ledger_entries.wallet_id AND wallets.user_id = auth.uid()
    )
  );

-- Verrou d'immuabilité : interdiction stricte de UPDATE et DELETE
CREATE OR REPLACE FUNCTION public.prevent_ledger_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Le grand livre est immuable : UPDATE et DELETE sont strictement interdits.';
END;
$$;

DROP TRIGGER IF EXISTS trigger_immutable_ledger ON public.ledger_entries;
CREATE TRIGGER trigger_immutable_ledger
  BEFORE UPDATE OR DELETE ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_modifications();

-- ==============================================================================
-- 4. VUE WALLET_BALANCES (Solde dynamique calculé)
-- ==============================================================================
CREATE OR REPLACE VIEW public.wallet_balances AS
SELECT
  w.id AS wallet_id,
  w.user_id,
  COALESCE(SUM(l.amount), 0)::BIGINT AS balance,
  COALESCE(SUM(l.amount), 0)::BIGINT AS available_balance,
  COALESCE((
    SELECT SUM(c.amount)
    FROM public.commissions c
    WHERE c.beneficiary_id = w.user_id AND c.status = 'pending'
  ), 0)::BIGINT AS pending_balance,
  COALESCE(SUM(CASE WHEN l.amount > 0 THEN l.amount ELSE 0 END), 0)::BIGINT AS total_earned,
  COALESCE(SUM(CASE WHEN l.amount < 0 AND l.entry_type = 'withdrawal_debit' THEN ABS(l.amount) ELSE 0 END), 0)::BIGINT AS total_withdrawn
FROM public.wallets w
LEFT JOIN public.ledger_entries l ON w.id = l.wallet_id
GROUP BY w.id, w.user_id;

-- ==============================================================================
-- 5. PLATFORM_SETTINGS (Réglages de la plateforme)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut lire les reglages publics" ON public.platform_settings;
CREATE POLICY "Tout le monde peut lire les reglages publics"
  ON public.platform_settings FOR SELECT
  TO authenticated, anon
  USING (TRUE);

-- Valeurs par défaut indispensables
INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('activation_fee', '{"amount": 4500, "currency": "XOF"}'::jsonb, 'Prix du forfait unique d activation du compte'),
  ('referral_enabled', 'false'::jsonb, 'Systeme de parrainage desactive (anti schema pyramidal)'),
  ('withdrawal_min_amount', '{"amount": 2000, "currency": "XOF"}'::jsonb, 'Montant minimum de retrait'),
  ('withdrawal_fixed_fee', '{"amount": 500, "currency": "XOF"}'::jsonb, 'Frais de retrait Mobile Money fixes (500 FCFA pour tous montants)')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 6. PAYMENTS (Transactions de paiement entrantes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- en FCFA
  currency TEXT NOT NULL DEFAULT 'XOF',
  purpose TEXT NOT NULL CHECK (purpose IN ('activation', 'order_payment')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  provider TEXT NOT NULL, -- 'mock', 'cinetpay', 'fedapay', etc.
  provider_ref TEXT,
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_provider_ref UNIQUE (provider, provider_ref)
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres paiements" ON public.payments;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres paiements"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent creer un paiement pour leur compte" ON public.payments;
CREATE POLICY "Les utilisateurs peuvent creer un paiement pour leur compte"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 7. SHOPS (Boutiques des vendeurs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les boutiques actives" ON public.shops;
CREATE POLICY "Tout le monde peut voir les boutiques actives"
  ON public.shops FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Les vendeurs gerent leur propre boutique" ON public.shops;
CREATE POLICY "Les vendeurs gerent leur propre boutique"
  ON public.shops FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 8. PRODUCTS (Catalogue Marketplace)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL, -- FCFA
  product_type TEXT NOT NULL CHECK (product_type IN ('physical', 'digital')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les produits approuves" ON public.products;
CREATE POLICY "Tout le monde peut voir les produits approuves"
  ON public.products FOR SELECT
  TO authenticated, anon
  USING (status = 'approved');

-- ==============================================================================
-- 9. PRODUCT_IMAGES & PRODUCT_FILES (Stockage privé)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les images de produits" ON public.product_images;
CREATE POLICY "Tout le monde peut voir les images de produits"
  ON public.product_images FOR SELECT
  TO authenticated, anon
  USING (TRUE);

CREATE TABLE IF NOT EXISTS public.product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Dans bucket privé Storage
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;
-- Aucun accès SELECT public : téléchargement via URL signée serveur uniquement !

-- ==============================================================================
-- 10. ORDERS & ORDER_ITEMS (Commandes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount BIGINT NOT NULL, -- FCFA
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'cancelled')),
  payment_id UUID REFERENCES public.payments(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs voient leurs propres commandes" ON public.orders;
CREATE POLICY "Les utilisateurs voient leurs propres commandes"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL,
  subtotal BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 11. REVIEWS (Avis clients)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_user_review UNIQUE (product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut lire les avis" ON public.reviews;
CREATE POLICY "Tout le monde peut lire les avis"
  ON public.reviews FOR SELECT
  TO authenticated, anon
  USING (TRUE);

-- ==============================================================================
-- 12. WITHDRAWALS (Demandes de retraits Mobile Money)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
  fee BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL CHECK (net_amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('tmoney', 'flooz', 'wave', 'mtn_momo', 'orange', 'moov', 'free', 'celtiis', 'airtel', 'card', 'mobile_money')),
  phone_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'paid')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs voient leurs propres retraits" ON public.withdrawals;
CREATE POLICY "Les utilisateurs voient leurs propres retraits"
  ON public.withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les admins voient toutes les demandes de retrait" ON public.withdrawals;
CREATE POLICY "Les admins voient toutes les demandes de retrait"
  ON public.withdrawals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 13. REFERRALS (Système de parrainage et filiation)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_anti_self_referral CHECK (referrer_id != referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs voient leurs propres parrainages" ON public.referrals;
CREATE POLICY "Les utilisateurs voient leurs propres parrainages"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Les admins voient tous les parrainages" ON public.referrals;
CREATE POLICY "Les admins voient tous les parrainages"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 13bis. COMMISSIONS (Commissions d'affiliation 3 niveaux)
-- Strictement : Niveau 1 = 2 000 FCFA, Niveau 2 = 1 000 FCFA, Niveau 3 = 500 FCFA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level IN (1, 2, 3)),
  amount BIGINT NOT NULL CHECK (amount IN (500, 1000, 2000)),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('pending', 'available', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_level UNIQUE (payment_id, level)
);

CREATE INDEX IF NOT EXISTS idx_commissions_beneficiary ON public.commissions(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_commissions_buyer ON public.commissions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payment ON public.commissions(payment_id);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.commissions(created_at DESC);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les utilisateurs voient leurs propres commissions" ON public.commissions;
CREATE POLICY "Les utilisateurs voient leurs propres commissions"
  ON public.commissions FOR SELECT
  TO authenticated
  USING (auth.uid() = beneficiary_id);

DROP POLICY IF EXISTS "Les admins voient toutes les commissions" ON public.commissions;
CREATE POLICY "Les admins voient toutes les commissions"
  ON public.commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 14. AUDIT_LOGS (Journal d'audit pour sécurité)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 15. TRIGGERS AUTOMATIQUES À L'INSCRIPTION
-- Crée automatiquement le profil et le portefeuille lors de auth.users INSERT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_upline_input TEXT;
  v_referrer_id UUID;
BEGIN
  -- 1. Générer code de parrainage unique
  v_referral_code := public.generate_referral_code();

  -- 2. Création du profil utilisateur
  INSERT INTO public.profiles (id, full_name, phone, role, is_activated, kyc_status, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', ''),
    NEW.raw_user_meta_data->>'phone',
    'user',
    FALSE,
    'none',
    v_referral_code
  )
  ON CONFLICT (id) DO UPDATE
  SET referral_code = COALESCE(public.profiles.referral_code, v_referral_code);

  -- 3. Création du portefeuille
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Traitement automatique du parrainage s'il est spécifié (upline)
  v_upline_input := TRIM(COALESCE(NEW.raw_user_meta_data->>'upline', NEW.raw_user_meta_data->>'ref', ''));
  IF v_upline_input <> '' AND v_upline_input NOT ILIKE 'No One' AND v_upline_input NOT ILIKE 'Aucun' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE (referral_code = UPPER(v_upline_input) OR LOWER(full_name) = LOWER(v_upline_input))
      AND id != NEW.id
    LIMIT 1;

    IF v_referrer_id IS NOT NULL AND v_referrer_id != NEW.id THEN
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (v_referrer_id, NEW.id)
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;

  -- 5. Journalisation d'audit
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, payload)
  VALUES (
    NEW.id,
    'user_registered',
    'auth.users',
    NEW.id::TEXT,
    jsonb_build_object('referral_code', v_referral_code, 'referrer_id', v_referrer_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 16. FONCTION SQL D'ACTIVATION (Exécutée uniquement avec service_role)
-- Calcule et distribue les commissions d'affiliation sur 3 niveaux :
-- Niveau 1 = 2 000 FCFA, Niveau 2 = 1 000 FCFA, Niveau 3 = 500 FCFA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.activate_account(
  p_user_id UUID,
  p_payment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_profile RECORD;
  v_commissions_count INT;
  v_referrer_l1 UUID;
  v_wallet_l1 UUID;
  v_referrer_l2 UUID;
  v_wallet_l2 UUID;
  v_referrer_l3 UUID;
  v_wallet_l3 UUID;
BEGIN
  -- 1. Vérification du paiement
  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paiement introuvable ou non assigne a cet utilisateur.';
  END IF;

  IF v_payment.status != 'succeeded' THEN
    RAISE EXCEPTION 'Le paiement doit etre en statut succeeded pour activer le compte.';
  END IF;

  IF v_payment.purpose != 'activation' THEN
    RAISE EXCEPTION 'Ce paiement n est pas destine a l activation.';
  END IF;

  -- 2. Vérification du profil
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur introuvable.';
  END IF;

  IF v_profile.is_activated = TRUE THEN
    RETURN jsonb_build_object('success', true, 'already_activated', true, 'message', 'Le compte est deja active.');
  END IF;

  -- 3. Activation du profil
  UPDATE public.profiles
  SET is_activated = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 4. DISTRIBUTION DES COMMISSIONS SUR 3 NIVEAUX
  -- Vérifier si des commissions ont déjà été générées pour ce paiement (Idempotence)
  SELECT COUNT(*) INTO v_commissions_count
  FROM public.commissions
  WHERE payment_id = p_payment_id;

  IF v_commissions_count = 0 THEN
    -- Recherche du Parrain Niveau 1 (Direct)
    SELECT referrer_id INTO v_referrer_l1
    FROM public.referrals
    WHERE referred_id = p_user_id;

    IF v_referrer_l1 IS NOT NULL AND v_referrer_l1 != p_user_id THEN
      SELECT id INTO v_wallet_l1 FROM public.wallets WHERE user_id = v_referrer_l1;
      
      IF v_wallet_l1 IS NOT NULL THEN
        -- Commission Niveau 1 : 2 000 FCFA
        INSERT INTO public.commissions (beneficiary_id, buyer_id, payment_id, level, amount, status)
        VALUES (v_referrer_l1, p_user_id, p_payment_id, 1, 2000, 'available');

        INSERT INTO public.ledger_entries (wallet_id, amount, entry_type, reference_id, description)
        VALUES (v_wallet_l1, 2000, 'commission_level_1', p_payment_id::TEXT, 'Commission Parrainage Niveau 1 (Filleul direct)');
      END IF;

      -- Recherche du Parrain Niveau 2 (Parrain du parrain direct)
      SELECT referrer_id INTO v_referrer_l2
      FROM public.referrals
      WHERE referred_id = v_referrer_l1;

      IF v_referrer_l2 IS NOT NULL AND v_referrer_l2 != p_user_id AND v_referrer_l2 != v_referrer_l1 THEN
        SELECT id INTO v_wallet_l2 FROM public.wallets WHERE user_id = v_referrer_l2;

        IF v_wallet_l2 IS NOT NULL THEN
          -- Commission Niveau 2 : 1 000 FCFA
          INSERT INTO public.commissions (beneficiary_id, buyer_id, payment_id, level, amount, status)
          VALUES (v_referrer_l2, p_user_id, p_payment_id, 2, 1000, 'available');

          INSERT INTO public.ledger_entries (wallet_id, amount, entry_type, reference_id, description)
          VALUES (v_wallet_l2, 1000, 'commission_level_2', p_payment_id::TEXT, 'Commission Parrainage Niveau 2');
        END IF;

        -- Recherche du Parrain Niveau 3 (Parrain du niveau 2)
        SELECT referrer_id INTO v_referrer_l3
        FROM public.referrals
        WHERE referred_id = v_referrer_l2;

        IF v_referrer_l3 IS NOT NULL AND v_referrer_l3 != p_user_id AND v_referrer_l3 != v_referrer_l1 AND v_referrer_l3 != v_referrer_l2 THEN
          SELECT id INTO v_wallet_l3 FROM public.wallets WHERE user_id = v_referrer_l3;

          IF v_wallet_l3 IS NOT NULL THEN
            -- Commission Niveau 3 : 500 FCFA
            INSERT INTO public.commissions (beneficiary_id, buyer_id, payment_id, level, amount, status)
            VALUES (v_referrer_l3, p_user_id, p_payment_id, 3, 500, 'available');

            INSERT INTO public.ledger_entries (wallet_id, amount, entry_type, reference_id, description)
            VALUES (v_wallet_l3, 500, 'commission_level_3', p_payment_id::TEXT, 'Commission Parrainage Niveau 3');
          END IF;
        END IF; -- Fin Niveau 3
      END IF; -- Fin Niveau 2
    END IF; -- Fin Niveau 1
  END IF;

  -- 5. Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, payload)
  VALUES (
    p_user_id,
    'account_activated',
    'profiles',
    p_user_id::TEXT,
    jsonb_build_object(
      'payment_id', p_payment_id,
      'amount', v_payment.amount,
      'referrer_l1', v_referrer_l1,
      'referrer_l2', v_referrer_l2,
      'referrer_l3', v_referrer_l3
    )
  );

  RETURN jsonb_build_object('success', true, 'activated', true, 'message', 'Compte active avec succes et commissions creditees.');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_account(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_account(UUID, UUID) TO service_role;

-- ==============================================================================
-- 17. FONCTIONS SQL POUR LES RETRAITS (Service Role)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_user_id UUID,
  p_amount BIGINT,
  p_payment_method TEXT,
  p_phone_number TEXT,
  p_account_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance BIGINT;
  v_min_amount BIGINT;
  v_fee_pct NUMERIC;
  v_fee BIGINT;
  v_net BIGINT;
  v_withdrawal_id UUID;
BEGIN
  -- Récupérer portefeuille et solde actuel
  SELECT wallet_id, balance INTO v_wallet_id, v_current_balance
  FROM public.wallet_balances
  WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable.';
  END IF;

  -- Récupérer réglages
  v_min_amount := COALESCE((SELECT (value->>'amount')::BIGINT FROM public.platform_settings WHERE key = 'withdrawal_min_amount'), 2000);
  v_fee := COALESCE((SELECT (value->>'amount')::BIGINT FROM public.platform_settings WHERE key = 'withdrawal_fixed_fee'), 500);

  IF p_amount < v_min_amount THEN
    RAISE EXCEPTION 'Le montant minimum de retrait est de % FCFA.', v_min_amount;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant pour effectuer ce retrait.';
  END IF;

  -- Calcul du montant net (frais fixes de 500 FCFA)
  v_net := p_amount - v_fee;

  -- Création de la demande
  INSERT INTO public.withdrawals (
    user_id,
    wallet_id,
    amount,
    fee,
    net_amount,
    payment_method,
    phone_number,
    account_name,
    status
  )
  VALUES (
    p_user_id,
    v_wallet_id,
    p_amount,
    v_fee,
    v_net,
    p_payment_method,
    p_phone_number,
    p_account_name,
    'pending'
  )
  RETURNING id INTO v_withdrawal_id;

  -- Débit immédiat du solde dans le grand livre pour réserver le montant
  INSERT INTO public.ledger_entries (
    wallet_id,
    amount,
    entry_type,
    reference_id,
    description
  )
  VALUES (
    v_wallet_id,
    -p_amount,
    'withdrawal_debit',
    v_withdrawal_id::TEXT,
    'Demande de retrait Mobile Money (' || p_payment_method || ')'
  );

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal_id, 'net_amount', v_net);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_withdrawal(UUID, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, BIGINT, TEXT, TEXT, TEXT) TO service_role;

-- ==============================================================================
-- 18. FONCTION SQL D'EXAMEN DES RETRAITS (Service Role)
-- Approuve, rejette (avec restitution intégrale) ou marque payé un retrait
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.review_withdrawal(
  p_withdrawal_id UUID,
  p_action TEXT,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_admin_role TEXT;
BEGIN
  -- 1. Vérifier le rôle admin
  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = p_admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Action réservée aux administrateurs.';
  END IF;

  -- 2. Récupérer la demande de retrait
  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande de retrait introuvable.';
  END IF;

  -- Sécurité : Un utilisateur ne peut jamais valider son propre retrait
  IF v_withdrawal.user_id = p_admin_id THEN
    RAISE EXCEPTION 'Un administrateur ne peut pas valider son propre retrait.';
  END IF;

  -- 3. Appliquer l'action
  IF p_action = 'approve' THEN
    IF v_withdrawal.status != 'pending' AND v_withdrawal.status != 'processing' THEN
      RAISE EXCEPTION 'Seules les demandes en attente ou en cours peuvent être approuvées.';
    END IF;

    UPDATE public.withdrawals
    SET status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_note = COALESCE(p_notes, admin_note),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

  ELSIF p_action = 'processing' THEN
    IF v_withdrawal.status != 'pending' THEN
      RAISE EXCEPTION 'Seules les demandes en attente peuvent être passées en cours de traitement.';
    END IF;

    UPDATE public.withdrawals
    SET status = 'processing',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_note = COALESCE(p_notes, admin_note),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

  ELSIF p_action = 'reject' THEN
    IF v_withdrawal.status = 'paid' OR v_withdrawal.status = 'rejected' THEN
      RAISE EXCEPTION 'Impossible de rejeter un retrait déjà payé ou déjà rejeté.';
    END IF;

    UPDATE public.withdrawals
    SET status = 'rejected',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_note = COALESCE(p_notes, 'Demande refusée par l administrateur.'),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    -- RESTITUTION INTÉGRALE DES FONDS DANS LE GRAND LIVRE
    INSERT INTO public.ledger_entries (
      wallet_id,
      amount,
      entry_type,
      reference_id,
      description
    )
    VALUES (
      v_withdrawal.wallet_id,
      v_withdrawal.amount,
      'refund_credit',
      v_withdrawal.id::TEXT,
      'Restitution de retrait rejeté : ' || COALESCE(p_notes, 'Refusé')
    );

  ELSIF p_action = 'paid' THEN
    IF v_withdrawal.status = 'rejected' THEN
      RAISE EXCEPTION 'Impossible de marquer payé un retrait rejeté.';
    END IF;

    IF v_withdrawal.status = 'paid' THEN
      RETURN jsonb_build_object('success', true, 'already_paid', true, 'message', 'Ce retrait est déjà marqué payé.');
    END IF;

    UPDATE public.withdrawals
    SET status = 'paid',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        admin_note = COALESCE(p_notes, admin_note),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

  ELSE
    RAISE EXCEPTION 'Action invalide : %', p_action;
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, payload)
  VALUES (
    p_admin_id,
    'withdrawal_' || p_action,
    'withdrawals',
    p_withdrawal_id::TEXT,
    jsonb_build_object('previous_status', v_withdrawal.status, 'notes', p_notes)
  );

  RETURN jsonb_build_object('success', true, 'action', p_action, 'status', p_action);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_withdrawal(UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_withdrawal(UUID, TEXT, UUID, TEXT) TO service_role;
