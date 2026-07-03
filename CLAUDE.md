# Escala de Enfermagem - CLAUDE.md v2 (REALISTA)

**Última Auditoria:** 2026-07-02 | Commit: 09dfcc0  
**Status Real:** MVP Funcional em Produção (Beta Interno)  
**Pronto para Produção?** ❌ Não (faltam compliance críticos)

---

## ⚡ AUTONOMIA TOTAL: REGRA DO CLAUDE CODE

### POLÍTICA DE ZERO ERROS

```
📋 TODA IMPLEMENTAÇÃO SEGUE ESTE FLUXO (NÃO PULAR ETAPAS):

1️⃣  PLANEJAR
   └─ Quebrar tarefa em passos testáveis
   └─ Definir o que será testado e como

2️⃣  IMPLEMENTAR
   └─ Código limpo, TypeScript strict
   └─ Comentários explicando lógica
   └─ Sem assumições - valida tudo

3️⃣  TESTAR ATOMICAMENTE (não continua sem passar)
   ├─ SQL migrations → SELECT * FROM tabela (verificar)
   ├─ Edge Functions → curl + logs (verificar saída)
   ├─ React components → npm run dev (exercitar UI)
   ├─ Integrações → credenciais reais (Stripe/Supabase)
   ├─ Webhooks → disparar evento teste (verificar BD)
   └─ Config → rodar e validar output esperado

4️⃣  REPORTAR STATUS
   ├─ Se passou → "✅ COMPLETO: [descrição]"
   ├─ Se falhou → "❌ FALHOU: [erro exato] → Corrigindo..."
   └─ Retestar após fix

5️⃣  PRÓXIMO PASSO
   └─ Só avança se etapa anterior foi 100% validada

🚫 NUNCA FAZER:
   ├─ "Deve funcionar" (comprovar com execução real)
   ├─ Empilhar features sobre algo não testado
   ├─ Ignorar avisos/erros do compilador/runtime
   ├─ Mudar scope mid-task (finish this, plan next)
   └─ Assumir que dev local = produção (Vercel pode quebrar diferente)

✅ SEMPRE FAZER:
   ├─ Testar CADA mudança antes de commitar
   ├─ Reproduzir erro exato (não genérico)
   ├─ Validar em múltiplos contextos (dev, prod-like)
   ├─ Documentar decisões + problemas encontrados
   └─ Report: [ANTES] → [IMPLEMENTADO] → [TESTADO] → [RESULTADO]
```

### STATUS DE TAREFA (para cada prompt)

```
✅ PRONTO (MVP funcional)
   └─ Implementado, testado, em produção
   └─ Use como está, sem adaptações

⚠️  PARCIAL (funciona, mas incomplete)
   └─ Implementado, testado, faltam features
   └─ Adapte conforme descrição

🔴 CRÍTICO (deve fazer antes de produção)
   └─ Falta implementar, bloqueia compliance
   └─ Prioridade máxima, comece por aqui

📋 ROADMAP (future, nice-to-have)
   └─ Planejado, não crítico
   └─ Faça depois de criticais
```

---

## 📊 STATUS ATUAL: O Que Funciona, O Que Falta

### ✅ FUNCIONANDO (Testado em Produção)

```
1.910 linhas de código real
27 arquivos estruturados

AUTENTICAÇÃO:
✅ Login via Supabase Auth (JWT + refresh)
✅ Signup com auto-criação de hospital
✅ Logout seguro
✅ Reset password flow
✅ Session management
✅ Rate limiting de login (5 tentativas/10min, Postgres-backed, server-side)

BANCO DE DADOS:
✅ 9 tabelas (hospitals, users, escalas, turnos, subscriptions, etc)
✅ RLS em todas as tabelas (19 policies)
✅ Constraints + check validações
✅ Índices para performance

ESCALAS:
✅ CRUD escalas (create, read, update, delete)
✅ CRUD turnos com uniqueness (user+data+escala)
✅ Gerador automático SMART (rotação por deslocamento)
✅ Evita turnos noturnos consecutivos
✅ Folga rules (min 6, max 8 dias)
✅ Export PDF real (jsPDF)

PAGAMENTOS:
✅ Stripe Checkout integration
✅ Webhook handler (idempotente)
✅ Subscription tracking
✅ Transaction audit
✅ Payment status sync

COMPLIANCE:
✅ Audit logs (login/logout com IP)
✅ RLS enforcement (cada hospital isolado)
✅ Supabase Auth nativo (passwords bcrypt 12+)
✅ HTTPS + deploy Vercel seguro
✅ Tipos TypeScript completos

QUALIDADE:
✅ TypeScript strict mode
✅ Vite build otimizado
✅ React 18 moderno
✅ Tailwind CSS configurado
✅ Error handling básico
```

