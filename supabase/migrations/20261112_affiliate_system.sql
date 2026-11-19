-- ==============================================================================
-- Vita Earn — Migration Résiliente : Abonnement, Affiliation 3 Niveaux & Retraits
-- Date : 2026-11-12
-- ==============================================================================

-- 1. Helper pour générer un code de parrainage unique (ex: VE8K2X9P)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code TEXT := '';
  v_i INT;
  v_exists BOOLEAN := TRUE;
BEGIN
  WHILE v_exists LOOP
    v_code := 'VE';
    FOR v_i IN 1..6 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::INT, 1);
    END LOOP;
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code) INTO v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 2. Ajouter referral_code à profiles s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
END $$;

-- Assigner un code unique à tous les profils existants sans code
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL OR referral_code = '';

-- RLS profiles : lecture publique du code parrain pour l'inscription
DROP POLICY IF EXISTS "Lecture publique du code parrain pour inscription" ON public.profiles;
CREATE POLICY "Lecture publique du code parrain pour inscription"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (TRUE);

-- 3. Sécurisation de la table referrals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'referrals'
  ) THEN
    CREATE TABLE public.referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_anti_self_referral'
  ) THEN
    ALTER TABLE public.referrals ADD CONSTRAINT check_anti_self_referral CHECK (referrer_id != referred_id);
  END IF;
END $$;

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

-- 4. Table des commissions d'affiliation sur 3 niveaux
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

-- 5. Normalisation et conversion du grand livre (supprime définitivement le verrou ENUM ledger_type)
DROP VIEW IF EXISTS public.wallet_balances CASCADE;
DROP TRIGGER IF EXISTS trigger_immutable_ledger ON public.ledger_entries;

CREATE OR REPLACE FUNCTION public.prevent_ledger_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Le grand livre est immuable : UPDATE et DELETE sont strictement interdits.';
END;
$$;

DO $$
BEGIN
  -- A. Créer la table si elle n'existait pas encore
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ledger_entries'
  ) THEN
    CREATE TABLE public.ledger_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
      amount BIGINT NOT NULL,
      entry_type TEXT NOT NULL DEFAULT 'activation_credit',
      reference_id TEXT,
      description TEXT NOT NULL DEFAULT 'Transaction',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  -- B. Si la colonne entry_type n'est pas déjà en type 'text', effectuer le transfert propre
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'ledger_entries' 
      AND column_name = 'entry_type' 
      AND data_type = 'text'
  ) THEN
    -- Créer la colonne temporaire en TEXT natif
    ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS entry_type_clean TEXT;

    -- Copier les données existantes sous forme de TEXT
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'entry_type'
    ) THEN
      UPDATE public.ledger_entries SET entry_type_clean = entry_type::TEXT;
      ALTER TABLE public.ledger_entries DROP COLUMN entry_type CASCADE;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'type'
    ) THEN
      UPDATE public.ledger_entries SET entry_type_clean = "type"::TEXT;
      ALTER TABLE public.ledger_entries DROP COLUMN "type" CASCADE;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'transaction_type'
    ) THEN
      UPDATE public.ledger_entries SET entry_type_clean = transaction_type::TEXT;
      ALTER TABLE public.ledger_entries DROP COLUMN transaction_type CASCADE;
    END IF;

    -- Renommer la colonne propre en entry_type
    ALTER TABLE public.ledger_entries RENAME COLUMN entry_type_clean TO entry_type;
  END IF;

  -- C. Configurer la valeur par défaut et la nullabilité
  ALTER TABLE public.ledger_entries ALTER COLUMN entry_type SET DEFAULT 'activation_credit';
  ALTER TABLE public.ledger_entries ALTER COLUMN entry_type SET NOT NULL;

  -- D. S'assurer des colonnes reference_id et description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE public.ledger_entries ADD COLUMN reference_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ledger_entries' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.ledger_entries ADD COLUMN description TEXT NOT NULL DEFAULT 'Transaction';
  END IF;

  -- E. Supprimer toute contrainte obsolète et appliquer la contrainte propre
  ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;
  ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_entry_type_check CHECK (
    entry_type IS NOT NULL AND length(entry_type) > 0
  );
END $$;

-- Rétablir le déclencheur d'immuabilité sur le grand livre
DROP TRIGGER IF EXISTS trigger_immutable_ledger ON public.ledger_entries;
CREATE TRIGGER trigger_immutable_ledger
  BEFORE UPDATE OR DELETE ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_modifications();

