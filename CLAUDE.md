# Escala de Enfermagem - Sistema de Prompts Claude Code

## 📋 Contexto do Projeto

**Nome:** Escala de Enfermagem  
**Versão:** 0.1.0 MVP  
**Monetização:** R$ 20/mês por hospital  
**Stack:** React 18 + Vite + TypeScript + Supabase + Stripe + TailwindCSS  
**Segurança:** LGPD Compliance + Dados sensíveis médicos

---

## 🏗️ Estrutura do Projeto

```
escala-enfermagem-web/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   ├── pages/              # Páginas (auth, escalas, admin, pagamento)
│   ├── services/           # APIs, Supabase, Stripe, encryption
│   ├── hooks/              # Hooks customizados (useAuth, useEscalas)
│   ├── middleware/         # Auth guards, RLS validation
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Helpers (formatting, validation, crypto)
│   ├── styles/             # Tailwind globals
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/         # SQL migrations (schema + RLS)
│   ├── seed.sql           # Dados iniciais
│   └── .env.local.example
├── public/
├── .env.local.example
├── vite.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🔐 Sistema de Segurança (ALTA SEGURANÇA)

### 1. **Autenticação & Authorization**

```
JWT via Supabase Auth:
├─ token_type: "Bearer"
├─ access_token: JWT com 1h expiração
├─ refresh_token: Para renovar silenciosamente
├─ user.id: UUID único
└─ user.role: 'admin' | 'gerente' | 'enfermeiro'

RLS (Row Level Security):
├─ Cada hospital vê só seus dados
├─ Cada enfermeiro vê só suas escalas
├─ Admins veem tudo do hospital
└─ Implementado em TODAS as tabelas
```

### 2. **Dados Sensíveis (LGPD)**

```
Criptografia:
├─ CPF: Criptografado com AES-256 (never plain)
├─ Telefone: Criptografado
├─ Endereço: Criptografado
├─ Histórico médico: Apenas super-admin
└─ Chave: Supabase Vault (server-side)

Auditoria:
├─ Todas as ações logadas (audit_logs)
├─ Quem acessou quê e quando
├─ Modificações rastreadas (updated_by, updated_at)
├─ Retenção: 12 meses
└─ Exportável para compliance
```

### 3. **Proteções contra Ataques**

```
CSRF Protection:
├─ Tokens CSRF em forms
├─ SameSite=Strict em cookies
└─ Origin validation

Rate Limiting:
├─ Login: 5 tentativas/10min
├─ API: 100 req/min por usuário autenticado
├─ Unauthenticated: 20 req/min por IP
└─ Stripe webhook: Verificação de assinatura

XSS Protection:
├─ React.createElement (não dangerouslySetInnerHTML)
├─ Content Security Policy headers
├─ Input sanitization (DOMPurify se precisar render HTML)
└─ Output encoding

SQL Injection:
├─ Supabase prepared statements (automático)
├─ Parametrized queries sempre
├─ RLS bloqueia acesso não autorizado
└─ Tipos TypeScript forçam validação
```

### 4. **Validações**

```
Backend (Supabase Edge Functions):
├─ Tipo de dado (string, number, date)
├─ Range (data entre min-max)
├─ Formato (email regex, CPF, etc)
├─ Exclusões (valores bloqueados)
└─ Rejeita tudo inválido com 400

Frontend:
├─ Validação UX (mostrar erro real-time)
├─ Nunca confie em validação frontend
├─ Sempre valida no backend
└─ Feedback claro ao usuário
```

### 5. **Senhas & Tokens**

```
Senhas:
├─ bcrypt 12+ rounds (Supabase padrão)
├─ Mínimo 8 caracteres
├─ Requer uppercase + número + símbolo
└─ Never log password anywhere

JWT:
├─ Assinado com secret Supabase
├─ Payload: user_id, email, role, hospital_id
├─ Exp: 1 hora
├─ Refresh: 7 dias (em refresh_token)
└─ HttpOnly cookies (se usar)
```

### 6. **Compliance & Privacidade**

```
LGPD:
├─ Consentimento explícito no signup
├─ Política de privacidade inline
├─ Direito ao esquecimento (delete account)
├─ Data portability (exporta dados user)
└─ DPO contact visible