### ❌ FALTANDO (Bloqueadores para Produção)

```
SEGURANÇA CRÍTICA (Semanas 1-2):
🔴 Criptografia de CPF/Telefone
   └─ Coluna cpf_encrypted existe, nunca é escrita
   └─ Promessa em CLAUDE.md original, não implementado
   └─ LGPD compliance exige isso

✅ Rate Limiting de Login
   └─ Edge Function dedicada intercepta antes do Supabase Auth
   └─ 5 tentativas falhas/10min por email, contadas em Postgres
   └─ Rate limit genérico de API (por user/IP em toda leitura) NÃO implementado:
      exigiria proxyar todo o PostgREST via Edge Functions, não é um patch

⚪ CSRF Tokens — DECISÃO: não implementar
   └─ Motivo: Bearer JWT em localStorage não é vulnerável ao ataque
      clássico que CSRF previne (exige cookie ambiente, não temos)
   └─ Substituído por: CSP header + auditoria XSS (~2-3h, risco real p/ essa arquitetura)

🔴 Sentry Integration
   └─ Zero importações de Sentry
   └─ Quebras em produção não são logadas
   └─ Vercel logs não rastreiam erros de app

MONITORAMENTO (Semanas 2-3):
⚠️  Emails Transacionais (Resend)
   └─ Confirmação de email = Supabase padrão
   └─ Notificações (novo turno, etc) = não existe
   └─ Password reset email = Supabase padrão

⚠️  Dashboard Admin Completo
   └─ Existe saudação + 2 links
   └─ KPIs (enfermeiros, escalas, taxa cobertura) = não existe
   └─ Tabelas (users, escalas, transactions) = não existe
   └─ Charts (turnos por tipo, folgas) = não existe

FEATURES SECUNDÁRIAS (Semanas 3-4):
📋 Export XLSX (PDF funciona)
📋 React Native App (adiado)
📋 Integrações (WhatsApp, Slack)
```

---

## 🐛 Bugs Encontrados & Corrigidos (Auditoria)

### Problema 1: Recursão Infinita em RLS

```
❌ SINTOMA:
   users login → 500 error

🔍 CAUSA:
   Policy de users fazia subquery na própria users table
   (users WHERE id = auth.uid()) → infinita

✅ SOLUÇÃO:
   Usar função SECURITY DEFINER instead de subquery
   CREATE FUNCTION get_user_hospital(uuid)
   RETURNS uuid AS $$
   SELECT hospital_id FROM users WHERE id = $1
   $$ LANGUAGE SQL SECURITY DEFINER;

📝 RESULTADO:
   Login funciona, policies não travem
```

### Problema 2: API Stripe Deprecada

```
❌ SINTOMA:
   webhook stripe-webhook → "Invalid time value"

🔍 CAUSA:
   current_period_start/end saiu do objeto Subscription
   Stripe moveu para items.data[0].period
   Código tentava acessar campo inexistente

✅ SOLUÇÃO:
   Adaptar webhook para novo formato:
   const period = event.data.object.items.data[0].period;
   const start = period.start * 1000;
   const end = period.end * 1000;

📝 RESULTADO:
   Webhook processa corretamente, timestamps sincronizam
```

### Problema 3: Race Condition Webhook

```
❌ SINTOMA:
   Stripe envia created + updated concorrente
   Status voltava pra "incomplete" (último evento)
   Subscription nunca ativa quando deve

🔍 CAUSA:
   SELECT + upsert não é atômico
   Dois webhooks podem executar paralelos:
   ├─ Webhook 1: lê status="active" → escreve
   ├─ Webhook 2: lê status="incomplete" (antes de 1 terminar)
   └─ Resultado: status=incomplete vence

✅ SOLUÇÃO:
   Use ON CONFLICT ... WHERE na função SQL:
   INSERT INTO subscriptions (...)
   VALUES (...)
   ON CONFLICT (stripe_subscription_id) DO UPDATE
   SET status = CASE 
     WHEN EXCLUDED.status = 'active' THEN 'active'
     ELSE subscriptions.status 
   END
   WHERE subscriptions.status != 'active';

📝 RESULTADO:
   Race condition eliminada, subscriptions atomicamente atualizadas
```

### Problema 4: CORS Ausente

