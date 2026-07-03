-- As policies antigas faziam "SELECT ... FROM users WHERE id = auth.uid()" dentro de
-- policies da própria tabela users, causando "infinite recursion detected in policy
-- for relation users". Funções SECURITY DEFINER quebram esse ciclo por rodar sem RLS.

CREATE OR REPLACE FUNCTION current_user_hospital_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT hospital_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- users
DROP POLICY IF EXISTS "users_can_read_own_hospital" ON users;
DROP POLICY IF EXISTS "admin_can_read_all_in_hospital" ON users;

CREATE POLICY "users_can_read_own_hospital"
  ON users FOR SELECT
  USING (hospital_id = current_user_hospital_id());

-- hospitals
DROP POLICY IF EXISTS "hospitals_owner_select" ON hospitals;

CREATE POLICY "hospitals_owner_select"
  ON hospitals FOR SELECT
  USING (id = current_user_hospital_id());

-- escalas
DROP POLICY IF EXISTS "users_see_own_hospital_escalas" ON escalas;
DROP POLICY IF EXISTS "only_admin_create_escala" ON escalas;

CREATE POLICY "users_see_own_hospital_escalas"
  ON escalas FOR SELECT
  USING (hospital_id = current_user_hospital_id());

CREATE POLICY "only_admin_create_escala"
  ON escalas FOR INSERT
  WITH CHECK (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin');

-- turnos
DROP POLICY IF EXISTS "users_see_own_hospital_turnos" ON turnos;

CREATE POLICY "users_see_own_hospital_turnos"
  ON turnos FOR SELECT
  USING (
    escala_id IN (SELECT id FROM escalas WHERE hospital_id = current_user_hospital_id())
  );

-- config_escalas
DROP POLICY IF EXISTS "users_see_own_hospital_config" ON config_escalas;
DROP POLICY IF EXISTS "only_admin_manage_config" ON config_escalas;

CREATE POLICY "users_see_own_hospital_config"
  ON config_escalas FOR SELECT
  USING (hospital_id = current_user_hospital_id());

CREATE POLICY "only_admin_manage_config"
  ON config_escalas FOR ALL
  USING (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin')
  WITH CHECK (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin');

-- subscriptions
DROP POLICY IF EXISTS "users_see_own_subscription" ON subscriptions;
DROP POLICY IF EXISTS "only_owner_cancel" ON subscriptions;

CREATE POLICY "users_see_own_subscription"
  ON subscriptions FOR SELECT
  USING (hospital_id = current_user_hospital_id());

CREATE POLICY "only_owner_cancel"
  ON subscriptions FOR UPDATE
  USING (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin');

-- transactions
DROP POLICY IF EXISTS "users_see_own_hospital_transactions" ON transactions;

CREATE POLICY "users_see_own_hospital_transactions"
  ON transactions FOR SELECT
  USING (
    subscription_id IN (SELECT id FROM subscriptions WHERE hospital_id = current_user_hospital_id())
  );

-- audit_logs
DROP POLICY IF EXISTS "users_see_own_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "users_insert_own_audit_logs" ON audit_logs;

CREATE POLICY "users_see_own_audit_logs"
  ON audit_logs FOR SELECT
  USING (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin');

CREATE POLICY "users_insert_own_audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() AND hospital_id = current_user_hospital_id());