Dados Médicos:
├─ Escalas NÃO incluem diagnóstico
├─ Apenas turnos (manha/tarde/noite)
├─ CPF criptografado
├─ Acesso limitado a gerente + admin
└─ Backup diário (Supabase automático)
```

---

## 🛠️ Tecnologias & Versões

```
Frontend:
├─ React 18.3+
├─ TypeScript 5+
├─ Vite 5+
├─ Tailwind CSS 3+
├─ Shadcn/ui (components)
├─ React Router 6+
├─ React Query (TanStack Query) 5+
├─ Zod (validação TypeScript-first)
├─ crypto-js (AES encryption client-side)
└─ date-fns (date manipulation)

Backend:
├─ Supabase (Postgres 15+)
├─ Supabase Auth (JWT)
├─ Supabase RLS (Row Level Security)
├─ Edge Functions (Deno runtime)
├─ Realtime (WebSocket subscriptions)
└─ Vault (encryption at rest)

External:
├─ Stripe API (v2024-12-01)
├─ Resend (email marketing)
└─ Sentry (error tracking - free tier)
```

---

## 📋 Padrões de Código

### TypeScript Strict Mode

```typescript
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Naming Conventions

```
Variáveis:     camelCase (userId, hospitalName)
Constantes:    UPPER_SNAKE_CASE (API_KEY, MAX_RETRIES)
Funciones:     camelCase (getEscalas, createUser)
Componentes:   PascalCase (EscalaGrid, LoginPage)
Interfaces:    PascalCase + I prefix (IUser, IEscala)
Enums:         PascalCase (UserRole, TurnoType)
Files:         kebab-case (auto-folga.js, stripe-api.js)
```

### Error Handling

```typescript
// Padrão:
try {
  const data = await supabase.from('escalas').select();
  if (!data) throw new Error('No data returned');
  return data;
} catch (error) {
  console.error('[EscalasService]', error);
  Sentry.captureException(error); // log to external service
  throw error;
}
```

### Async/Await

```typescript
// Sempre use async/await, nunca .then()
// Sempre use try/catch para errors
// Sempre valide dados antes de usar

async function fetchEscala(id: string): Promise<IEscala> {
  if (!id || !isValidUUID(id)) throw new Error('Invalid ID');
  
  const { data, error } = await supabase
    .from('escalas')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}
```

---

## 🔒 Database Schema (Supabase SQL)

### Users & Hospitals

```sql
-- Hospitais (multi-tenant)
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan TEXT DEFAULT 'free', -- 'free', 'starter', 'pro'
  max_users INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Usuários (linked via auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'gerente', 'enfermeiro')) DEFAULT 'enfermeiro',
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  cpf_encrypted TEXT, -- AES-256 encrypted, never plaintext
  phone_encrypted TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS: Users
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
```

### Escalas & Turnos

```sql
-- Escalas mensais
CREATE TABLE escalas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Turnos individuais
CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- RLS: Escalas
ALTER TABLE escalas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_hospital_escalas"
  ON escalas FOR SELECT
  USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "only_admin_create_escala"
  ON escalas FOR INSERT
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND role = 'admin'
  );

-- RLS: Turnos
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_hospital_turnos"
  ON turnos FOR SELECT
  USING (
    escala_id IN (
      SELECT id FROM escalas 
      WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    )
  );
```

### Assinaturas & Pagamentos

```sql
-- Planos de assinatura
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'free', 'starter', 'pro'
  price_brl DECIMAL(10, 2),
  max_users INTEGER,
  features JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Assinaturas ativas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Transações (para auditoria)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_brl DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- RLS: Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_subscription"
  ON subscriptions FOR SELECT
  USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "only_owner_cancel"
  ON subscriptions FOR UPDATE
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND role = 'admin'
  );
```

### Auditoria & Compliance

```sql
-- Audit Log (LGPD required)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND role = 'admin');
```

---

## 🔐 Segurança: Prompts Prontos

### Prompt 1: Setup Autenticação Segura

```
Configurar Supabase Auth com:
1. JWT validation middleware (verificar token a cada requisição)
2. Refresh token automático (antes de expirar)
3. CORS seguro (apenas domínio próprio)
4. Rate limiting (5 tentativas login/10min)
5. Logout (limpar token + sessão)
6. useAuth hook customizado

Requerimentos:
- TypeScript strict mode
- Error handling com Sentry
- Log de login/logout em audit_logs
- Detectar múltiplos logins na mesma conta
```

### Prompt 2: RLS (Row Level Security) Completo