```
❌ SINTOMA:
   create-checkout-session → browser bloqueia preflight
   OPTIONS request falhava

🔍 CAUSA:
   Edge Function não respondia a OPTIONS
   CORS headers ausentes

✅ SOLUÇÃO:
   if (req.method === 'OPTIONS') {
     return new Response('ok', {
       headers: {
         'Access-Control-Allow-Origin': origin,
         'Access-Control-Allow-Methods': 'POST, OPTIONS',
         'Access-Control-Allow-Headers': 'Content-Type',
         'Access-Control-Max-Age': '86400',
       }
     });
   }

📝 RESULTADO:
   Preflight passa, Stripe checkout funciona
```

### Problema 5: Gerador Turnos Escalava 31 Noites

```
❌ SINTOMA:
   Gerar escala com 3 enfermeiros
   Resultado: 31 noites seguidas pro mesmo enfermeiro

🔍 CAUSA:
   Round-robin com skip ficava sem candidato viável
   Algoritmo original: "pula quem já trabalhou noite"
   Com 3 pessoas e 30 dias: fica apertado, falha

✅ SOLUÇÃO:
   Trocar por fórmula de rotação por deslocamento:
   shift = (day + shift_index) % num_workers
   Matematicamente garante distribuição
   Nenhuma violação de "max 2 noites seguidas"

📝 RESULTADO:
   Escalas geradas corretamente, folgas respeitadas
   Sem edge cases, formulaico
```

### Problema 6: SPA Sem Rewrite Vercel

```
❌ SINTOMA:
   Routes fora de "/" → 404 em produção
   /escalas/123 dava 404
   Mas localhost funcionava (vite faz fallback automático)

🔍 CAUSA:
   Vercel static não sabe que é SPA
   Procura arquivo /escalas/123.html (não existe)

✅ SOLUÇÃO:
   vercel.json:
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }

📝 RESULTADO:
   React Router funciona, todas rotas resolvem
```

### Problema 7: Peer-Dependency Quebrada Build

```
❌ SINTOMA:
   npm install falhava com ERESOLVE
   Vercel build: "Peer dependency violation"

🔍 CAUSA:
   @vitejs/plugin-react@4.7 só suporta vite até ^7
   package.json tinha vite@^8

✅ SOLUÇÃO:
   Upgrade plugin para versão que suporta vite 8:
   @vitejs/plugin-react@^6.0.0
   (ou downgrade vite se necessário)

📝 RESULTADO:
   npm install passa, Vercel build sem erro
```

### Problema 8: supabase.functions.invoke() Esconde Corpo de Erro

```
❌ SINTOMA:
   Toda resposta não-2xx da Edge Function mostrava erro genérico

🔍 CAUSA:
   invoke() só popula `data` em 2xx; em 400/429 o corpo real
   está em error.context (FunctionsHttpError), não em data

✅ SOLUÇÃO:
   try { body = await error.context.json() } para extrair
   mensagem real (ex: retryAfter do rate limit)

📝 LIÇÃO:
   Só apareceu em teste E2E real — invisível a type-check/lint

STATUS: ✅ CORRIGIDO
```

---

## 🏗️ Arquitetura Real: O Que Existe Mesmo

```
src/                (1.200 linhas)
├── App.tsx         (57 lin) - Router + provider setup
├── main.tsx        (10 lin) - React entry
├── components/
│   └── common/
│       └── ProtectedRoute.tsx (12 lin)
├── hooks/
│   └── useAuth.tsx (80 lin) - Auth context + state
├── pages/
│   ├── DashboardPage.tsx (25 lin) - Saudação + 2 links
│   ├── PlanosPage.tsx (77 lin) - Pricing 3 planos
│   ├── auth/
│   │   ├── LoginPage.tsx (84 lin)
│   │   └── SignupPage.tsx (120 lin)
│   └── escalas/
│       ├── EscalasPage.tsx (108 lin) - Lista escalas
│       └── EscalaDetailPage.tsx (220 lin) - Grid + editor
├── services/
│   ├── auth.ts (91 lin) - Login/signup/logout
│   ├── billing.ts (35 lin) - Stripe customer + subscription
│   ├── escalas.ts (93 lin) - CRUD + gerador
│   ├── exportEscala.ts (36 lin) - PDF export
│   ├── gerarEscala.ts (51 lin) - Algoritmo rotação
│   └── supabase.ts (10 lin) - Client init
├── types/
│   └── index.ts (38 lin) - Interfaces completas
└── utils/
    └── validation.ts (20 lin) - Zod schemas básicos

supabase/             (700+ linhas)
├── functions/
│   ├── create-checkout-session/index.ts (84 lin)
│   └── stripe-webhook/index.ts (160 lin)
└── migrations/
    └── 10 arquivos SQL (488 lin)
       ├── 001_hospitals_users.sql
       ├── 002_escalas_turnos.sql
       ├── 003_subscriptions.sql
       ├── 004_audit_logs.sql
       └── ... triggers, indexes, RLS policies
```

