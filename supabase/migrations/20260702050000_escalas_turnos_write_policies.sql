-- Faltavam policies de UPDATE/DELETE em escalas e INSERT/UPDATE/DELETE em turnos
-- (só existiam SELECT, e INSERT em escalas). Sem elas, RLS nega tudo por padrão.

CREATE POLICY "admin_update_escala"
  ON escalas FOR UPDATE
  USING (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin')
  WITH CHECK (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin');

CREATE POLICY "admin_delete_escala"
  ON escalas FOR DELETE
  USING (hospital_id = current_user_hospital_id() AND current_user_role() = 'admin');

CREATE POLICY "admin_insert_turno"
  ON turnos FOR INSERT
  WITH CHECK (
    escala_id IN (SELECT id FROM escalas WHERE hospital_id = current_user_hospital_id())
    AND current_user_role() = 'admin'
  );

CREATE POLICY "admin_update_turno"
  ON turnos FOR UPDATE
  USING (
    escala_id IN (SELECT id FROM escalas WHERE hospital_id = current_user_hospital_id())
    AND current_user_role() = 'admin'
  )
  WITH CHECK (
    escala_id IN (SELECT id FROM escalas WHERE hospital_id = current_user_hospital_id())
    AND current_user_role() = 'admin'
  );

CREATE POLICY "admin_delete_turno"
  ON turnos FOR DELETE
  USING (
    escala_id IN (SELECT id FROM escalas WHERE hospital_id = current_user_hospital_id())
    AND current_user_role() = 'admin'
  );

-- Enfermeiro pode confirmar/recusar o próprio turno (mudar status), sem alterar dono/data.
CREATE POLICY "user_update_own_turno_status"
  ON turnos FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