```
Implementar RLS em Supabase:

1. Cada hospital vê SOMENTE seus dados
2. Admins veem todos users do hospital
3. Gerentes veem enfermeiros
4. Enfermeiros veem só suas escalas
5. Dados criptografados (CPF, telefone) NOT readable
6. Audit logs automáticos (trigger)

Requerimentos:
- Policies para SELECT, INSERT, UPDATE, DELETE
- Function: auth.uid() retorna UUID da sessão
- Testes: query sem permissão deve retornar []
- Fallback: deny by default
```

### Prompt 3: Criptografia de Dados Sensíveis

```
Implementar criptografia AES-256:

1. CPF: encrypt on create, decrypt only for owner/admin
2. Telefone: mesmo padrão
3. Armazena encrypted_cpf em DB (never plaintext)
4. Chave mestre: Supabase Vault (server-only)
5. Client-side masking: "***.***.***-**"

Stack:
- crypto-js (client hash)
- Supabase Vault (server encryption)
- TypeScript para type safety

Requisitos:
- Never log encrypted data
- Auditoria de quem acessou CPF
- Comply LGPD artigo 6
- Data retention: 12 meses max
```

### Prompt 4: Validações & Input Sanitization

```
Implementar validação em 3 camadas:

1. FRONTEND (UX feedback)
   - Real-time feedback
   - Zod schemas
   - Prevent XSS (React safe)

2. BACKEND (Supabase Functions)
   - Revalidate ALL inputs
   - Reject invalid types
   - Prepared statements
   - Log attempts (audit_logs)

3. DATABASE (RLS)
   - Policies bloqueia acesso
   - CHECK constraints
   - UNIQUE constraints
   - Triggers para auditoria

Validações específicas:
- Email: RFC 5322 compliant
- CPF: 11 dígitos válido
- Data: not future, not old >10 years
- Turno: only 'manha', 'tarde', 'noite'
- Role: only 'admin', 'gerente', 'enfermeiro'

Stack: Zod + Supabase Edge Functions
```

### Prompt 5: Stripe Seguro (Webhook + Validação)

```
Implementar Stripe com máxima segurança:

1. Webhook handler (Supabase Edge Function)
   - Verificar assinatura (stripe.webhooks.constructEvent)
   - Idempotência (check if already processed)
   - Log ALL webhook events (audit_logs)
   
2. Eventos processados:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - payment_intent.succeeded
   - payment_intent.failed
   - invoice.payment_failed
   
3. Segurança:
   - Never store full card numbers
   - Use Stripe-hosted payment forms
   - Verify signature com STRIPE_WEBHOOK_SECRET
   - Timeout & retry logic
   - Fallback to manual payment if webhook fails
   
4. Cliente:
   - Use Stripe.js (official library)
   - Render PaymentElement
   - Confirm payment via confirmPayment()
   - Handle 3D Secure auth
   
5. Database:
   - Store stripe_subscription_id (not payment details)
   - Track subscription status changes
   - Audit log ALL transactions
```

### Prompt 6: Rate Limiting & DoS Protection

```
Implementar rate limiting:

1. API Endpoints:
   - Authenticated: 100 req/min por user
   - Unauthenticated: 20 req/min por IP
   - Login: 5 tentativas/10min
   - Stripe webhook: Skip (trusted source)

2. Strategy:
   - Use Supabase Edge Functions (built-in limits)
   - Add X-RateLimit headers to response
   - Trigger alerts if threshold exceeded
   - Block IP temporariamente se abusa

3. Implementation:
   - Track by user_id (auth) ou IP (anon)
   - Redis ou in-memory cache (Supabase Functions)
   - Log offenders (audit_logs)
   - Whitelist Stripe IPs

Stack: Supabase Edge Functions native rate limiting
```

### Prompt 7: CORS & Headers de Segurança

```
Configurar headers de segurança:

1. CORS:
   - Allow-Origin: apenas https://seu-dominio.com
   - Allow-Methods: GET, POST, PUT, DELETE
   - Allow-Headers: Content-Type, Authorization
   - Credentials: true (se usar cookies)
   - Max-Age: 86400 (1 dia)

2. Security Headers:
   - Content-Security-Policy: "default-src 'self'"
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000; includeSubDomains
   - Referrer-Policy: strict-origin-when-cross-origin

3. Implementation:
   - Vite: vite.config.js CORS
   - Vercel: vercel.json headers
   - Supabase: Auth settings

4. Testing:
   - curl -I check headers
   - Browser DevTools Network tab
   - OWASP ZAP scan
```

### Prompt 8: Auditoria Completa (LGPD)

