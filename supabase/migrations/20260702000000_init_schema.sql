
-- ============================================================
-- Hospitals & Users
-- ============================================================

CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan TEXT DEFAULT 'free', -- 'free', 'starter', 'pro'
  max_users INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'gerente', 'enfermeiro')) DEFAULT 'enfermeiro',
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  cpf_encrypted TEXT,
  phone_encrypted TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_hospital"
  ON users FOR SELECT
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "admin_can_read_all_in_hospital"
  ON users FOR SELECT
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND role = 'admin'
  );

CREATE POLICY "users_can_update_own_profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- Escalas, Turnos & Config
-- ============================================================

CREATE TABLE escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(hospital_id, mes, ano)
);

CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escala_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  status TEXT DEFAULT 'confirmado', -- 'confirmado', 'pendente', 'recusado'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(escala_id, user_id, data)
);

CREATE TABLE config_escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  min_folga_dias INTEGER DEFAULT 6,
  max_folga_dias INTEGER DEFAULT 8,
  max_noturnos_consecutivos INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(hospital_id)
);

ALTER TABLE escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_escalas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_hospital_escalas"
  ON escalas FOR SELECT
  USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "only_admin_create_escala"
  ON escalas FOR INSERT
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "users_see_own_hospital_turnos"
  ON turnos FOR SELECT
  USING (
    escala_id IN (
      SELECT id FROM escalas
      WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "users_see_own_hospital_config"
  ON config_escalas FOR SELECT
  USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "only_admin_manage_config"
  ON config_escalas FOR ALL
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- Subscriptions & Payments
-- ============================================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'free', 'starter', 'pro'
  price_brl DECIMAL(10, 2),
  max_users INTEGER,
  features JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL UNIQUE REFERENCES hospitals(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'expired', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  renews_at TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_brl DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_subscription"
  ON subscriptions FOR SELECT
  USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "only_owner_cancel"
  ON subscriptions FOR UPDATE
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "users_see_own_hospital_transactions"
  ON transactions FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions
      WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================================
-- Audit Logs (LGPD)
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  action TEXT NOT NULL, -- 'read', 'create', 'update', 'delete', 'export'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_audit_logs"
  ON audit_logs FOR SELECT
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "hospitals_owner_select"
  ON hospitals FOR SELECT
  USING (
    id = (SELECT hospital_id FROM users WHERE id = auth.uid())
  );

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