### Stack Real (11 dependências, não 20+)

```
react@18.3.1            - UI framework
react-dom@18.3.1        - React rendering
react-router-dom@6.26   - Routing SPA
typescript@5.5.4        - Type safety
vite@8.1.3              - Build tool
tailwindcss@3.4.10      - Styling
@supabase/supabase-js   - Backend client
zod@3.23.8              - Validation
jspdf@4.2.1             - PDF export
@vitejs/plugin-react    - Vite plugin
vercel                  - Deployment

Dead weight (importado mas não usado):
❌ @tanstack/react-query (nunca importado)
❌ crypto-js (nunca importado)
❌ date-fns (nunca importado)
❌ @stripe/stripe-js (Stripe via Edge Function)
```

---

## 📋 ROADMAP: 3 Phases (Foco em 0 Erros)

### Phase 0: MVP (Hoje) ✅

```
STATUS: Em produção (beta internal)

COMPLETO:
✅ Autenticação
✅ Escalas CRUD
✅ Gerador smart
✅ Stripe básico
✅ PDF export
✅ Deploy Vercel

RESTRIÇÕES CONHECIDAS:
⚠️  Sem criptografia CPF (não implementar)
⚠️  Sem Sentry monitoring
⚠️  Dashboard admin mínimo
✅ Rate limiting de login: implementado
⚪ CSRF tokens: descartado por decisão (ver Prompt 3), não é lacuna

TIMELINE: Já pronto

USO: Beta interno / testes com hospitais amigos
     NÃO use com dados sensíveis reais (CPF, etc)
```

### Phase 1: Compliance Crítico (Semanas 1-2) 🔴

```
BLOQUEADORES para produção real

TAREFA 1: Criptografia CPF/Telefone
├─ Implementar em: users.ts (create/update)
├─ Adicionar: encryption-service.ts (AES-256)
├─ Storage: Supabase Vault (server-side)
├─ Masking: UI mostra ****.***.***-**
├─ Teste:
│  └─ Criar user com CPF
│  └─ Verificar BD (deve estar encriptado)
│  └─ Ler como admin (deve descriptografar)
│  └─ Audit log que acesso foi feito
└─ Tempo: 8-10 horas
└─ Status: 🔴 CRÍTICO (LGPD)

TAREFA 2: Rate Limiting de Login ✅ CONCLUÍDO
├─ Implementado em: Edge Function dedicada (supabase/functions/login)
├─ Login passa a ir por essa function em vez de signInWithPassword direto
├─ Storage: tabela Postgres login_attempts (não in-memory — Edge Functions
│  são efêmeras, contador em memória não sobrevive entre invocações)
├─ Testado:
│  └─ 4 tentativas erradas → contagem regressiva certa (restam 4,3,2,1)
│  └─ 6ª tentativa bloqueada com 429 + mensagem
│  └─ Audit trail em login_attempts confere
├─ Escopo reduzido deliberadamente: rate limit genérico de API (100/min
│  autenticado, 20/min anônimo) NÃO implementado — exigiria proxyar todo
│  o PostgREST via Edge Functions, não é um patch de horas
└─ Bug encontrado no processo: ver Problema 8 (supabase.functions.invoke
   esconde corpo de erro em respostas não-2xx)

TAREFA 3: CSP Headers + Auditoria XSS ✅ CONCLUÍDO (substituiu CSRF Tokens)
├─ DECISÃO: CSRF tokens descartados — Bearer JWT em localStorage não é
│  vulnerável ao ataque clássico que CSRF previne (exige cookie ambiente)
├─ Auditoria: sem dangerouslySetInnerHTML, innerHTML, eval, style inline
│  via prop, ou target=_blank sem rel=noopener em todo src/
├─ Implementado: vercel.json com CSP restritivo (sem unsafe-inline — build
│  de produção não usa <script>/<style> inline) + X-Content-Type-Options,
│  X-Frame-Options, Referrer-Policy
├─ Testado em produção (não só local — CSP é config de servidor):
│  └─ curl -I confirma header presente
│  └─ Fluxo completo (login → escalas → checkout Stripe) sem violação de CSP
└─ Tempo real: ~30min (vs. 2-3h estimadas)

TAREFA 4: Sentry Integration
├─ Setup: sentry.init() no main.tsx
├─ Captura: uncaught errors + Supabase errors
├─ Breadcrumbs: user actions (login, click, etc)
├─ Teste:
│  └─ Trigger erro (check Sentry dashboard)
│  └─ Verificar breadcrumbs
└─ Tempo: 3-4 horas
└─ Status: 🔴 CRÍTICO (monitoring)

TOTAL PHASE 1 RESTANTE: ~11-14 horas (CPF 8-10h + Sentry 3-4h)
JÁ CONCLUÍDO: Rate Limiting de Login (Tarefa 2), CSP/XSS (Tarefa 3)
RESULTADO: Pronto para produção real com dados sensíveis
```

