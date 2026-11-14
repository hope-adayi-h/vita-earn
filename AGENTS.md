# AGENTS.md — Vita Earn (web, MVP)

Plateforme web pour l'Afrique de l'Ouest francophone (Togo d'abord) : marketplace
(produits physiques et digitaux), portefeuille et retraits Mobile Money, activation
du compte par paiement unique. Langue de l'interface : français. Monnaie : FCFA (XOF),
entiers, sans décimales. Développeur : Espoir (solo).

## Stack
- Next.js (App Router) + TypeScript strict, Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage) via `@supabase/ssr`
- Hébergement : Netlify. Code : GitHub.
- Le schéma de base de données est la source de vérité : `supabase/schema.sql`
  (déjà exécuté sur le projet Supabase). Ne jamais le contourner ni le réécrire sans demande.

## RÈGLES ABSOLUES (sécurité et argent)
1. Aucun solde n'est stocké ni modifié directement. Le solde = somme de `ledger_entries`
   (vue `wallet_balances`). Le grand livre est immuable : jamais de UPDATE/DELETE dessus.
2. Toute opération d'argent passe par les fonctions SQL `activate_account`,
   `request_withdrawal`, `review_withdrawal`, appelées UNIQUEMENT depuis le serveur
   (Route Handlers ou Server Actions) avec la clé `service_role`.
3. La clé `SUPABASE_SERVICE_ROLE_KEY` ne va jamais dans le navigateur : pas de préfixe
   `NEXT_PUBLIC_`, jamais dans un composant client, jamais commitée. Seuls l'URL Supabase
   et la clé `anon` sont publiques.
4. Ne jamais faire confiance au client pour un montant, un prix, un rôle ou un statut.
   Prix d'activation, commission et frais viennent de `platform_settings`, lus côté serveur.
5. Les webhooks de paiement : vérifier la signature du fournisseur, être idempotent
   (clé `idempotency_key`, unicité `provider` + `provider_ref`), ne passer un paiement en
   `succeeded` qu'après vérification auprès du fournisseur, puis appeler la fonction SQL.
6. Toujours vérifier l'utilisateur côté serveur avec `supabase.auth.getUser()`
   (pas `getSession()`) avant toute action sensible.
7. Les fichiers digitaux vivent dans un bucket Storage PRIVÉ. Téléchargement uniquement par
   lien signé temporaire, généré côté serveur après vérification d'une commande payée.
8. Valider toutes les entrées côté serveur (zod). Pas de HTML injecté sans échappement.
9. Ne jamais journaliser de secrets, numéros complets de téléphone ou jetons.

## Programme d'Affiliation sur Abonnement (3 Niveaux)
Programme d'affiliation légal adossé à un abonnement de 4 500 FCFA donnant accès à de réelles
formations et ressources pédagogiques. Les commissions rémunèrent la promotion et l'acquisition
de nouveaux abonnés :
- Montant abonnement : 4 500 FCFA (lu dans platform_settings)
- Niveau 1 (parrain direct) : 2 000 FCFA
- Niveau 2 (parrain second niveau) : 1 000 FCFA
- Niveau 3 (parrain troisième niveau) : 500 FCFA
- Reste plateforme (frais techniques / service) : 1 000 FCFA (ou davantage si niveau non éligible)
Les commissions sont calculées uniquement sur abonnement payé et vérifié. Aucun calcul répété.
Enregistrement dans le grand livre immuable (ledger_entries) pour chaque bénéficiaire.

## Périmètre du MVP (dans cet ordre)
1. Inscription, connexion, déconnexion, mot de passe oublié (e-mail pour l'instant).
2. Écran d'activation : crée un `payments` (purpose `activation`, montant lu dans
   `platform_settings`), fournisseur de paiement derrière une interface `PaymentProvider`
   avec une implémentation `MockProvider` (simulée). Le vrai agrégateur (CinetPay, PayDunya,
   FedaPay ou Flutterwave) sera branché plus tard.
3. Accueil, marketplace (liste, recherche, filtres, fiche produit), publication d'article
   (réservée aux comptes activés, produit créé en `pending`, modération admin).
4. Portefeuille : solde, historique du grand livre, demande de retrait Mobile Money.
5. Back-office admin minimal : modération des produits, validation des retraits, réglages.
Hors périmètre pour l'instant : formations, applications premium, tâches, emplois,
messagerie, application mobile.

## Données (résumé)
`profiles` (id = auth.users.id ; `role`, `is_activated`, `kyc_status` non modifiables par
l'utilisateur), `wallets`, `ledger_entries`, `payments`, `shops` (une par vendeur),
`products`, `product_images`, `product_files` (privé), `orders`, `order_items`, `reviews`,
`withdrawals`, `referrals` (désactivé), `audit_logs`, `platform_settings`.
Le profil et le portefeuille sont créés automatiquement à l'inscription (trigger).
Les politiques RLS protègent déjà les accès : ne pas les affaiblir, et toujours tester
une nouvelle requête avec un utilisateur non admin.

## Design (d'après la maquette)
Vert profond `#1B4D0F`, vert moyen `#2F7A1A`, vert vif `#7ED321`, fond `#F4F7F0`,
texte `#14201A` / `#5B6B60`. Police Inter. Coins arrondis 14 à 28 px, zones tactiles
44 px minimum, mobile d'abord, pages légères (réseau 3G/4G). Navigation 5 entrées :
Accueil, Marché, Vendre, Portefeuille, Profil.

## Conventions
- TypeScript strict, pas de `any`. Composants serveur par défaut.
- Structure : `app/`, `components/`, `lib/supabase/{client,server,admin}.ts`,
  `lib/payments/`, `lib/validation/`.
- `lib/supabase/admin.ts` (service_role) : importé uniquement dans du code serveur,
  avec `import "server-only"`.
- Variables d'environnement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, plus celles du fournisseur de paiement. Fournir `.env.example`
  sans valeurs. `.env*` dans `.gitignore`.
- Messages d'erreur en français, clairs, sans détail technique pour l'utilisateur.
- RÈGLE DESIGN : Jamais d'emojis dans le code ni dans les interfaces : utiliser exclusivement des icônes vectorielles SVG (Lucide React) ou du texte / badges épurés.
- Après chaque fonctionnalité : lancer le lint et le build, puis résumer ce qui a été
  fait et ce qui reste.
