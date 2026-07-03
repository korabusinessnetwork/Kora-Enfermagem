import Stripe from 'npm:stripe@17';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
});

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  // Cliente autenticado como o usuário que chamou a function (RLS ativo) — garante
  // que só conseguimos ler o hospital do próprio usuário, nunca de outro.
  const supabaseAsUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: authData, error: authError } = await supabaseAsUser.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: 'Invalid session' }, 401);
  }

  const { data: profile, error: profileError } = await supabaseAsUser
    .from('users')
    .select('hospital_id, role, email')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return json({ error: 'User profile not found' }, 404);
  }

  if (profile.role !== 'admin') {
    return json({ error: 'Only admins can manage billing' }, 403);
  }

  let body: { priceId?: string; successUrl?: string; cancelUrl?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.priceId || !body.successUrl || !body.cancelUrl) {
    return json({ error: 'priceId, successUrl and cancelUrl are required' }, 400);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: body.priceId, quantity: 1 }],
    customer_email: profile.email,
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    metadata: { hospital_id: profile.hospital_id },
    subscription_data: { metadata: { hospital_id: profile.hospital_id } },
  });

  return json({ url: session.url });
});