### Phase 2: Admin & Features (Semanas 3-4) ⚠️

```
NICE-TO-HAVE mas recomendado

TAREFA 1: Dashboard Admin Real
├─ KPIs: total users, escalas, cobertura %
├─ Tabelas: users (role, status), escalas (status), transactions
├─ Charts: turnos por tipo, folgas distribuição
├─ Ações: invite user, disable user, download escalas
├─ Teste: admin login → ver tudo, enfermeiro → acesso negado
├─ Tempo: 12-14 horas

TAREFA 2: Emails Transacionais (Resend)
├─ Eventos: novo turno, escala publicada, pagamento
├─ Template: HTML email profissional
├─ Teste: dispara evento → email chega
├─ Tempo: 8-10 horas

TAREFA 3: Export XLSX
├─ Add: xlsx lib ao package.json
├─ Implement: EscalaDetailPage → exportar XLSX
├─ Teste: download → abrir Excel → dados corretos
├─ Tempo: 4-5 horas

TAREFA 4: Audit Logs Completo
├─ Expand: rastrear read/export também
├─ Triggers: INSERT on escalas/turnos, etc
├─ Retenção: 12 meses (archive cold storage)
├─ Teste: ação → aparece em audit_logs
├─ Tempo: 6-8 horas

TOTAL PHASE 2: ~30-37 horas
TIMELINE: Semanas 3-4
RESULTADO: App robusto + compliance LGPD completo
```

### Phase 3: Scale & Mobile (Mês 2+) 📋

```
ROADMAP FUTURO (não crítico agora)

📋 React Native App
   └─ Compartilha API Supabase
   └─ Notificações push
   └─ Sync offline
   └─ Estimado: 60-80 horas

📋 Integrações
   ├─ WhatsApp (notificações)
   ├─ Slack (admin alerts)
   ├─ Google Calendar (sync escalas)
   └─ Estimado: 40-50 horas por integração

📋 Analytics
   ├─ Relatório mensal automático
   ├─ Insights (turnos não preenchidos, etc)
   └─ Estimado: 20-25 horas

📋 Mobile Responsivo (já está 80%)
   └─ Ajustes UI para mobile
   └─ Estimado: 5-8 horas
```

---

## 🔐 Prompts Prontos (Status Marcado)

### Segurança & Compliance

#### ✅ Prompt 1: Setup Autenticação Segura

**Status:** MVP funcional (implementado)

```
Garantir que Supabase Auth está 100% seguro:

VERIFICAR (não implementar):
1. ✅ JWT validation a cada requisição (useAuth)
2. ✅ Refresh token automático (Supabase nativo)
3. ✅ CORS setup (Vercel headers)
4. ✅ Logout limpa token (localStorage)
5. ✅ useAuth hook com Context API

FALTA:
❌ Sentry (ver Prompt 4)

JÁ RESOLVIDO:
✅ Rate limiting de login (Prompt 2)
⚪ CSRF tokens — descartado por decisão, ver Prompt 3 (CSP/XSS no lugar)

USE: Como está, já funciona
```

#### ✅ Prompt 2: Rate Limiting de Login

**Status:** IMPLEMENTADO (escopo reduzido, justificado)

```
Rate limiting real, server-side, em Edge Function:

✅ Login: 5 tentativas falhas/10min por email
✅ Storage: tabela Postgres login_attempts (não in-memory/cache —
   Edge Functions são efêmeras, contador em memória não é confiável)
✅ Login passa pela function em vez de chamar Supabase Auth direto
✅ Teste: 6 logins rápido → 6º retorna 429 (validado)

NÃO IMPLEMENTADO (decisão de escopo, não esquecimento):
❌ Rate limit genérico de API (100/min auth, 20/min anon) — exigiria
   proxyar todo o PostgREST via Edge Functions; não é um patch, é
   reescrever a camada de dados
❌ Whitelist de IP da Stripe no webhook — redundante (já verificamos
   assinatura criptográfica, garantia mais forte) e frágil (Stripe não
   publica faixa de IP estável para isso)

Bug encontrado durante implementação: ver Problema 8 no changelog
(supabase.functions.invoke esconde corpo de erro em respostas não-2xx)

Tempo real: ~2h (vs. 5-6h estimadas)
```

