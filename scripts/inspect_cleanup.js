const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role');
  console.log('Profiles:', profiles);

  const { data: referrals } = await supabase.from('referrals').select('*');
  console.log('Referrals count:', referrals?.length);

  const { data: comms } = await supabase.from('commissions').select('*');
  console.log('Commissions count:', comms?.length);

  const { data: ledger } = await supabase.from('ledger_entries').select('*');
  console.log('Ledger entries count:', ledger?.length);

  const { data: espoirWb } = await supabase.from('wallet_balances').select('*').eq('user_id', '333d799b-84ea-493b-b35e-754f88c81b7f');
  console.log('Espoir wallet balance:', espoirWb);
}
inspect();
