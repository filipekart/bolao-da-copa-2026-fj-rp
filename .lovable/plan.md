## Objetivo

Após o fechamento das apostas de cada jogo (kickoff), o sistema gera automaticamente um arquivo **Excel (.xlsx)** com todos os palpites daquele jogo e envia por email para **filipekart@gmail.com**.

## Como vai funcionar

```text
[cron a cada 1 min]
        │
        ▼
[edge function: export-match-predictions]
        │
        ├── busca jogos com kickoff_at <= now() e ainda não exportados
        ├── para cada jogo:
        │     ├── lê todos palpites + nome do usuário
        │     ├── gera planilha Excel em memória
        │     ├── envia email com anexo p/ filipekart@gmail.com
        │     └── marca jogo como exportado (tabela de controle)
        ▼
   [email entregue]
```

## Conteúdo da planilha

Uma planilha por jogo, com cabeçalho identificando a partida e tabela de palpites:

| Cabeçalho | |
|---|---|
| Jogo nº | 12 |
| Partida | Brasil x Argentina |
| Kickoff | 15/06/2026 16:00 (Brasília) |

| Usuário | Palpite | Horário do palpite |
|---|---|---|
| João Silva | 2 x 1 | 14/06/2026 22:34 |
| Maria Souza | 1 x 1 | 15/06/2026 09:12 |
| ... | ... | ... |

Nome do arquivo: `palpites-jogo-12-BRA-vs-ARG.xlsx`
Assunto do email: `Palpites Jogo 12 — Brasil x Argentina`

## Implementação técnica

### 1. Tabela de controle (migration)
Nova tabela `match_export_log` para evitar reenvios duplicados:
- `match_id` (PK), `exported_at`, `email_message_id`
- RLS: somente admins leem; edge function escreve via service role.

### 2. Infraestrutura de email
- Configurar domínio de email da Lovable (botão de setup) — necessário para envio com anexo.
- Provisionar a infraestrutura de emails (filas + dispatcher).
- Criar função de envio transacional `send-match-export-email` baseada nos templates da Lovable, mas com suporte a **anexo .xlsx** (a Lovable Email não suporta anexos nativamente, então usaremos o connector **Resend** que aceita anexos — o usuário precisará confirmar/conectar Resend, OU optaremos pelo workaround abaixo).

> **Decisão necessária sobre anexo:** A infra padrão da Lovable Email não envia anexos. Duas opções:
> - **(A) Conectar Resend** (gratuito até 3.000 emails/mês) — envia o .xlsx como anexo real.
> - **(B) Lovable Email + link de download** — fazemos upload do .xlsx para o Storage e enviamos email com link "Baixar planilha". Sem necessidade de serviço externo.
>
> Recomendo **(B)** pela simplicidade. Confirme antes de implementar.

### 3. Edge function `export-match-predictions`
- Roda a cada 1 min via `pg_cron`.
- Query: jogos com `kickoff_at <= now()` AND `id NOT IN (select match_id from match_export_log)`.
- Para cada jogo:
  - Busca `match_predictions` + `profiles.display_name`.
  - Gera .xlsx usando biblioteca Deno (`https://deno.land/x/excelize` ou similar).
  - Faz upload para Supabase Storage (bucket privado `match-exports`) e gera signed URL de 90 dias.
  - Envia email com link de download.
  - Insere em `match_export_log`.

### 4. Cron job
SQL que agenda a função a cada 1 min (via tabela `cron.job` + `net.http_post`).

### 5. Cobertura de jogos antigos
Se o admin quiser, adicionamos um botão na aba Admin **"Reenviar planilha de jogo X"** para gerar novamente o arquivo de qualquer jogo passado (sem marcar duplicado).

## O que vou pedir antes de começar a implementar

1. **Anexo real (Resend) ou link de download (Lovable Email)?**
2. Confirmar email único: `filipekart@gmail.com` (você mencionou 2 admins mas só passou 1 — adiciona outro?).

Após sua aprovação do plano e dessas duas confirmações, implemento tudo de uma vez.