#### ✅ Prompt 3: CSP Headers & Auditoria XSS (substitui CSRF Tokens)

**Status:** IMPLEMENTADO

```
DECISÃO DE ARQUITETURA: CSRF tokens não fazem sentido aqui.

CSRF explora autenticação por cookie ambiente — o browser anexa o
cookie sozinho em qualquer request cross-site. Esta app usa Bearer JWT
guardado em localStorage, enviado explicitamente no header Authorization.
Um site malicioso não tem acesso a esse token sem já ter comprometido
a página via XSS — nesse ponto CSRF é irrelevante, XSS é o problema real.

FEITO:
✅ Auditoria: zero dangerouslySetInnerHTML/innerHTML/eval em src/, zero
   style inline via prop, zero target=_blank sem rel=noopener
✅ Content-Security-Policy via vercel.json — sem unsafe-inline (build de
   produção não tem <script>/<style> inline, então não precisou)
✅ X-Content-Type-Options: nosniff, X-Frame-Options: DENY,
   Referrer-Policy: strict-origin-when-cross-origin

Testado em produção (headers só existem no servidor Vercel, não em
vite dev local):
├─ curl -I https://kora-enfermagem.vercel.app/ → CSP presente
└─ Fluxo completo (login → escalas → checkout Stripe) sem violação de
   CSP nem regressão — connect-src liberado só pro domínio do Supabase

Tempo real: ~30min (vs. 2-3h estimadas)
```

#### 🔴 Prompt 4: Sentry Error Tracking

**Status:** NÃO IMPLEMENTADO (crítico semana 1)

```
Integrar Sentry para monitoring de erros:

1. npm install @sentry/react
2. main.tsx: Sentry.init() com DSN
3. Captura automática de:
   ├─ Uncaught exceptions
   ├─ Supabase errors
   ├─ Network failures
   ├─ User breadcrumbs (login, click, navigate)
4. Teste: throw error → aparece no Sentry dashboard

Config:
├─ environment: development | production
├─ tracesSampleRate: 0.1 (10% sampling)
├─ integrations: [new Replay()]

Tempo: 3-4 horas
Prioridade: 🔴 CRÍTICO (production monitoring)
```

#### 🔴 Prompt 5: Criptografia CPF/Telefone

**Status:** NÃO IMPLEMENTADO (crítico semana 2, LGPD)

```
Implementar AES-256 para dados sensíveis:

ANTES:
└─ CPF armazenado plaintext em DB (violar LGPD)

DEPOIS:
├─ users.ts (create): encrypt antes de salvar
├─ users.ts (read): decrypt ao ler
├─ Vault key: Supabase Vault (server-side)
├─ Masking UI: "***.***.***-**"
├─ Auditoria: audit_logs registra acesso

Stack:
├─ crypto-js (client-side hash)
├─ Supabase Vault (server encryption)
├─ Função: encryptCPF(), decryptCPF()

Teste:
├─ Salvar user com CPF
├─ Verificar BD (encriptado)
├─ Admin ler CPF (descriptografa)
├─ Audit log mostra quem acessou

Tempo: 8-10 horas
Prioridade: 🔴 CRÍTICO (LGPD artigo 6)
```

### Features & Admin

#### ⚠️ Prompt 6: Dashboard Admin Completo

**Status:** PARCIAL (saudação existe, KPIs não)

```
Expandir dashboard (não é crítico, mas recomendado):

HOJE:
├─ Saudação + 2 links
└─ 25 linhas

ADICIONAR:
├─ KPIs (card grid):
│  ├─ Total enfermeiros
│  ├─ Escalas publishadas este mês
│  ├─ Taxa cobertura %
│  └─ Subscription status
│
├─ Tabelas (com paginação):
│  ├─ Users (role, status, last_login)
│  ├─ Escalas (mes, status, actions)
│  └─ Transactions (últimas 10)
│
├─ Charts (recharts):
│  ├─ Turnos por tipo (manha/tarde/noite)
│  ├─ Folgas distribuição
│  └─ Activity (últimos 7 dias)
│
└─ Ações:
   ├─ Invite user (form modal)
   ├─ Disable user (toggle)
   ├─ Download escalas (PDF + XLSX)
   └─ Change plan (modal)

Tempo: 12-14 horas
Prioridade: ⚠️  RECOMENDADO (semana 3)
```

