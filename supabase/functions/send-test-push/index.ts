import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const TARGET_USER_ID = '48deb32d-0687-492b-aeb0-56f39198da56';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const vapidPublicKey = 'BN0qxh1ur9TdTR5b5GCuSHB9J1ay562QWXqh6mUBjxnWWPrNXSVNTFVw8Z6sfDv4qS6Y-PprcgBTgu2YkxFLeC4';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    webpush.setVapidDetails(
      'mailto:admin@bolao-copa.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', TARGET_USER_ID);

    if (error) throw error;
    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no subscriptions' }), {
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
        results.push({
          endpoint: sub.endpoint.substring(0, 60) + '...',
          status: e.statusCode,
          error: e.body || e.message,
        });
      }
    }

    return new Response(JSON.stringify({ user: 'Filipe Jorge', results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
