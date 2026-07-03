import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Service role: única forma de ler/gravar login_attempts, que não tem policies
// para anon/authenticated por design.
const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password) {
    return json({ error: 'email and password are required' }, 400);
  }

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const { count, error: countError } = await supabase
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', false)
    .gte('created_at', windowStart);

  if (countError) {
    // Falha ao checar o limite: rejeita conservadoramente em vez de deixar passar sem controle.
    console.error('[login] rate limit check failed', countError.message);
    return json({ error: 'Algo deu errado. Contate suporte.' }, 500);
  }

  const attemptsUsed = count ?? 0;
  if (attemptsUsed >= MAX_ATTEMPTS) {
    return json(
      {
        error: 'Too Many Requests',
        message: `Muitas tentativas. Aguarde ${WINDOW_MINUTES} minutos e tente novamente.`,
        retryAfter: WINDOW_MINUTES * 60,
      },
      429,
    );
  }

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const authData = await authResponse.json();

  await supabase.from('login_attempts').insert({
    email,
    success: authResponse.ok,
    ip_address: ipAddress,
  });

  if (!authResponse.ok) {
    const remaining = Math.max(0, MAX_ATTEMPTS - (attemptsUsed + 1));
    return json(
      {
        error: authData.error_description ?? authData.msg ?? 'Invalid login credentials',
        remainingAttempts: remaining,
      },
      authResponse.status,
    );
  }

  return json(authData);
});
