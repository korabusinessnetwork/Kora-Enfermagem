ALTER TABLE subscription_plans ADD COLUMN stripe_price_id TEXT UNIQUE;

-- Todo mundo pode ler os planos disponíveis (necessário para a página de preços,
-- inclusive antes de logar).
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_plans"
  ON subscription_plans FOR SELECT
  USING (true);

INSERT INTO subscription_plans (name, price_brl, max_users, features)
VALUES
  ('free', 0, 5, '{"escalas_ilimitadas": false, "export_pdf": false, "suporte_prioritario": false}'),
  ('pro', 20.00, 9999, '{"escalas_ilimitadas": true, "export_pdf": true, "suporte_prioritario": true}');
