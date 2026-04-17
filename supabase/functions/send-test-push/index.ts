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
  pkcs8.set(pkcs8Prefix);
  pkcs8.set(rawKey, pkcs8Prefix.length);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );

  const sigArray = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigArray.length === 64) {
    rawSig = sigArray;
  } else {
    const rLen = sigArray[3];
    const r = sigArray.slice(4, 4 + rLen);
    const sOffset = 4 + rLen + 2;
    const sLen = sigArray[4 + rLen + 1];
    const s = sigArray.slice(sOffset, sOffset + sLen);
    const padTo32 = (b: Uint8Array) => {
      if (b.length === 32) return b;
      if (b.length > 32) return b.slice(b.length - 32);
      const p = new Uint8Array(32);
      p.set(b, 32 - b.length);
      return p;
    };
    rawSig = new Uint8Array(64);
    rawSig.set(padTo32(r), 0);
    rawSig.set(padTo32(s), 32);
  }

  const sigB64 = btoa(String.fromCharCode(...rawSig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${signingInput}.${sigB64}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const TARGET_USER_ID = '48deb32d-0687-492b-aeb0-56f39198da56'; // Filipe Jorge
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidPublicKey = 'BF8C6xDdC_LCNJeUjna-4OvPFyCdkCgajlFSF2zvPQqGSyQmp1NnNHFy-as37wK2xrjxF3uEkzWpi1-3S-g8Sno';
    const vapidSubject = 'mailto:admin@bolao-copa.app';

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', TARGET_USER_ID);

    if (error) throw error;
    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no subscriptions for user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title: '🧪 Teste Push',
      body: 'Notificação de teste do Bolão Copa 2026!',
      tag: `test-${Date.now()}`,
      url: '/',
    });

    const results: any[] = [];
    for (const sub of subs) {
      try {
        const url = new URL(sub.endpoint);
        const audience = `${url.protocol}//${url.host}`;
        const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
        const jwt = await generateJWT({ aud: audience, exp: expiry, sub: vapidSubject }, vapidPrivateKey);

        const resp = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'TTL': '86400',
          },
          body: payload,
        });

        const text = await resp.text();
        results.push({
          endpoint: sub.endpoint.substring(0, 60) + '...',
          status: resp.status,
          ok: resp.ok,
          body: text.substring(0, 200),
        });
      } catch (e: any) {
        results.push({ endpoint: sub.endpoint.substring(0, 60) + '...', error: e.message });
      }
    }

    return new Response(JSON.stringify({ user: 'Filipe Jorge', results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
