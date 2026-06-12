import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendWebPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  try {
    const r: any = await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      { TTL: 86400 }
    );
    return { ok: true, expired: false, status: r?.statusCode ?? 201 };
  } catch (e: any) {
    const status = e?.statusCode ?? 0;
    return { ok: false, expired: status === 404 || status === 410, status, err: e?.body || e?.message };
  }
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
    let isInternal = false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'service_role' || payload.role === 'anon') isInternal = true;
    } catch {}
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
    webpush.setVapidDetails('mailto:admin@bolao-copa.app', vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title: title || `⚽ ${match.home_team_name} × ${match.away_team_name}`,
      body: body || `Faça seu palpite antes do apito inicial!`,
      tag: `manual-${match.id}`,
      url: url || '/',
    });

    let sent = 0; const expired: string[] = []; const statuses: number[] = []; const errors: string[] = [];
    const BATCH = 50;
    for (let i = 0; i < targets.length; i += BATCH) {
      const batch = targets.slice(i, i + BATCH);
      const res = await Promise.allSettled(batch.map((s: any) => sendWebPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload).then(r => ({ ...r, endpoint: s.endpoint })).catch((e) => ({ ok: false, expired: false, endpoint: s.endpoint, status: 0, err: String(e) }))));
      for (const r of res) {
        if (r.status === 'fulfilled') {
          statuses.push((r.value as any).status ?? 0);
          if ((r.value as any).err) errors.push((r.value as any).err);
          if (r.value.ok) sent++;
          else if ((r.value as any).expired) expired.push(r.value.endpoint);
        } else { errors.push(String(r.reason)); }
      }
    }
    if (expired.length) await admin.from('push_subscriptions').delete().in('endpoint', expired);

    return new Response(JSON.stringify({ sent, targets: targets.length, expired: expired.length, statuses, errors }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});