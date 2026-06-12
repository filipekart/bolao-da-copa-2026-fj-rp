import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Send a Web Push notification via the npm:web-push library.
// The manual ES256 JWT path using crypto.subtle.importKey('pkcs8', …) fails
// with InvalidEncoding in the current Deno runtime, so we delegate.
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<{ ok: boolean; expired: boolean; status: number }> {
  try {
    const r: any = await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      payload,
      { TTL: 86400 },
    );
    const status = r?.statusCode ?? 201;
    return { ok: true, expired: false, status };
  } catch (e: any) {
    const status = e?.statusCode ?? 0;
    return { ok: false, expired: status === 404 || status === 410, status };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
    const allowedPublicKeys = [
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc29zZ2d2bHVyc2RuZ3RleWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQxNDEsImV4cCI6MjA5MDQ5MDE0MX0.OSyYvCOn7uhlOse9Gne1Ovmd8AC_iU0nQEXwJR2p1HM',
    ].filter(Boolean);

    // Restrict to cron/service-role callers (pg_cron passes the anon key as Bearer)
    const authHeader = req.headers.get('Authorization') ?? '';
    const apiKeyHeader = req.headers.get('apikey') ?? '';
    const headerSecret = req.headers.get('x-cron-secret') ?? '';
    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
    const isAnonCron = allowedPublicKeys.some((key) =>
      authHeader === `Bearer ${key}` ||
      apiKeyHeader === key
    );
    const isCron = cronSecret.length > 0 && headerSecret === cronSecret;
    if (!isServiceRole && !isCron && !isAnonCron) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidPublicKey = 'BDxV6g8V9OvsPS2eGrz5U9LDXm9w3vkcgqsDMf_GxsXkRiinDopX0Nu7rcIvd3qTFkDhumAb5q5lzIs8JADavuU';
    const vapidSubject = 'mailto:admin@bolao-copa.app';
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

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

    type PushTask = () => Promise<{ ok: boolean; expired: boolean; endpoint: string }>;
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
            )
              .then(r => ({ ok: r.ok, expired: r.expired, endpoint: sub.endpoint }))
              .catch(() => ({ ok: false, expired: false, endpoint: sub.endpoint }))
          );
        }
      }
    }

    // --- Extras reminders (champion, top scorer, MVP) ---
    // Só faz sentido antes do 1º jogo da Copa. Depois disso, extras estão travados.
    const { data: tournamentOpen } = await supabase.rpc('is_tournament_open');

    // Primeiro jogo absoluto da Copa (match_number = 1), não o próximo agendado.
    const { data: firstMatch } = await supabase
      .from('matches')
      .select('kickoff_at')
      .eq('match_number', 1)
      .maybeSingle();

    if (tournamentOpen && firstMatch) {
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
              )
                .then(r => ({ ok: r.ok, expired: r.expired, endpoint: sub.endpoint }))
                .catch(() => ({ ok: false, expired: false, endpoint: sub.endpoint }))
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
          else if ((r.value as any).expired) expiredEndpoints.push(r.value.endpoint);
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