```
Implementar audit trail completo:

1. Eventos rastreados:
   - Login/Logout (com IP, user_agent)
   - Create/Read/Update/Delete escalas
   - Create/Read/Update/Delete turnos
   - Acesso a dados sensíveis (CPF)
   - Download/Export de dados
   - Mudanças de permissão
   - Falhas de acesso (RLS denial)

2. Schema audit_logs:
   - id, user_id, hospital_id, action
   - table_name, record_id
   - old_values, new_values (JSONB)
   - ip_address, user_agent
   - timestamp (immutable)

3. Retenção:
   - Keep 12 meses
   - Archive to cold storage after 6 meses
   - Complies LGPD artigo 7

4. Access:
   - Only admins can view
   - Export capability
   - Alerts on suspicious activity

5. Triggers (automatizar):
   - INSERT trigger on escalas → audit_logs
   - UPDATE trigger → log old/new values
   - Cannot delete audit_logs
```

---

## 🚀 Prompts de Feature Development

### Prompt: Gerar Escalas Automáticas

```
Implementar gerador automático de escalas com:

1. Input:
   - hospital_id
   - mes, ano
   - lista de enfermeiros
   - config_folga (min 6 dias, max 8 dias)

2. Algoritmo:
   - Distribuir 30 dias entre N enfermeiros
   - 3 turnos/dia (manha, tarde, noite)
   - Cada enfermeiro: ~10 turnos/mês
   - Folga: min 6 dias apart, max 8
   - PRIORIDADE: Segunda→Sexta push para 8 dias (seu algoritmo)
   - Avoid consecutive noturno (max 2)

3. Output:
   - Cria tabela turnos
   - Status: 'draft' (pode editar)
   - Timestamp: criado_em

4. Validação:
   - Total turnos = 30 dias × 3 turnos
   - Sem overlaps (enfermeiro em 2 lugares)
   - Folga rules respected

5. UI:
   - Modal com opções (rebalancear, regenerar)
   - Visual preview antes de criar
   - Undo/Redo capability
```

### Prompt: Integrar Stripe Checkout

```
Implementar Stripe Payment Flow:

1. Página de Planos:
   - Mostrar 3 planos (FREE, STARTER, PRO)
   - Comparação features (tabela)
   - CTA botões com preço em BRL
   - "Já paga?" link para change plan

2. Checkout:
   - Clica "Upgrade to Pro" → abre modal
   - Stripe PaymentElement (card, PIX, boleto)
   - Form: email confirmação
   - Submit → createPaymentIntent (backend)
   - confirmPayment() → sucesso/erro

3. Webhook Handler:
   - Escuta payment_intent.succeeded
   - Cria subscription em DB
   - Envia email confirmação (Resend)
   - Updated hospital subscription status
   - Log to audit_logs

4. UI Feedback:
   - Loading spinner durante processamento
   - Success page (redirect home)
   - Error message com suporte link
   - Retry button se falha

5. Security:
   - CSRF token em form
   - Verify customer_id matches
   - Never log card numbers
   - Validate amount backend-side
```

### Prompt: Dashboard Admin

```
Criar dashboard para admin do hospital:

1. KPIs:
   - Total enfermeiros
   - Escalas publicadas (mês atual)
   - Turnos preenchidos / Total
   - Taxa cobertura (%)

2. Tabelas:
   - Lista enfermeiros (role, status, last_login)
   - Escalas recentes (status, actions)
   - Transações pagamento (última 10)

3. Ações:
   - Invite enfermeiro (email)
   - Disable user
   - Download escalas (PDF, XLSX)
   - Change subscription plan

4. Charts:
   - Turnos por tipo (manha/tarde/noite)
   - Folgas distribuição
   - Activity timeline (últimos 7 dias)

5. Security:
   - Só admin vê
   - RLS enforcement
   - Audit log todas ações
   - Rate limit exports
```

---

## 🧪 Testing & Quality

### Testes Essenciais

```typescript
// RLS Tests
describe('RLS Policies', () => {
  it('enfermeiro should NOT see other hospital data', async () => {
    const response = await supabase
      .from('escalas')
      .select()
      .eq('hospital_id', 'other-hospital-id');
    
    expect(response.data).toEqual([]);
  });
});

// Validation Tests
describe('Input Validation', () => {
  it('rejects invalid email', async () => {
    const result = userSchema.safeParse({ email: 'invalid' });
    expect(result.success).toBe(false);
  });
});

// Auth Tests
describe('Authentication', () => {
  it('should NOT access without token', async () => {
    const response = await fetch('/api/escalas');
    expect(response.status).toBe(401);
  });
});
```

