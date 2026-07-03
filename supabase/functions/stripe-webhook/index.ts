import Stripe from 'npm:stripe@17';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Idempotência: só pula se já processamos esse evento COM SUCESSO antes.
  // Um evento que falhou anteriormente (error_message preenchido) deve ser reprocessado.
  const { data: existing } = await supabase
    .from('stripe_webhook_events')
    .select('id, error_message')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existing && !existing.error_message) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const item = sub.items.data[0];
        const hospitalId = sub.metadata.hospital_id;
        const priceId = item?.price.id;

        if (!hospitalId) {
          console.error(`[stripe-webhook] subscription ${sub.id} missing hospital_id metadata`);
          break;
        }

        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .maybeSingle();

        // current_period_start/end vivem no subscription ITEM, não mais no objeto
        // subscription top-level (mudança da API do Stripe para suportar múltiplos itens).
        const periodStart = item?.current_period_start;
        const periodEnd = item?.current_period_end;

        // Upsert atômico via função SQL: o guard de ordenação (Stripe não garante
        // ordem de entrega dos webhooks) vive dentro do próprio ON CONFLICT, evitando
        // a race condition de um SELECT+upsert feito em dois passos separados aqui.
        const { error: upsertError } = await supabase.rpc('upsert_subscription_from_stripe', {
          p_hospital_id: hospitalId,
          p_plan_id: plan?.id ?? null,
          p_stripe_subscription_id: sub.id,
          p_stripe_customer_id: sub.customer as string,
          p_status: sub.status,
          p_current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          p_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          p_renews_at:
            sub.cancel_at_period_end || !periodEnd
              ? null
              : new Date(periodEnd * 1000).toISOString(),
          p_canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          p_stripe_event_created_at: new Date(event.created * 1000).toISOString(),
        });
        if (upsertError) throw upsertError;
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from('transactions')
          .update({ status: 'success' })
          .eq('stripe_payment_intent_id', pi.id);
        break;
      }

      case 'payment_intent.payment_failed':
      case 'invoice.payment_failed': {
        const obj = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            error_message: obj.last_payment_error?.message ?? 'Payment failed',
          })
          .eq('stripe_payment_intent_id', obj.id);
        break;
      }

      default:
        console.log(`[stripe-webhook] unhandled event type: ${event.type}`);
    }

    await supabase.from('stripe_webhook_events').upsert(
      {
        stripe_event_id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
        error_message: null,
      },
      { onConflict: 'stripe_event_id' },
    );

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[stripe-webhook] processing error', message);

    await supabase.from('stripe_webhook_events').upsert(
      {
        stripe_event_id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
        error_message: message,
      },
      { onConflict: 'stripe_event_id' },
    );

    return new Response('Webhook processing error', { status: 500 });
  }
});
