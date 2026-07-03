-- O guard anterior (SELECT + upsert separados no código da Edge Function) não é
-- atômico: dois webhooks concorrentes (created + updated) podem ambos passar na
-- checagem "sou mais recente?" antes que qualquer um grave, e quem grava por último
-- vence — mesmo que fosse o evento mais antigo. Uma função SQL com ON CONFLICT ...
-- WHERE resolve isso: o guard vira parte da mesma operação atômica.
CREATE OR REPLACE FUNCTION upsert_subscription_from_stripe(
  p_hospital_id UUID,
  p_plan_id UUID,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMP,
  p_current_period_end TIMESTAMP,
  p_renews_at TIMESTAMP,
  p_canceled_at TIMESTAMP,
  p_stripe_event_created_at TIMESTAMP
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO subscriptions (
    hospital_id, plan_id, stripe_subscription_id, stripe_customer_id,
    status, current_period_start, current_period_end, renews_at, canceled_at,
    stripe_event_created_at, updated_at
  ) VALUES (
    p_hospital_id, p_plan_id, p_stripe_subscription_id, p_stripe_customer_id,
    p_status, p_current_period_start, p_current_period_end, p_renews_at, p_canceled_at,
    p_stripe_event_created_at, now()
  )
  ON CONFLICT (hospital_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    renews_at = EXCLUDED.renews_at,
    canceled_at = EXCLUDED.canceled_at,
    stripe_event_created_at = EXCLUDED.stripe_event_created_at,
    updated_at = now()
  WHERE
    subscriptions.stripe_event_created_at IS NULL
    OR subscriptions.stripe_event_created_at < EXCLUDED.stripe_event_created_at;
$$;
