-- Cria hospital + perfil automaticamente quando um novo usuário se cadastra.
-- Roda no INSERT em auth.users, então funciona mesmo antes da confirmação de email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_hospital_id UUID;
  hospital_name TEXT;
  user_name TEXT;
BEGIN
  hospital_name := COALESCE(NEW.raw_user_meta_data->>'hospital_name', 'Meu Hospital');
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  INSERT INTO hospitals (name, owner_id)
  VALUES (hospital_name, NEW.id)
  RETURNING id INTO new_hospital_id;

  INSERT INTO users (id, email, name, role, hospital_id)
  VALUES (NEW.id, NEW.email, user_name, 'admin', new_hospital_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
