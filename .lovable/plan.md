## Objetivo

No kickoff de cada jogo, o sistema gera automaticamente um arquivo `.xlsx` com todos os palpites daquele jogo e disponibiliza para **download na aba Admin**. Sem envio de email.

## Como vai funcionar

```text
[cron a cada 1 min]
        │
        ▼
[edge function: export-match-predictions]
        │
        ├── busca jogos com kickoff_at <= now() ainda não exportados
        ├── para cada jogo:
        │     ├── lê palpites + nome do usuário
        │     ├── gera .xlsx em memória
        │     ├── faz upload no bucket privado match-exports
        │     └── registra em match_export_log
        ▼
[aba Admin → seção "Planilhas de palpites"]
        │
        └── lista jogos exportados + botão Baixar (signed URL na hora)
```

## Conteúdo da planilha

Cabeçalho com identificação do jogo + tabela de palpites:

| Jogo nº | 12 |
|---|---|
| Partida | Brasil x Argentina |
| Kickoff | 15/06/2026 16:00 (Brasília) |

| Usuário | Palpite | Horário do palpite |
|---|---|---|
| João Silva | 2 x 1 | 14/06/2026 22:34 |
| Maria Souza | 1 x 1 | 15/06/2026 09:12 |

Nome do arquivo: `palpites-jogo-12-BRA-vs-ARG.xlsx`

## Implementação técnica

### 1. Migração (schema)
- Tabela `match_export_log`: `match_id` (PK, FK matches), `exported_at`, `storage_path`, `row_count`.
- RLS: somente admins leem; edge function escreve via service role.
- Bucket privado `match-exports` (storage) + policies: somente admins listam/leem; service role escreve.

### 2. Edge function `export-match-predictions`
- Sem auth (chamada via cron). Em código, valida que vem do cron via header secreto OU simplesmente roda idempotente.
- Query: jogos com `kickoff_at <= now()` AND `id NOT IN (select match_id from match_export_log)`.
- Para cada jogo:
  - Busca `match_predictions` + `profiles.display_name` + dados do jogo (`v_matches_with_teams`).
  - Gera `.xlsx` usando `npm:exceljs`.
  - Faz upload em `match-exports/<match_number>-<HOMECODE>-vs-<AWAYCODE>.xlsx`.
  - Insere em `match_export_log`.

### 3. Edge function `get-match-export-url`
- Valida JWT + `has_role(admin)`.
- Recebe `match_id`, gera signed URL de 1 hora para o arquivo correspondente e retorna.

### 4. Edge function `regenerate-match-export` (admin)
- Valida JWT + admin.
- Recebe `match_id`, regenera o `.xlsx` (sobrescreve no storage), atualiza `match_export_log`.

### 5. Cron job (1 min)
SQL via `cron.schedule` + `net.http_post` chamando `export-match-predictions`. Inserido via tool de SQL (não migration), pois contém URL/anon key específicos.

### 6. UI — nova seção na aba Admin
Em `src/pages/AdminPage.tsx`, adicionar **"Planilhas de palpites por jogo"**:
- Hook `useMatchExports()` que lê `match_export_log` JOIN com `v_matches_with_teams`, ordenado por `kickoff_at DESC`.
- Lista cada jogo exportado com: nº, "Time A x Time B", kickoff formatado, qtd. palpites, botão **Baixar** (chama `get-match-export-url` e abre o link) e botão **Regenerar** (chama `regenerate-match-export`).
- i18n: chaves novas em `pt/en/es/fr` (`admin.exports.*`).

## Observações
- Nada é enviado por email — tudo fica disponível dentro do app.
- O bucket é privado; downloads exigem signed URL gerada server-side após validação de admin.
- Idempotente: se o cron rodar duas vezes, o segundo run ignora jogos já em `match_export_log`.

Posso começar?
