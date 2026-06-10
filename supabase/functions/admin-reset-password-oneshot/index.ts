import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase.auth.admin.updateUserById(
    '334a479e-47de-45f3-8091-01b55919c7f7',
    { password: 'BV0101' }
  );

  return new Response(
    JSON.stringify({ success: !error, error: error?.message, email: data?.user?.email }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error ? 500 : 200 }
  );
});