-- Rastreia tentativas de login para rate limiting. Só a Edge Function (service role)
-- escreve/lê aqui — sem policies para anon/authenticated, acesso negado por padrão.
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX login_attempts_email_created_idx ON login_attempts (email, created_at);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
