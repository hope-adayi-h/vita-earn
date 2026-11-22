const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Lire .env.local
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_ACCOUNT_IDS = [
  'd95f40e1-fcca-49e3-8051-f63a98276d73', // amiespoir
  '0e21dbbd-84b2-4a35-9e2a-e2b75d1c1a2a', // test228
  '51987a30-9e66-4314-b97d-da5675c44f0e', // esp
  '06e389a7-6fc7-4fb9-8737-39c17a454d96', // test
  '20ff9fb7-559d-4c5d-a826-9325bea323dd'  // testeursession
];

const ESPOIR_ID = '333d799b-84ea-493b-b35e-754f88c81b7f';
const ESPOIR_WALLET_ID = '1ff496ce-d9f2-43ea-8e15-3e51cdefc923';

async function main() {
  console.log("=== DÉBUT DU NETTOYAGE (CLEAN SLATE) ===");

  // 1. Supprimer les lignes dans 'referrals' liées aux comptes tests
  console.log("1. Nettoyage des parrainages (referrals)...");
  const { data: delRefs1, error: errRefs1 } = await supabase
    .from('referrals')
    .delete()
    .in('referred_id', TEST_ACCOUNT_IDS)
    .select();
  console.log(`Supprimé ${delRefs1 ? delRefs1.length : 0} referrals (referred_id)`, errRefs1 || "");

  const { data: delRefs2, error: errRefs2 } = await supabase
    .from('referrals')
    .delete()
    .in('referrer_id', TEST_ACCOUNT_IDS)
    .select();
  console.log(`Supprimé ${delRefs2 ? delRefs2.length : 0} referrals (referrer_id)`, errRefs2 || "");

  // 2. Supprimer les commissions liées aux comptes tests
  console.log("2. Nettoyage des commissions...");
  const { data: delComms1, error: errComms1 } = await supabase
    .from('commissions')
    .delete()
    .in('buyer_id', TEST_ACCOUNT_IDS)
    .select();
  console.log(`Supprimé ${delComms1 ? delComms1.length : 0} commissions (buyer_id)`, errComms1 || "");

  const { data: delComms2, error: errComms2 } = await supabase
    .from('commissions')
    .delete()
    .in('beneficiary_id', TEST_ACCOUNT_IDS)
    .select();
  console.log(`Supprimé ${delComms2 ? delComms2.length : 0} commissions (beneficiary_id)`, errComms2 || "");

  // 3. Supprimer les paiements de test des 5 comptes
  console.log("3. Nettoyage des paiements (payments)...");
  const { data: delPays, error: errPays } = await supabase
    .from('payments')
    .delete()
    .in('user_id', TEST_ACCOUNT_IDS)
    .select();
  console.log(`Supprimé ${delPays ? delPays.length : 0} payments`, errPays || "");

  // 4. Supprimer les portefeuilles des 5 comptes de test
  console.log("4. Nettoyage des portefeuilles (wallets)...");
  const { data: delWallets, error: errWallets } = await supabase
    .from('wallets')
    .delete()
    .in('user_id', TEST_ACCOUNT_IDS)
    .select();
  console.log(`Supprimé ${delWallets ? delWallets.length : 0} wallets`, errWallets || "");

  // 5. Supprimer les profils des 5 comptes de test
  console.log("5. Nettoyage des profils (profiles)...");
  const { data: delProfiles, error: errProfiles } = await supabase
    .from('profiles')
    .delete()
    .in('id', TEST_ACCOUNT_IDS)
    .select();
  console.log(`Supprimé ${delProfiles ? delProfiles.length : 0} profiles`, errProfiles || "");

  // 6. Nettoyer les utilisateurs Supabase auth si existants
  console.log("6. Nettoyage des utilisateurs auth...");
  for (const uid of TEST_ACCOUNT_IDS) {
    try {
      await supabase.auth.admin.deleteUser(uid);
    } catch (e) {
      // Ignoré si n'existe pas dans auth.users
    }
  }

  // 7. Vérification de l'état d'Espoir (Compte fondateur)
  console.log("\n=== ÉTAT DU COMPTE FONDATEUR ESPOIR ===");
  const { data: espoirProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', ESPOIR_ID)
    .single();
  console.log("Profil Espoir:", {
    id: espoirProfile?.id,
    username: espoirProfile?.username,
    role: espoirProfile?.role,
    referral_code: espoirProfile?.referral_code,
    is_activated: espoirProfile?.is_activated
  });

  const { data: espoirBalance } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('user_id', ESPOIR_ID);
  console.log("Solde Portefeuille Espoir:", espoirBalance);

  const { data: espoirRefs } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', ESPOIR_ID);
  console.log("Filleuls directs Espoir:", espoirRefs ? espoirRefs.length : 0);

  const { data: espoirComms } = await supabase
    .from('commissions')
    .select('*')
    .eq('beneficiary_id', ESPOIR_ID);
  console.log("Commissions Espoir:", espoirComms ? espoirComms.length : 0);

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, username, role, is_activated');
  console.log("\nComptes restants dans la base Supabase:", allProfiles);
}

main().catch(console.error);