-- 6. Recréation de la vue wallet_balances (calcul dynamique des soldes disponible et en attente)
DROP VIEW IF EXISTS public.wallet_balances CASCADE;
CREATE VIEW public.wallet_balances AS
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

-- 7. Table withdrawals (retraits Mobile Money)
DO $$
BEGIN
  -- A. Créer la table si elle n'existait pas encore
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'withdrawals'
  ) THEN
    CREATE TABLE public.withdrawals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      wallet_id UUID NOT NULL REFERENCES public.wallets(id),
      amount BIGINT NOT NULL CHECK (amount > 0),
      fee BIGINT NOT NULL DEFAULT 0,
      net_amount BIGINT NOT NULL CHECK (net_amount > 0),
      payment_method TEXT NOT NULL DEFAULT 'tmoney',
      phone_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      reviewed_by UUID REFERENCES auth.users(id),
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  -- B. Gérer le nom de la colonne payment_method (ou renommer method si elle existait)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'payment_method'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'method'
    ) THEN
      ALTER TABLE public.withdrawals RENAME COLUMN "method" TO payment_method;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'provider'
    ) THEN
      ALTER TABLE public.withdrawals RENAME COLUMN "provider" TO payment_method;
    ELSE
      ALTER TABLE public.withdrawals ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'tmoney';
    END IF;
  END IF;

  -- C. S'assurer que payment_method est bien en TEXT natif
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'withdrawals' 
      AND column_name = 'payment_method' 
      AND data_type != 'text'
  ) THEN
    ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS payment_method_clean TEXT;
    UPDATE public.withdrawals SET payment_method_clean = payment_method::TEXT;
    ALTER TABLE public.withdrawals DROP COLUMN payment_method CASCADE;
    ALTER TABLE public.withdrawals RENAME COLUMN payment_method_clean TO payment_method;
  END IF;
  ALTER TABLE public.withdrawals ALTER COLUMN payment_method SET DEFAULT 'tmoney';
  ALTER TABLE public.withdrawals ALTER COLUMN payment_method SET NOT NULL;

  -- D. S'assurer que status est bien en TEXT natif
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'withdrawals' 
      AND column_name = 'status' 
      AND data_type != 'text'
  ) THEN
    ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS status_clean TEXT;
    UPDATE public.withdrawals SET status_clean = status::TEXT;
    ALTER TABLE public.withdrawals DROP COLUMN status CASCADE;
    ALTER TABLE public.withdrawals RENAME COLUMN status_clean TO status;
  END IF;
  ALTER TABLE public.withdrawals ALTER COLUMN status SET DEFAULT 'pending';
  ALTER TABLE public.withdrawals ALTER COLUMN status SET NOT NULL;

  -- E. Colonnes administratives
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'admin_note'
  ) THEN
    ALTER TABLE public.withdrawals ADD COLUMN admin_note TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.withdrawals ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.withdrawals ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;

  ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
  ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_status_check CHECK (
    status IN ('pending', 'processing', 'approved', 'rejected', 'paid')
  );

  ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_payment_method_check;
  ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_payment_method_check CHECK (
    payment_method IN (
      'tmoney', 'flooz', 'wave', 'mtn_momo', 'orange', 'moov', 'free', 'celtiis', 'airtel', 'card', 'mobile_money'
    )
  );
END $$;

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

-- 8. Trigger automatique à l'inscription avec parrainage
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
  v_referral_code := public.generate_referral_code();

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

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

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

