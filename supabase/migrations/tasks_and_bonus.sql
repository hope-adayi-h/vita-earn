-- ==============================================================================
-- Vita Earn — Migration : Système des 5 Tâches Quotidiennes & Welcome Bonus
-- Monnaie : FCFA (XOF), entiers sans décimales.
-- ==============================================================================

-- 1. Ajout de la colonne welcome_bonus_claimed dans profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Table des définitions des 5 tâches (contrôlées par l'administrateur)
CREATE TABLE IF NOT EXISTS public.task_definitions (
  id TEXT PRIMARY KEY, -- 'trivia', 'tiktok', 'youtube', 'ads', 'instagram'
  title TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi
  reward_amount BIGINT NOT NULL DEFAULT 15, -- en FCFA
  is_active BOOLEAN NOT NULL DEFAULT FALSE, -- SEUL L'ADMIN PEUT L'ACTIVER
  scheduled_time TEXT NOT NULL DEFAULT '08:00',
  description TEXT NOT NULL DEFAULT '',
  question_prompt TEXT,
  question_choices JSONB,
  correct_choice_index INT DEFAULT 0,
  content_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertion des 5 tâches quotidiennes par défaut (comme sur la capture)
INSERT INTO public.task_definitions (id, title, day_of_week, reward_amount, is_active, scheduled_time, description, question_prompt, question_choices, correct_choice_index)
VALUES 
  ('trivia', 'Trivia Questions', 1, 15, TRUE, '08:00', 'Répondez au quiz de culture générale et gagnez des récompenses instantanées.', 'Quelle est la monnaie officielle utilisée au Togo et dans la zone UEMOA ?', '["Naira", "Franc CFA (XOF)", "Cedi", "Dollar"]'::jsonb, 1),
  ('tiktok', 'TikTok Videos', 2, 50, FALSE, '08:00', 'Visionnez la vidéo partenaire pendant 30 secondes pour valider votre récompense.', NULL, NULL, NULL),
  ('youtube', 'YouTube Videos', 3, 50, FALSE, '08:00', 'Visionnez la vidéo pédagogique YouTube et débloquez vos gains.', NULL, NULL, NULL),
  ('ads', 'Ads Clicking', 4, 30, FALSE, '08:00', 'Visitez l''annonce sponsorisée du jour pour valider vos gains.', NULL, NULL, NULL),
  ('instagram', 'Instagram Videos', 5, 50, FALSE, '08:00', 'Découvrez et interagissez avec le contenu vidéo Instagram du jour.', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  day_of_week = EXCLUDED.day_of_week,
  scheduled_time = EXCLUDED.scheduled_time;

-- 3. Table des cagnottes de tâches par utilisateur (Seuil de 4 500 FCFA)
CREATE TABLE IF NOT EXISTS public.user_task_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL REFERENCES public.task_definitions(id) ON DELETE CASCADE,
  accumulated_amount BIGINT NOT NULL DEFAULT 0,
  unlocked_amount BIGINT NOT NULL DEFAULT 0,
  threshold_amount BIGINT NOT NULL DEFAULT 4500,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  last_completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_type)
);

-- 4. Table d'historique des tâches validées par jour (anti-doublon)
CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL REFERENCES public.task_definitions(id) ON DELETE CASCADE,
  reward_amount BIGINT NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_type, completed_date)
);

-- 5. Mise à jour de la contrainte CHECK sur ledger_entries pour accepter les gains de tâches et welcome bonus
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_entry_type_check CHECK (
  entry_type IN (
    'activation_credit',
    'sale_credit',
    'withdrawal_debit',
    'fee_debit',
    'refund_credit',
    'adjustment',
    'commission_level_1',
    'commission_level_2',
    'commission_level_3',
    'task_credit',
    'welcome_bonus_credit'
  )
);

-- 6. Politiques RLS (Row Level Security)
ALTER TABLE public.task_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture des définitions de tâches pour tous" ON public.task_definitions;
CREATE POLICY "Lecture des définitions de tâches pour tous"
  ON public.task_definitions FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Modification des tâches réservée aux admins" ON public.task_definitions;
CREATE POLICY "Modification des tâches réservée aux admins"
  ON public.task_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Les utilisateurs voient leurs cagnottes" ON public.user_task_earnings;
CREATE POLICY "Les utilisateurs voient leurs cagnottes"
  ON public.user_task_earnings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs voient leur historique" ON public.task_history;
CREATE POLICY "Les utilisateurs voient leur historique"
  ON public.task_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
