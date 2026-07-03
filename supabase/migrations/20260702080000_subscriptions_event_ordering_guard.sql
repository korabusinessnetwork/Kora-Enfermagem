-- Stripe não garante ordem de entrega dos webhooks. Sem essa guarda, um evento
-- "created" (status incomplete) processado depois de um "updated" (status active)
-- sobrescrevia o status mais recente com um mais antigo.
ALTER TABLE subscriptions ADD COLUMN stripe_event_created_at TIMESTAMP;
