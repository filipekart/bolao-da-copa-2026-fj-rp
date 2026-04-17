import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push crypto helpers
async function generateJWT(claims: Record<string, any>, privateKeyBase64: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const encode = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const headerB64 = encode(header);
  const claimsB64 = encode(claims);
  const signingInput = `${headerB64}.${claimsB64}`;

  // Import private key
  const padding = '='.repeat((4 - (privateKeyBase64.length % 4)) % 4);
  const b64 = (privateKeyBase64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawKey = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    await convertECPrivateKeyToPKCS8(rawKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );

  // Convert DER signature to raw r||s
  const sigArray = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigArray.length === 64) {
    rawSig = sigArray;
  } else {
    // DER encoded
    const r = parseDERInteger(sigArray, 2);
    const sOffset = 2 + sigArray[3] + 2;
    const s = parseDERInteger(sigArray, sOffset);
    rawSig = new Uint8Array(64);
    rawSig.set(padTo32(r), 0);
    rawSig.set(padTo32(s), 32);
  }

  const sigB64 = btoa(String.fromCharCode(...rawSig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${signingInput}.${sigB64}`;
}

function parseDERInteger(buf: Uint8Array, offset: number): Uint8Array {
  const len = buf[offset + 1];
  return buf.slice(offset + 2, offset + 2 + len);
}

function padTo32(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  if (bytes.length > 32) return bytes.slice(bytes.length - 32);
  const padded = new Uint8Array(32);
  padded.set(bytes, 32 - bytes.length);
  return padded;
}

async function convertECPrivateKeyToPKCS8(rawKey: Uint8Array): Promise<ArrayBuffer> {
  // Wrap raw 32-byte EC private key in PKCS8 DER structure
  const pkcs8Prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const result = new Uint8Array(pkcs8Prefix.length + rawKey.length);
  result.set(pkcs8Prefix);
  result.set(rawKey, pkcs8Prefix.length);
  return result.buffer;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string
): Promise<boolean> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const jwt = await generateJWT(
    { aud: audience, exp: expiry, sub: vapidSubject },
    vapidPrivateKey
  );

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      'TTL': '86400',
    },
    body: payload,
  });

  if (response.status === 410 || response.status === 404) {
    // Subscription expired, should be removed
    return false;
  }

  return response.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidPublicKey = 'BGEQYV6oMjko-aqi0O5ue6rheaa5FRqwP-UDWzPGPei_StMNCfAk1e2auL6ZQrjBiYmMbxAGhysPPGJfzLoPegk';
    const vapidSubject = 'mailto:admin@bolao-copa.app';

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const oneHourAhead = new Date(now.getTime() + 62 * 60 * 1000);
    const tenMinAhead = new Date(now.getTime() + 12 * 60 * 1000);

    // Fetch matches starting within ~1 hour or ~10 minutes
    const { data: matches, error: matchErr } = await supabase
      .from('v_matches_with_teams')
      .select('id, kickoff_at, home_team_name, away_team_name')
      .eq('status', 'SCHEDULED')
      .gte('kickoff_at', now.toISOString())
      .lte('kickoff_at', oneHourAhead.toISOString());

    if (matchErr || !matches?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get all push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get all predictions for these matches
    const matchIds = matches.map((m: any) => m.id);
    const { data: predictions } = await supabase
      .from('match_predictions')
      .select('user_id, match_id')
      .in('match_id', matchIds);

    // Build set of user_id:match_id that have predictions
    const predictionSet = new Set(
      (predictions ?? []).map((p: any) => `${p.user_id}:${p.match_id}`)
    );

    // Group subscriptions by user
    const subsByUser = new Map<string, any[]>();
    for (const sub of subscriptions) {
      const arr = subsByUser.get(sub.user_id) || [];
      arr.push(sub);
      subsByUser.set(sub.user_id, arr);
    }

    let sent = 0;
    const expiredEndpoints: string[] = [];
    const BATCH_SIZE = 50;

    type PushTask = () => Promise<{ ok: boolean; endpoint: string }>;
    const pushTasks: PushTask[] = [];

    for (const match of matches) {
      const kickoff = new Date(match.kickoff_at);
      const minutesUntil = (kickoff.getTime() - now.getTime()) / (1000 * 60);

      let timeLabel = '';
      if (minutesUntil <= 62 && minutesUntil >= 58) {
        timeLabel = '1 hora';
      } else if (minutesUntil <= 12 && minutesUntil >= 8) {
        timeLabel = '10 minutos';
      } else {
        continue;
      }

      for (const [userId, subs] of subsByUser) {
        if (predictionSet.has(`${userId}:${match.id}`)) continue;

        const payload = JSON.stringify({
          title: `⚽ Falta ${timeLabel}!`,
          body: `${match.home_team_name} × ${match.away_team_name} começa em ${timeLabel}. Faça seu palpite!`,
          tag: `reminder-${match.id}-${timeLabel}`,
          url: '/',
        });

        for (const sub of subs) {
          pushTasks.push(() =>
            sendWebPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              payload,
              vapidPrivateKey,
              vapidPublicKey,
              vapidSubject
            )
              .then(ok => ({ ok, endpoint: sub.endpoint }))
              .catch(() => ({ ok: false, endpoint: sub.endpoint }))
          );
        }
      }
    }

    // --- Extras reminders (champion, top scorer, MVP) ---
    // Find the first scheduled match (earliest kickoff)
    const { data: firstMatch } = await supabase
      .from('matches')
      .select('kickoff_at')
      .eq('status', 'SCHEDULED')
      .order('kickoff_at', { ascending: true })
      .limit(1)
      .single();

    if (firstMatch) {
      const firstKickoff = new Date(firstMatch.kickoff_at);
      const minutesUntilFirst = (firstKickoff.getTime() - now.getTime()) / (1000 * 60);

      let extrasTimeLabel = '';
      if (minutesUntilFirst <= 62 && minutesUntilFirst >= 58) {
        extrasTimeLabel = '1 hora';
      } else if (minutesUntilFirst <= 12 && minutesUntilFirst >= 8) {
        extrasTimeLabel = '10 minutos';
      }

      if (extrasTimeLabel) {
        const { data: completions } = await supabase.rpc('get_extras_completion');
        const extraSet = new Set(
          (completions ?? []).map((c: any) => `${c.user_id}:${c.category}`)
        );

        const missingLabels: Record<string, string> = {
          champion: 'Campeão',
          top_scorer: 'Artilheiro',
          mvp: 'MVP',
        };

        for (const [userId, subs] of subsByUser) {
          const missing: string[] = [];
          if (!extraSet.has(`${userId}:champion`)) missing.push(missingLabels.champion);
          if (!extraSet.has(`${userId}:top_scorer`)) missing.push(missingLabels.top_scorer);
          if (!extraSet.has(`${userId}:mvp`)) missing.push(missingLabels.mvp);

          if (missing.length === 0) continue;

          const missingText = missing.join(', ');
          const payload = JSON.stringify({
            title: `🏆 Falta ${extrasTimeLabel}!`,
            body: `Você ainda não escolheu: ${missingText}. Após o 1º jogo, não será mais possível!`,
            tag: `extras-reminder-${extrasTimeLabel}`,
            url: '/extras',
          });

          for (const sub of subs) {
            pushTasks.push(() =>
              sendWebPush(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                payload,
                vapidPrivateKey,
                vapidPublicKey,
                vapidSubject
              )
                .then(ok => ({ ok, endpoint: sub.endpoint }))
                .catch(() => ({ ok: false, endpoint: sub.endpoint }))
            );
          }
        }
      }
    }

    // Process push tasks in batches of BATCH_SIZE
    for (let i = 0; i < pushTasks.length; i += BATCH_SIZE) {
      const batch = pushTasks.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(fn => fn()));
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value.ok) sent++;
          else expiredEndpoints.push(r.value.endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ sent, expired: expiredEndpoints.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