#### 📋 Prompt 7: Gerar Escalas Automáticas (Existente)

**Status:** ✅ IMPLEMENTADO (gerarEscala.ts)

```
Algoritmo já funciona:

✅ Rotação por deslocamento (não round-robin)
✅ Evita noites consecutivas (max 2)
✅ Folga rules (min 6, max 8 dias)
✅ Distribuição uniforme

USE: Como está em gerarEscala.ts
TESTES: Já passam (gerador não retorna 31 noites seguidas)
DOCS: Comentários explicam a fórmula

Se precisar ADAPTAR:
└─ Mudar regra folga (ex: min 5 em vez de 6)
└─ Novo padrão (ex: prioridade fim de semana)
└─ Teste antes de usar
```

#### ✅ Prompt 8: Stripe Checkout (Existente)

**Status:** MVP funcional (create-checkout-session funciona)

```
Fluxo atual funciona:

✅ Stripe.js integration (PaymentElement)
✅ Create session → Checkout modal
✅ confirmPayment() → handle success/error
✅ Webhook updates DB
✅ Email confirmação (Resend não, mas Stripe sends)

GARANTIR:
├─ CSP header cobrindo o checkout (ver Prompt 3, CSRF não se aplica aqui)
├─ Audit log transação (logging existe)
└─ Error handling (Sentry, ver Prompt 4)

USA: Como está, mas com security fixes acima
```

#### 📋 Prompt 9: Email Transacionais (Resend)

**Status:** NÃO IMPLEMENTADO (nice-to-have semana 3)

```
Add email transacionais via Resend:

EVENTOS:
├─ Novo turno atribuído
├─ Escala publicada
├─ Pagamento confirmado
├─ Convite para hospital
└─ Password reset (já vem Supabase)

TEMPLATE:
├─ HTML profissional
├─ Branding consistent
├─ CTA botão com link
├─ Mobile responsive

TESTE:
└─ Dispara evento → email chega em 2-3 seg

Tempo: 8-10 horas
Prioridade: 📋 NICE-TO-HAVE (semana 3)
```

#### 📋 Prompt 10: Export XLSX

**Status:** NÃO IMPLEMENTADO (funciona PDF, não XLSX)

```
Add export XLSX (PDF já existe):

USAR: xlsx library (npm install xlsx)
IMPLENTA:
├─ EscalaDetailPage → botão "Download XLSX"
├─ Criar worksheet com dados escalas
├─ Format: coluna data, turnos, user names
├─ Download automático

TESTE:
└─ Gerar XLSX → abrir Excel → dados OK

Tempo: 4-5 horas
Prioridade: 📋 NICE-TO-HAVE (semana 3)
```

---

## 🧪 TESTING & VALIDATION

### Cada Prompt Inclui Teste Atômico

```
EXEMPLO: Criptografia CPF

ANTES DE COMEÇAR:
├─ Resetar DB (migrations fresh)
├─ Preparar credenciais Supabase
└─ Abrir console (F12) pronto

IMPLEMENTAR:
├─ encryption-service.ts
├─ Adicionar import em users.ts
├─ Função create() chama encrypt()

TESTAR (não pular):
1️⃣  Criar user via signup com CPF "111.222.333-44"
2️⃣  Verificar DB:
    SELECT cpf_encrypted FROM users WHERE email = '...';
    → deve RETORNAR: algo como "U2FsdGVkX1..." (encrypted)
3️⃣  Logout + login como admin
4️⃣  Verificar audit_logs:
    SELECT * FROM audit_logs 
    WHERE action = 'read' AND table_name = 'users';
    → deve RETORNAR: entry mostrando quem acessou
5️⃣  Testar decrypt (função retorna plaintext)
6️⃣  Testar masking UI (mostra "***.***.***-**")

RESULTADO:
✅ Se tudo passou → "COMPLETO: Criptografia CPF"
❌ Se falhou → "FALHOU: [erro exato] → Corrigindo..."
   └─ Retestar após fix
```

### Política: Uma Coisa Por Vez

```
NÃO FAÇA:
❌ Implementar criptografia + CSP/XSS + Sentry juntos
❌ "Faço tudo e testo depois"
❌ Assume que "deve funcionar"

FAÇA:
✅ Criptografia completo (plan + implement + test + validate)
✅ ENTÃO CSP/XSS (não antes)
✅ ENTÃO Sentry (não antes)
✅ Cada feature 100% pronta antes de próxima
```

---

## 📝 CHECKLIST: Priority Order

