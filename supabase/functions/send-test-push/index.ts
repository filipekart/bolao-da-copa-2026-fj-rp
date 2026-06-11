import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Admin-only auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRows } = await supabase
      .from('user_roles').select('role')
      .eq('user_id', userData.user.id).eq('role', 'admin');
    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: 'Apenas admins' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Target user defaults to the caller; admins may specify another user via body.user_id
    let targetUserId = userData.user.id;
    let customTitle: string | null = null;
    let customBody: string | null = null;
    let customUrl: string | null = null;
    let customTag: string | null = null;
    try {
      const body = await req.json();
      if (body?.user_id && typeof body.user_id === 'string') targetUserId = body.user_id;
      if (typeof body?.title === 'string') customTitle = body.title;
      if (typeof body?.body === 'string') customBody = body.body;
      if (typeof body?.url === 'string') customUrl = body.url;
      if (typeof body?.tag === 'string') customTag = body.tag;
    } catch (_) {}

    const vapidPublicKey = 'BDxV6g8V9OvsPS2eGrz5U9LDXm9w3vkcgqsDMf_GxsXkRiinDopX0Nu7rcIvd3qTFkDhumAb5q5lzIs8JADavuU';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    webpush.setVapidDetails(
      'mailto:admin@bolao-copa.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) throw error;
    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title: customTitle ?? '🧪 Teste Push',
      body: customBody ?? 'Notificação de teste do Bolão Copa 2026!',
      tag: customTag ?? `test-${Date.now()}`,
      url: customUrl ?? '/',
    });

    const results: any[] = [];
    const expiredEndpoints: string[] = [];
    for (const sub of subs) {
      try {
        const result = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        results.push({
          endpoint: sub.endpoint.substring(0, 60) + '...',
          status: result.statusCode,
          ok: true,
        });
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
        results.push({
          endpoint: sub.endpoint.substring(0, 60) + '...',
          status: e.statusCode,
          error: e.body || e.message,
          removed: e.statusCode === 404 || e.statusCode === 410,
        });
      }
    }

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    return new Response(JSON.stringify({ results, expired: expiredEndpoints.length }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
