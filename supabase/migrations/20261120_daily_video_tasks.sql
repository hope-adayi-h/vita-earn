-- ==============================================================================
-- Vita Earn — Migration : Système de Gestion des Tâches Vidéo Quotidiennes
-- Monnaie : FCFA (XOF), entiers sans décimales.
-- Fuseau horaire : Africa/Lome (UTC+0)
-- Jours ouvrables : Lundi (1) à Vendredi (5). Week-end exclu.
-- ==============================================================================

-- 1. Table des tâches vidéo quotidiennes (programmables par l'administrateur)
CREATE TABLE IF NOT EXISTS public.daily_video_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi
  specific_date DATE, -- Optionnel : si renseigné, n'apparaît que ce jour précis (du lundi au vendredi)
  title TEXT NOT NULL,
  video_url TEXT NOT NULL, -- URL originale collée par l'admin (non transmise au client)
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'facebook', 'instagram')),
  embed_url TEXT NOT NULL, -- URL d'intégration officielle sécurisée reconstruite
  video_id TEXT, -- Identifiant extrait de la vidéo
  instructions TEXT NOT NULL, -- Consignes de la tâche
  reward_amount BIGINT NOT NULL DEFAULT 100 CHECK (reward_amount > 0), -- Récompense en FCFA
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Contrôle d'activation admin
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Suppression logique (soft-delete) pour conserver l'historique
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_day ON public.daily_video_tasks(day_of_week) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON public.daily_video_tasks(specific_date) WHERE NOT is_deleted;

-- 2. Table d'historique des validations par utilisateur (Idempotence & Anti-triche)
CREATE TABLE IF NOT EXISTS public.daily_task_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.daily_video_tasks(id) ON DELETE CASCADE,
  validated_date DATE NOT NULL, -- Date du serveur (Lomé)
  reward_amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_id, validated_date)
);

CREATE INDEX IF NOT EXISTS idx_task_validations_user ON public.daily_task_validations(user_id, validated_date);

-- 3. Plafond de récompense dans platform_settings (défaut 500 FCFA)
INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'task_reward_max',
  '{"amount": 500, "currency": "XOF"}'::jsonb,
  'Plafond maximum de récompense pour une tâche vidéo quotidienne (en FCFA)'
)
ON CONFLICT (key) DO NOTHING;

