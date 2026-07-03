# 🚀 Guia de Setup - Escala de Enfermagem

Siga este guia passo a passo para ter a aplicação rodando localmente.

---

## 📋 O Que Você Vai Precisa

```
✅ Node.js 18+         (check com: node --version)
✅ npm 9+              (check com: npm --version)  
✅ Git                 (check com: git --version)
✅ Conta Supabase      (free tier: supabase.com/dashboard)
✅ Conta Stripe        (free para dev: stripe.com/dashboard)
✅ Navegador moderno   (Chrome, Firefox, Safari)
✅ Editor de código    (VS Code, Cursor, etc)
```

---

## 🔧 FASE 1: Setup Local (15 min)

### 1.1 Clone o Repositório

```bash
# Criar pasta
mkdir escala-enfermagem
cd escala-enfermagem

# (Se já tem repo)
git clone <seu-repo-url> .
cd escala-enfermagem
```

### 1.2 Instale Dependências

```bash
npm install
```

Vai baixar ~400MB (React, Supabase, Stripe, etc)

### 1.3 Configure Variáveis de Ambiente

```bash
# Copie arquivo de exemplo
cp .env.local.example .env.local

# Abra e edite
nano .env.local  # ou use seu editor

# Deixe assim por enquanto (vamos preencher depois):
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Salve e feche
```

---

## 🗄️ FASE 2: Setup Supabase (20 min)

### 2.1 Criar Projeto Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Preencha:
   - **Name:** `Kora-Enfermagem`
   - **Database Password:** gere uma senha forte (salve em lugar seguro!)
   - **Region:** `South America (São Paulo)` ou próxima
   - **Pricing Plan:** `Free` (ok para MVP)
4. Clique "Create new project"
5. Aguarde 2-3 minutos até estar pronto

### 2.2 Copie API Keys

1. No Supabase dashboard, vá a **Settings** → **API**
2. Copie:
   - `Project URL` → Cole em `VITE_SUPABASE_URL`
   - `anon public` key → Cole em `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → Cole em `SUPABASE_SERVICE_ROLE_KEY` (backend only!)

3. Salve `.env.local`

### 2.3 Apply Database Schema

```bash
# Login no Supabase CLI
npx supabase login
# Vai abrir navegador, faça login

# Link seu projeto
npx supabase link --project-ref https://ksqquqeambutavkfduur.supabase.co
# Encontre seu-project-ref na URL do Supabase dashboard

# Push schema (cria todas as tabelas)
npx supabase db push

# Vai dar opção de aplicar migrations - confirme
```

✅ Banco de dados criado!

### 2.4 Verificar Schema

```bash
# Ver tabelas criadas
npx supabase db list

# Output deve mostrar:
# - hospitals
# - users
# - escalas
# - turnos
# - config_escalas
# - subscription_plans
# - subscriptions
# - transactions
# - audit_logs
```

---

## 💳 FASE 3: Setup Stripe (15 min)

### 3.1 Criar Conta Stripe

1. Acesse [stripe.com/dashboard](https://stripe.com/dashboard)
2. Clique "Sign up"
3. Preencha dados pessoais
4. Confirme email
5. Escolha "Test mode" (não ativa cobranças reais)

### 3.2 Copie API Keys

1. No Stripe dashboard, vá a **Developers** → **API keys**
2. Modo **Test** (important!)
3. Copie:
   - `Publishable key` → Cole em `VITE_STRIPE_PUBLIC_KEY`
   - `Secret key` → Cole em `STRIPE_SECRET_KEY`

### 3.3 Setup Webhook

1. Vá a **Developers** → **Webhooks**
2. Clique "Add endpoint"
3. URL: `http://localhost:3000/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
5. Click "Add endpoint"
6. Clique na entrada criada
7. Copie "Signing secret" → Cole em `STRIPE_WEBHOOK_SECRET`

### 3.4 Test Stripe Credentials

```bash
# Ver se credenciais estão corretas
curl -u sk_test_sua_secret_key: \
  https://api.stripe.com/v1/account

# Se retornar dados da conta = tudo certo!
```

---

## 🎬 FASE 4: Start Dev Server (5 min)

### 4.1 Inicie Dev Server

```bash
npm run dev

# Output deve mostrar:
#   VITE v5.2.11  local:   http://localhost:5173/
```

### 4.2 Acesse a App

Abra no navegador: `http://localhost:5173`

✅ App rodando localmente!

### 4.3 Teste Básico

```
[ ] Página carrega
[ ] Vê "Login" ou landing page
[ ] Não tem erros no console (F12)
[ ] Supabase conectado (checa .env.local)
```

---

## 👤 FASE 5: Teste Login (5 min)

### 5.1 Create Test User

