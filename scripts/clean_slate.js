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
const ESPOIR_ID = '333d799b-84ea-493b-b35e-754f88c81b7f';
const ESPOIR_WALLET_ID = '1ff496ce-d9f2-43ea-8e15-3e51cdefc923';

async function main() {
  console.log("=== DÉBUT DU NETTOYAGE DYNAMIQUE (CLEAN SLATE) ===");

  // Récupérer tous les comptes autres qu'Espoir
  const { data: nonAdminProfiles } = await supabase
    .from('profiles')
    .select('id, username')
    .neq('id', ESPOIR_ID);

  const testIds = (nonAdminProfiles || []).map(p => p.id);
  console.log("Comptes ciblés pour suppression :", nonAdminProfiles);

  if (testIds.length > 0) {
    // 1. Referrals
    const { data: dRefs } = await supabase.from('referrals').delete().in('referred_id', testIds).select();
    console.log(`Supprimé ${dRefs?.length || 0} referrals (referred_id)`);
    await supabase.from('referrals').delete().in('referrer_id', testIds);

    // 2. Commissions
    const { data: dComms } = await supabase.from('commissions').delete().in('buyer_id', testIds).select();
    console.log(`Supprimé ${dComms?.length || 0} commissions (buyer_id)`);
    await supabase.from('commissions').delete().in('beneficiary_id', testIds);

    // 3. Payments
    const { data: dPays } = await supabase.from('payments').delete().in('user_id', testIds).select();
    console.log(`Supprimé ${dPays?.length || 0} payments`);

    // 4. Wallets
    const { data: dWallets } = await supabase.from('wallets').delete().in('user_id', testIds).select();
    console.log(`Supprimé ${dWallets?.length || 0} wallets`);

    // 5. Profiles
    const { data: dProfs } = await supabase.from('profiles').delete().in('id', testIds).select();
    console.log(`Supprimé ${dProfs?.length || 0} profiles`);

    // 6. Auth users
    for (const uid of testIds) {
      try {
        await supabase.auth.admin.deleteUser(uid);
      } catch {}
    }
  }

  // S'assurer que le parrainage d'Espoir est remis à 0
  await supabase.from('referrals').delete().eq('referrer_id', ESPOIR_ID);
  await supabase.from('commissions').delete().eq('beneficiary_id', ESPOIR_ID);

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
