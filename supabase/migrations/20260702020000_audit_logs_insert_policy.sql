CREATE POLICY "users_insert_own_audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
  );