-- 9. Fonction SQL d'activation avec distribution des 3 niveaux (2 000 / 1 000 / 500 FCFA)
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
  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paiement introuvable ou non assigné à cet utilisateur.';
  END IF;

  IF v_payment.status != 'succeeded' THEN
    RAISE EXCEPTION 'Le paiement doit être en statut succeeded pour activer le compte.';
  END IF;

  IF v_payment.purpose != 'activation' THEN
    RAISE EXCEPTION 'Ce paiement n est pas destiné à l activation.';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur introuvable.';
  END IF;

  IF v_profile.is_activated = TRUE THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_activated', true,
      'message', 'Le compte est déjà activé.'
    );
  END IF;

  UPDATE public.profiles
  SET is_activated = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_commissions_count
  FROM public.commissions
  WHERE payment_id = p_payment_id;

  IF v_commissions_count = 0 THEN
    -- Niveau 1 (2 000 FCFA)
    SELECT referrer_id INTO v_referrer_l1
    FROM public.referrals
    WHERE referred_id = p_user_id;

    IF v_referrer_l1 IS NOT NULL AND v_referrer_l1 != p_user_id THEN
      SELECT id INTO v_wallet_l1 FROM public.wallets WHERE user_id = v_referrer_l1;
      
      IF v_wallet_l1 IS NOT NULL THEN
        INSERT INTO public.commissions (beneficiary_id, buyer_id, payment_id, level, amount, status)
        VALUES (v_referrer_l1, p_user_id, p_payment_id, 1, 2000, 'available');

        INSERT INTO public.ledger_entries (wallet_id, amount, entry_type, reference_id, description)
        VALUES (v_wallet_l1, 2000, 'commission_level_1', p_payment_id::TEXT, 'Commission Parrainage Niveau 1 (Filleul direct)');
      END IF;

      -- Niveau 2 (1 000 FCFA)
      SELECT referrer_id INTO v_referrer_l2
      FROM public.referrals
      WHERE referred_id = v_referrer_l1;

      IF v_referrer_l2 IS NOT NULL AND v_referrer_l2 != p_user_id AND v_referrer_l2 != v_referrer_l1 THEN
        SELECT id INTO v_wallet_l2 FROM public.wallets WHERE user_id = v_referrer_l2;

        IF v_wallet_l2 IS NOT NULL THEN
          INSERT INTO public.commissions (beneficiary_id, buyer_id, payment_id, level, amount, status)
          VALUES (v_referrer_l2, p_user_id, p_payment_id, 2, 1000, 'available');

          INSERT INTO public.ledger_entries (wallet_id, amount, entry_type, reference_id, description)
          VALUES (v_wallet_l2, 1000, 'commission_level_2', p_payment_id::TEXT, 'Commission Parrainage Niveau 2');
        END IF;

        -- Niveau 3 (500 FCFA)
        SELECT referrer_id INTO v_referrer_l3
        FROM public.referrals
        WHERE referred_id = v_referrer_l2;

        IF v_referrer_l3 IS NOT NULL AND v_referrer_l3 != p_user_id AND v_referrer_l3 != v_referrer_l1 AND v_referrer_l3 != v_referrer_l2 THEN
          SELECT id INTO v_wallet_l3 FROM public.wallets WHERE user_id = v_referrer_l3;

          IF v_wallet_l3 IS NOT NULL THEN
            INSERT INTO public.commissions (beneficiary_id, buyer_id, payment_id, level, amount, status)
            VALUES (v_referrer_l3, p_user_id, p_payment_id, 3, 500, 'available');

            INSERT INTO public.ledger_entries (wallet_id, amount, entry_type, reference_id, description)
            VALUES (v_wallet_l3, 500, 'commission_level_3', p_payment_id::TEXT, 'Commission Parrainage Niveau 3');
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

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

  RETURN jsonb_build_object(
    'success', true,
    'activated', true,
    'message', 'Compte activé et commissions distribuées avec succès.'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_account(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_account(UUID, UUID) TO service_role;

-- 10. Fonction SQL de demande de retrait Mobile Money (Service Role)
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
  v_fee_pct := COALESCE((SELECT (value->>'percent')::NUMERIC FROM public.platform_settings WHERE key = 'withdrawal_fee_percent'), 5.0);

  IF p_amount < v_min_amount THEN
    RAISE EXCEPTION 'Le montant minimum de retrait est de % FCFA.', v_min_amount;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant pour effectuer ce retrait.';
  END IF;

  -- Calcul des frais et montant net (5% arrondi)
  v_fee := ROUND(p_amount * (v_fee_pct / 100.0));
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

  -- Débit immédiat du montant dans le grand livre pour réserver les fonds
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

-- 11. Fonction SQL d'examen des retraits (Approbation, Refus avec restitution, Paiement réel)
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
  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = p_admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Action réservée aux administrateurs.';
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande de retrait introuvable.';
  END IF;

  IF v_withdrawal.user_id = p_admin_id THEN
    RAISE EXCEPTION 'Un administrateur ne peut pas valider son propre retrait.';
  END IF;

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

    -- Restitution intégrale des fonds réservés dans le grand livre
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

-- 12. Réglages de la plateforme
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'platform_settings' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.platform_settings ADD COLUMN description TEXT;
  END IF;
END $$;

INSERT INTO public.platform_settings (key, value)
VALUES
  ('activation_fee', '{"amount": 4500, "currency": "XOF"}'::jsonb),
  ('referral_enabled', 'true'::jsonb),
  ('withdrawal_min_amount', '{"amount": 2000, "currency": "XOF"}'::jsonb),
  ('withdrawal_fee_percent', '{"percent": 5}'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
