# Ranking público com token

Criar uma rota pública `/r/:token` que mostra **posição, nome e pontos** de todos os usuários aprovados, sem login, com atualização em tempo real. O acesso é validado por um token na URL — fácil de revogar.

## O que será feito

### 1. Tabela `public_ranking_tokens` (migration)
Guarda tokens válidos. Admin pode criar/revogar pelo painel (fora deste plano — por enquanto, criamos 1 token manualmente via SQL).

Colunas: `token` (text, PK), `label` (text), `is_active` (bool), `created_at`.

RLS: nenhum acesso direto do cliente. Apenas a edge function lê (via service_role).

### 2. Edge function pública `public-ranking`
- `verify_jwt = false` (config.toml).
- Recebe `?token=xxx`.
- Valida contra `public_ranking_tokens` (is_active = true). Inválido → 401.
- Roda `get_general_ranking()`, filtra aprovados, ordena por `points_total DESC, exact_hits DESC, display_name ASC`, aplica a numeração 1,1,1,4 (`computePositions`).
- Retorna JSON `[{ position, name, points }]`.
- CORS aberto.

### 3. Página pública `/r/:token` (React)
- Rota nova em `src/App.tsx`, **sem AppLayout** (sem header/menu), sem auth.
- Componente `PublicRankingPage`:
  - Pega `token` da URL.
  - `useQuery` chamando a edge function a cada **30s** (refetchInterval) — simples e suficiente. Não usa Realtime do banco porque o ranking só muda quando admin reprocessa, não por mudanças individuais.
  - Mostra tabela minimalista: 3 colunas (Posição, Nome, Pontos), mesmo visual dark/dourado do app.
  - Token inválido → mensagem "Link expirado ou inválido".
- SEO: `<title>` "Ranking — Bolão FJ | RP", `<meta name="robots" content="noindex">`.

### 4. Criação do primeiro token
Via SQL no migration: `INSERT INTO public_ranking_tokens (token, label) VALUES ('<token-aleatório-32-chars>', 'Link público inicial');`

Link final entregue: `https://bolao-da-copa-2026-fj-rp.lovable.app/r/<token>`

## O que NÃO muda
- Nenhuma RPC existente.
- Nenhuma lógica de scoring, sort ou ranking interno.
- Página `/ranking` autenticada continua igual.

## Detalhes técnicos
- A função `computePositions` (já existe em `src/lib/rankingPositions.ts`) é replicada inline na edge function (TS puro, 10 linhas).
- Edge function usa `SUPABASE_SERVICE_ROLE_KEY` para validar token e chamar a RPC.
- Polling de 30s = ~2880 req/dia por viewer aberto. Aceitável.

## Verificação
- Abrir `/r/<token>` em aba anônima → ranking carrega sem login.
- Trocar token → "Link inválido".
- Atualizar pontuação (admin scoring) → próximo refresh (≤30s) reflete na página.
- Empates exibem 1,1,1,4 corretamente.

## Pendência para você confirmar
- OK com **polling de 30s** ou prefere Realtime de verdade (subscribe em `leaderboard`)? Polling é mais simples e barato; Realtime atualiza no instante mas adiciona conexão WS por viewer.