-- 4. Initialisation des 5 tâches par défaut pour chaque jour ouvrable
INSERT INTO public.daily_video_tasks (day_of_week, title, video_url, platform, embed_url, video_id, instructions, reward_amount, is_active)
VALUES
  (
    1,
    'Tâche du Lundi — Découverte & Actualités Tech',
    'https://www.tiktok.com/@tiktok/video/7106594312292453678',
    'tiktok',
    'https://www.tiktok.com/embed/v2/7106594312292453678',
    '7106594312292453678',
    'Visionnez attentivement cette courte vidéo partenaire. Dès la fin du visionnage, cliquez sur Valider pour créditer votre solde.',
    100,
    TRUE
  ),
  (
    2,
    'Tâche du Mardi — Formation Stratégies Digitales',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1',
    'dQw4w9WgXcQ',
    'Regardez la vidéo de formation du jour pour développer vos compétences. Cliquez sur le bouton de validation pour percevoir votre gain.',
    150,
    TRUE
  ),
  (
    3,
    'Tâche du Mercredi — Opportunités & E-commerce',
    'https://www.youtube.com/watch?v=L_LUpnjgPso',
    'youtube',
    'https://www.youtube-nocookie.com/embed/L_LUpnjgPso?rel=0&modestbranding=1',
    'L_LUpnjgPso',
    'Suivez ce tutoriel pratique sur le commerce en ligne en Afrique de l''Ouest et validez votre récompense journalière.',
    100,
    TRUE
  ),
  (
    4,
    'Tâche du Jeudi — Astuces Création de Contenu',
    'https://www.tiktok.com/@tiktok/video/7010459312292453678',
    'tiktok',
    'https://www.tiktok.com/embed/v2/7010459312292453678',
    '7010459312292453678',
    'Découvrez les meilleures méthodes pour optimiser votre visibilité en ligne et validez votre tâche du jour.',
    120,
    TRUE
  ),
  (
    5,
    'Tâche du Vendredi — Synthèse & Éducation Financière',
    'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    'youtube',
    'https://www.youtube-nocookie.com/embed/fJ9rUzIMcZQ?rel=0&modestbranding=1',
    'fJ9rUzIMcZQ',
    'Complétez votre session vidéo de fin de semaine et recevez votre récompense directement sur votre portefeuille.',
    150,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 5. Procédure SQL atomique et sécurisée de validation de tâche vidéo
CREATE OR REPLACE FUNCTION public.validate_video_task(
  p_user_id UUID,
  p_task_id UUID,
  p_current_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_profile RECORD;
  v_task RECORD;
  v_max_reward BIGINT := 500;
  v_already_done BOOLEAN;
  v_wallet_id UUID;
  v_day_of_week INT;
BEGIN
  -- 1. Vérifier que la date n'est pas un week-end (samedi=6, dimanche=7)
  v_day_of_week := EXTRACT(ISODOW FROM p_current_date);
  IF v_day_of_week IN (6, 7) THEN
    RAISE EXCEPTION 'Les tâches rémunérées ne sont pas disponibles le week-end.';
  END IF;

  -- 2. Vérifier l'utilisateur et son statut d'activation
  SELECT id, is_activated, role INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur introuvable.';
  END IF;

  IF NOT COALESCE(v_profile.is_activated, FALSE) THEN
    RAISE EXCEPTION 'Votre compte doit être activé pour participer et valider les tâches rémunérées.';
  END IF;

  -- 3. Vérifier la tâche (active, non supprimée, programmée aujourd'hui)
  SELECT * INTO v_task
  FROM public.daily_video_tasks
  WHERE id = p_task_id AND NOT is_deleted;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tâche introuvable ou archivée.';
  END IF;

  IF NOT v_task.is_active THEN
    RAISE EXCEPTION 'Cette tâche n''est pas encore activée par l''administrateur.';
  END IF;

  -- Vérifier la programmation de la tâche pour aujourd'hui
  IF v_task.specific_date IS NOT NULL THEN
    IF v_task.specific_date <> p_current_date THEN
      RAISE EXCEPTION 'Cette tâche est programmée pour une autre date.';
    END IF;
  ELSE
    IF v_task.day_of_week <> v_day_of_week THEN
      RAISE EXCEPTION 'Cette tâche n''est pas programmée pour aujourd''hui.';
    END IF;
  END IF;

  -- 4. Vérifier l'idempotence stricte (déjà validée ?)
  SELECT EXISTS(
    SELECT 1 FROM public.daily_task_validations
    WHERE user_id = p_user_id AND task_id = p_task_id AND validated_date = p_current_date
  ) INTO v_already_done;

  IF v_already_done THEN
    RAISE EXCEPTION 'Vous avez déjà validé cette tâche aujourd''hui.';
  END IF;

  -- 5. Vérifier le plafond de récompense depuis platform_settings
  SELECT COALESCE((value->>'amount')::BIGINT, 500) INTO v_max_reward
  FROM public.platform_settings
  WHERE key = 'task_reward_max';

  IF v_task.reward_amount > v_max_reward THEN
    v_task.reward_amount := v_max_reward;
  END IF;

  -- 6. Récupérer ou créer le portefeuille utilisateur
  SELECT id INTO v_wallet_id
  FROM public.wallets
  WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_wallet_id;
  END IF;

  -- 7. Enregistrer la validation (contrainte UNIQUE)
  INSERT INTO public.daily_task_validations (
    user_id,
    task_id,
    validated_date,
    reward_amount
  )
  VALUES (
    p_user_id,
    p_task_id,
    p_current_date,
    v_task.reward_amount
  );

  -- 8. Écriture immuable dans le grand livre (ledger_entries)
  INSERT INTO public.ledger_entries (
    wallet_id,
    amount,
    entry_type,
    reference_id,
    description
  )
  VALUES (
    v_wallet_id,
    v_task.reward_amount,
    'task_credit',
    p_task_id::TEXT,
    'Gain tâche vidéo validée : ' || v_task.title
  );

  -- 9. Audit log
  BEGIN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (
      p_user_id,
      'daily_video_task_validated',
      'daily_video_tasks',
      p_task_id::TEXT,
      jsonb_build_object(
        'reward', v_task.reward_amount,
        'date', p_current_date,
        'platform', v_task.platform
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Table audit_logs optionnelle
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'reward', v_task.reward_amount,
    'task_id', p_task_id,
    'message', 'Félicitations ! Vous avez validé la tâche du jour et gagné ' || v_task.reward_amount || ' FCFA.'
  );
END;
$$;

-- 6. Politiques RLS (Row Level Security)
ALTER TABLE public.daily_video_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_validations ENABLE ROW LEVEL SECURITY;

-- Lecture publique des tâches actives (les colonnes sensibles comme video_url brute sont protégées côté serveur)
DROP POLICY IF EXISTS "Lecture des tâches pour tous" ON public.daily_video_tasks;
CREATE POLICY "Lecture des tâches pour tous"
  ON public.daily_video_tasks FOR SELECT
  TO authenticated, anon
  USING (NOT is_deleted);

-- Modification réservée aux admins
DROP POLICY IF EXISTS "Modification des tâches par les admins" ON public.daily_video_tasks;
CREATE POLICY "Modification des tâches par les admins"
  ON public.daily_video_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Validations : les utilisateurs voient leurs propres validations
DROP POLICY IF EXISTS "Lecture des validations utilisateur" ON public.daily_task_validations;
CREATE POLICY "Lecture des validations utilisateur"
  ON public.daily_task_validations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