```bash
# No Supabase dashboard:
# 1. Vá para "Authentication" → "Users"
# 2. Clique "Add user"
# 3. Preencha:
#    Email: test@example.com
#    Password: TestPassword123!
# 4. Click "Create user"

# OU use via CLI:
curl -X POST \
  'http://localhost:3000/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### 5.2 Test Login Flow

1. Clique "Login" na app
2. Coloque `test@example.com` e `TestPassword123!`
3. Clique "Entrar"

✅ Login funcionando!

---

## 📝 FASE 6: Estrutura Inicial (10 min)

### 6.1 Crie Pastas

```bash
# A estrutura deve ser assim:
src/
├── components/
│   ├── auth/          # (criar depois)
│   ├── escalas/       # (criar depois)
│   └── common/        # (criar depois)
├── pages/
├── services/          # ✅ Já tem (supabase.ts, auth.ts)
├── hooks/             # (criar depois)
├── types/             # ✅ Já tem (index.ts)
├── utils/             # ✅ Já tem (validation.ts)
├── styles/            # (criar depois)
├── App.tsx            # (criar depois)
└── main.tsx           # (criar depois)

# Se não existem, crie:
mkdir -p src/{components/{auth,escalas,common},pages,hooks,styles}
```

### 6.2 Verificar Arquivos Existentes

```bash
ls -la src/services/   # Deve ter supabase.ts, auth.ts
ls -la src/types/      # Deve ter index.ts
ls -la src/utils/      # Deve ter validation.ts
```

---

## 🧪 FASE 7: Rodar Testes (5 min)

### 7.1 Type Check

```bash
npm run type-check

# Output: "No errors" = bom!
```

### 7.2 Lint (optional)

```bash
npm run lint

# Se der erro, é só style (não vai quebrar app)
```

---

## 📚 FASE 8: Próximos Passos

Agora você tem a infraestrutura pronta! Siga este roadmap:

### Semana 1-2: Components & Pages

```bash
# Use Claude Code (ou copie prompts de CLAUDE.md)
# Crie:
- LoginPage.tsx
- SignupPage.tsx
- EscalaGrid.tsx (grid do mês)
- DashboardPage.tsx
```

### Semana 3-4: Features Core

```
- Autenticação (useAuth hook)
- CRUD escalas
- CRUD turnos
- Export PDF (pdfkit)
```

### Semana 5-6: Monetização

```
- Stripe integration (checkout modal)
- Planos pricing page
- Webhook handler
```

### Semana 7-8: Mobile & Deploy

```
- React Native (depois)
- Deploy Vercel
- Domínio + SSL
```

---

## 🆘 Troubleshooting

### Erro: "VITE_SUPABASE_URL is undefined"

**Solução:**
```bash
# Verifica se .env.local existe
ls -la .env.local

# Se não existe:
cp .env.local.example .env.local

# Edita e preenche credenciais
```

### Erro: "Supabase connection failed"

**Solução:**
```bash
# 1. Verifica internet
ping google.com

# 2. Verifica credenciais em .env.local
# 3. Verifica se projeto Supabase está online (dashboard)
# 4. Reinicia dev server: Ctrl+C e npm run dev
```

### Erro: "RLS violation" ou "PGRST116"

**Solução:**
```
Normal em desenvolvimento!
- Significa RLS está funcionando (segurança)
- Faça login para ter permissões
- Se já logado, check role no Supabase Users
```

### Erro: "Cannot find module"

**Solução:**
```bash
# Reinstala dependências
rm -rf node_modules package-lock.json
npm install

# Reinicia dev server
npm run dev
```

### Stripe webhook não funciona

**Solução:**
```bash
# Em desenvolvimento, webhooks não funcionam
# (seu localhost não é acessível internet)

# Para testar:
# 1. Deploy app para Vercel
# 2. Atualize webhook URL no Stripe
# 3. Ou use Stripe CLI localmente (advanced)

# Stripe CLI:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 🎯 Checklist: "App Rodando"

```
[ ] Node.js instalado (node --version)
[ ] npm install rodou sem erros
[ ] .env.local preenchido
[ ] Supabase projeto criado
[ ] Schema aplicado (supabase db push)
[ ] Stripe credenciais copiadas
[ ] npm run dev funciona
[ ] App abre em localhost:5173
[ ] Login funciona
[ ] Nenhum erro no console (F12)
```

---

## 🚀 Próximo: Comece a Codar!

Abra `CLAUDE.md` e siga os prompts prontos para:

1. **Setup Autenticação Segura**
   ```
   Copiar prompt de CLAUDE.md → Colar no Claude Code
   ```

2. **Criar Components Básicos**
   ```
   LoginPage, SignupPage, EscalaGrid
   ```

3. **Integrar Stripe**
   ```
   Checkout modal, webhook handler
   ```

4. **Deploy Vercel**
   ```
   1. Commit código
   2. Push para GitHub
   3. Connect Vercel
   4. Deploy
   ```

---

## 💡 Tips

- **VSCode:** Instale "Supabase" extension
- **Prettier:** `npx prettier --write src` para formatar
- **Console:** Sempre abra DevTools (F12) para debug
- **Supabase:** Dashboard sempre aberto para checar logs
- **Stripe:** Use kartões teste (4242 4242 4242 4242)

---

## 📞 Precisa de Ajuda?

1. **Erro específico?** → Procure em `Troubleshooting`
2. **Código?** → Vá para `CLAUDE.md` (prompts prontos)
3. **Banco de dados?** → Supabase dashboard → SQL Editor
4. **Pagamentos?** → Stripe dashboard → Developers → Logs

---

**Status:** Pronto para codar! 🎉

Próximo passo: Abra `CLAUDE.md` e começe com o prompt "Setup Autenticação Segura"