---

## 📋 Checklist: Build Fase 1

```
SEMANA 1-2: Setup
☐ Criar repo GitHub
☐ Setup Supabase (tables, RLS, auth)
☐ Configure Vite + TypeScript
☐ Setup Tailwind + shadcn/ui
☐ Create .env.local (não commit)
☐ README com instruções setup

SEMANA 3-4: Auth
☐ Login page (email/password)
☐ Signup page com validações
☐ useAuth hook + Context
☐ Middleware de auth protection
☐ Logout functionality
☐ Error handling Sentry

SEMANA 5-6: Core Features
☐ Criar escala (manual form)
☐ Grid visualizar escala
☐ Editar turno individual
☐ Delete turno
☐ Export PDF/XLSX

SEMANA 7-8: Auto-folga
☐ Integrar seu algoritmo
☐ Gerar escala automática
☐ Validar folga rules
☐ Visualizar antes de criar
☐ Auditoria de geração

SEMANA 9-10: Stripe + Monetização
☐ Página planos com pricing
☐ Integrar Stripe.js
☐ Checkout flow
☐ Webhook handler
☐ Confirmation emails (Resend)

SEMANA 11-12: Polish + Deploy
☐ Landing page
☐ Suporte email template
☐ Dark mode (opcional)
☐ Mobile responsivo
☐ Deploy Vercel
☐ DNS + SSL
☐ Monitoring (Sentry)

FINAL:
☐ Beta test com 5 hospitais
☐ Feedback loop
☐ Bug fixes
☐ Primeiro cliente pagante 🎉
```

---

## 🎯 Convenções de Código Específicas

### Supabse Queries

```typescript
// SEMPRE com error checking
const { data, error } = await supabase
  .from('escalas')
  .select('*')
  .eq('hospital_id', hospitalId)
  .throwOnError(); // Auto throw if error

if (!data) throw new Error('No data');

// Com tipos:
interface IEscala extends Database['public']['Tables']['escalas']['Row'] {}

// NEVER use .data directly without checking
```

### React Patterns

```typescript
// Components são functional + TypeScript
interface EscalaGridProps {
  escalaId: string;
  onUpdate?: (escala: IEscala) => void;
}

export function EscalaGrid({ escalaId, onUpdate }: EscalaGridProps) {
  const [data, setData] = useState<IEscala | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEscala(escalaId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [escalaId]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!data) return <div>Sem dados</div>;

  return <div>{/* render */}</div>;
}
```

### Error Messages

```typescript
// User-friendly messages (português PT-BR)
const errors = {
  auth_invalid_email: 'Email inválido. Verifique e tente novamente.',
  auth_weak_password: 'Senha deve ter 8+ caracteres, com letras e números.',
  db_unique_violation: 'Este item já existe. Verifique os dados.',
  stripe_declined: 'Seu cartão foi recusado. Tente outro método.',
  rate_limit: 'Muitas tentativas. Aguarde 10 minutos.',
  unknown_error: 'Algo deu errado. Contate suporte.',
};
```

---

## 🔄 Workflow de Desenvolvimento

```bash
# 1. Start dev server
npm run dev

# 2. Watch Supabase migrations
supabase db pull

# 3. Make changes
# → Código em src/
# → DB em supabase/migrations/

# 4. Test locally
npm run test

# 5. Commit
git commit -m "feat: escala grid component"

# 6. Push → GitHub Actions runs tests
git push

# 7. Deploy to Vercel (auto)
# → Vercel detects push
# → Runs build
# → Deploy to preview/prod

# 8. Monitor
# → Sentry for errors
# → Vercel analytics
# → Supabase logs
```

---

## 📞 Suporte & Contato

```
Erro? Use este formato:
1. Qual componente/página?
2. Qual ação do usuário?
3. Qual erro/mensagem?
4. Reproducir steps:
   - Passo 1
   - Passo 2
   - Esperado vs Real

Escalação:
- Dev issues: abrir no GitHub/Claude Code
- Stripe issues: verificar Stripe dashboard
- Supabase issues: Supabase logs
- Sentry errors: abrir dashboard Sentry
```

---

**Última atualização:** 2026-07-02  
**Versão:** 0.1.0 (MVP)  
**Mantido por:** Matheus Bonato  
**Status:** Development
