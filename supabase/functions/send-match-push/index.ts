import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateJWT(claims: Record<string, any>, privateKeyBase64: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const encode = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const headerB64 = encode(header);
  const claimsB64 = encode(claims);
  const signingInput = `${headerB64}.${claimsB64}`;
  const padding = '='.repeat((4 - (privateKeyBase64.length % 4)) % 4);
  const b64 = (privateKeyBase64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawKey = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const pkcs8Prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(pkcs8Prefix.length + rawKey.length);
  pkcs8.set(pkcs8Prefix); pkcs8.set(rawKey, pkcs8Prefix.length);
  const key = await crypto.subtle.importKey('pkcs8', pkcs8.buffer, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  const sigArray = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigArray.length === 64) { rawSig = sigArray; }
  else {
    const rLen = sigArray[3]; const r = sigArray.slice(4, 4 + rLen);
    const sOff = 4 + rLen + 2; const sLen = sigArray[sOff - 1]; const s = sigArray.slice(sOff, sOff + sLen);
    const pad = (b: Uint8Array) => { if (b.length === 32) return b; if (b.length > 32) return b.slice(b.length - 32); const o = new Uint8Array(32); o.set(b, 32 - b.length); return o; };
    rawSig = new Uint8Array(64); rawSig.set(pad(r), 0); rawSig.set(pad(s), 32);
  }
  const sigB64 = btoa(String.fromCharCode(...rawSig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${signingInput}.${sigB64}`;
}

async function sendWebPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string, vapidPrivateKey: string, vapidPublicKey: string, vapidSubject: string) {
  const u = new URL(sub.endpoint);
  const jwt = await generateJWT({ aud: `${u.protocol}//${u.host}`, exp: Math.floor(Date.now()/1000) + 12*60*60, sub: vapidSubject }, vapidPrivateKey);
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`, 'TTL': '86400' }, body: payload });
  return { ok: r.ok, expired: r.status === 404 || r.status === 410, status: r.status };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace('Bearer ', '');
    const allowedKeys = [
      serviceRoleKey,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
    ].filter(Boolean);
    const isInternal = allowedKeys.includes(token);
    if (!isInternal) {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
      const { data: u, error: uErr } = await userClient.auth.getUser(token);
      if (uErr || !u?.user) return new Response(JSON.stringify({ error: 'Unauthorized', detail: uErr?.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { match_id, title, body, url, include_user_ids = [] } = await req.json();
    if (!match_id) return new Response(JSON.stringify({ error: 'match_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: match } = await admin.from('v_matches_with_teams').select('id, home_team_name, away_team_name, kickoff_at').eq('id', match_id).single();
    if (!match) return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: preds } = await admin.from('match_predictions').select('user_id').eq('match_id', match_id);
    const predicted = new Set((preds ?? []).map((p: any) => p.user_id));
    const force = new Set<string>(include_user_ids);

    const { data: subs } = await admin.from('push_subscriptions').select('*');
    const targets = (subs ?? []).filter((s: any) => force.has(s.user_id) || !predicted.has(s.user_id));

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidPublicKey = 'BDxV6g8V9OvsPS2eGrz5U9LDXm9w3vkcgqsDMf_GxsXkRiinDopX0Nu7rcIvd3qTFkDhumAb5q5lzIs8JADavuU';
    const vapidSubject = 'mailto:admin@bolao-copa.app';

    const payload = JSON.stringify({
      title: title || `⚽ ${match.home_team_name} × ${match.away_team_name}`,
      body: body || `Faça seu palpite antes do apito inicial!`,
      tag: `manual-${match.id}`,
      url: url || '/',
    });

    let sent = 0; const expired: string[] = [];
    const BATCH = 50;
    for (let i = 0; i < targets.length; i += BATCH) {
      const batch = targets.slice(i, i + BATCH);
      const res = await Promise.allSettled(batch.map((s: any) => sendWebPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload, vapidPrivateKey, vapidPublicKey, vapidSubject).then(r => ({ ...r, endpoint: s.endpoint })).catch(() => ({ ok: false, expired: false, endpoint: s.endpoint }))));
      for (const r of res) {
        if (r.status === 'fulfilled') {
          if (r.value.ok) sent++;
          else if ((r.value as any).expired) expired.push(r.value.endpoint);
        }
      }
    }
    if (expired.length) await admin.from('push_subscriptions').delete().in('endpoint', expired);

    return new Response(JSON.stringify({ sent, targets: targets.length, expired: expired.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});