```
🔴 FASE 1 (Semanas 1-2 - Compliance Crítico)
   ☑ Prompt 2: Rate Limiting de Login (~2h, concluído)
   ☑ Prompt 3: CSP Headers + Auditoria XSS (~30min, concluído, substitui CSRF Tokens)
   ☐ Prompt 4: Sentry Integration (3-4h)
   ☐ Prompt 5: Criptografia CPF (8-10h)
   ├─ Total restante: ~11-14 horas
   └─ Resultado: Pronto para produção real

⚠️  FASE 2 (Semanas 3-4 - Features)
   ☐ Prompt 6: Dashboard Admin (12-14h)
   ☐ Prompt 9: Email Transacionais (8-10h)
   ☐ Prompt 10: Export XLSX (4-5h)
   ├─ Total: ~24-29 horas
   └─ Resultado: App robusto + completo

📋 PHASE 3 (Mês 2+ - Scale)
   ☐ React Native App (60-80h)
   ☐ Integrações (40-50h each)
   ☐ Analytics (20-25h)
```

---

## 📞 Workflow: Começar Agora

### Passo 1: Escolha Prompt Phase 1

```bash
# Abra Claude Code
claude-code

# Cole UMA TAREFA (ex: Prompt 2 Rate Limiting)
# Não misture, uma por vez

# Claude Code vai:
# 1. Plan (passos testáveis)
# 2. Implement (código)
# 3. Test (atomicamente)
# 4. Report: "✅ COMPLETO" ou "❌ FALHOU"
```

### Passo 2: Validar com Testes

```bash
# Após cada prompt implementado:

# Teste 1: Type check
npm run type-check
# Resultado: "No errors" ou específico

# Teste 2: Dev server
npm run dev
# Abre browser, exercita feature, verifica console

# Teste 3: Build
npm run build
# Sem erros? Pronto pra Vercel

# Teste 4: Supabase (se SQL/RLS)
npx supabase db pull
# Ver schema atualizado
SELECT * FROM ... (validar dados)

# Teste 5: Deploy Vercel (se crítico)
git push origin feature-branch
# Vercel build automático
# Validar em preview URL
```

### Passo 3: Report & Próximo

```
Quando terminar prompt:

REPORTE:
├─ [FEATURE] Implementado: [descrição]
├─ [TESTE] Status: ✅ Passou / ❌ Falhou
├─ [TEMPO] Horas gastas: X.Xh
├─ [BLOQUEADOR?] Sim/Não
└─ [PRÓXIMO] Sugestão: Prompt N

EXEMPLO (real, já executado):
├─ [Rate Limiting] Implementado: 5 tentativas/10min login
├─ [TESTE] Status: ✅ Passou (6º login retorna 429)
├─ [TEMPO] Horas gastas: ~2h
├─ [BLOQUEADOR?] Não (próximo não depende)
└─ [PRÓXIMO] Sugestão: CSP Headers + Auditoria XSS (Prompt 3)
```

---

## 🚨 Se Algo Quebrar

```
PROTOCOLO:
1. NÃO prosseguir (para tudo)
2. Reproduzir erro (passos exatos)
3. Investigar root cause (logs, console, BD)
4. Corrigir código (ou config)
5. Retestar até passar
6. SÓ ENTÃO próxima tarefa

COMUM:
❌ "npm run dev" errando
   → npm install (limpar cache)
   → rm -rf node_modules + reinstalar

❌ "Supabase connection failed"
   → .env.local keys corretas?
   → Internet funcionando?
   → Projeto online no dashboard?

❌ "TypeScript error TS2345"
   → Ler erro completo (linha + tipo)
   → Validate contra types/index.ts
   → Fix type mismatch

❌ "RLS denied"
   → Normal sem auth
   → Login para ter permissões
   → Verificar role no users table
```

---

## 📊 Status Summary

```
MVP Funcional (Today):          ✅ 1.910+ linhas em produção
Segurança Crítica (Semanas 1-2): 🔴 2 features restantes (rate limiting + CSP/XSS ✅ concluídos)
Admin + Features (Semanas 3-4):  ⚠️  3 features parciais
Scale (Mês 2+):                  📋 Roadmap aberto

Total Horas Fase 1 Restante:   ~11-14h (compliance)
Total Horas Fase 2:            ~24-29h (features)

Pronto para Produção Real?      ❌ Não (sem compliance)
Pronto Após Phase 1?            ✅ Sim (com compliance)
```

---

**Versão:** 2.0 (Realista)  
**Última Atualização:** 2026-07-02  
**Auditoria Baseada em:** Commit 09dfcc0  
**Garantia de Qualidade:** Política de Zero Erros + Testes Atomicamente