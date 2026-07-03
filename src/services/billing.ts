import { supabase } from './supabase';

export interface IPlan {
  id: string;
  name: string;
  price_brl: number;
  max_users: number;
  features: Record<string, boolean>;
  stripe_price_id: string | null;
}

export async function listPlans(): Promise<IPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_brl', { ascending: true });
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data as IPlan[];
}

export async function createCheckoutSession(priceId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    'create-checkout-session',
    {
      body: {
        priceId,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/planos?checkout=cancel`,
      },
    },
  );
  if (error) throw new Error('Não foi possível iniciar o checkout. Contate suporte.');
  if (!data?.url) throw new Error(data?.error ?? 'Não foi possível iniciar o checkout.');
  return data.url;
}
