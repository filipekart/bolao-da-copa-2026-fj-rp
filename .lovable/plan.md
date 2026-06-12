## Objetivo

Fechar as 2 sugestões pendentes da última rodada de melhorias no push de lembretes:
- Logs de auditoria (quantos extras/matches enviados, para quem).
- Dedupe via tabela `notification_log` para evitar reenvio se a função cron rodar duas vezes na mesma janela.

## Mudanças

### 1. Nova tabela `notification_log` (migration)

Schema mínimo para registrar cada push enviado e servir de chave de dedupe.

```text
notification_log
├─ id          uuid pk default gen_random_uuid()
├─ user_id     uuid not null references auth.users(id) on delete cascade
├─ kind        text not null         -- 'match' | 'extras'
├─ ref_key     text not null         -- match_id ou 'extras'
├─ window_label text not null        -- '1 hora' | '10 minutos'
├─ sent_at     timestamptz default now()
└─ UNIQUE (user_id, kind, ref_key, window_label)
```

- RLS ligada, nenhuma policy para `anon`/`authenticated` (uso interno do edge function via service_role).
- GRANT ALL para `service_role`.

### 2. Atualizar `supabase/functions/send-push-reminders/index.ts`

- Antes de enfileirar cada push (match ou extras), consultar `notification_log` e pular usuários que já têm registro `(user_id, kind, ref_key, window_label)`.
- Após cada envio bem-sucedido, inserir em `notification_log` (batch insert no fim, com `on conflict do nothing` para segurança).
- Adicionar `console.log` no fim com: total candidatos, enviados de match, enviados de extras, expirados, deduplicados.

### 3. Sem mudanças em UI ou outras funções

Apenas o edge function `send-push-reminders` e a nova tabela. `send-match-push` (envio manual pelo admin) continua sem dedupe, por ser disparo intencional.

## Detalhes técnicos

- `window_label` usa as mesmas strings já existentes (`'1 hora'`, `'10 minutos'`) para casar com o `tag` do payload.
- `ref_key` é `match.id` para lembrete de jogo e a constante `'extras'` para o lembrete de Campeão/Artilheiro/MVP (uma entrada por janela, independente de quais extras faltam).
- Dedupe é por **usuário + janela**, não por subscription — evita reenviar quando o mesmo usuário tem múltiplos devices, mas continua mandando para todos os devices na primeira vez.
- Insert em lote ao final, agrupando só os `(userId, kind, ref_key, window_label)` cujos pushes retornaram `ok: true`.

## Resultado esperado

- Cron pode rodar a cada minuto sem risco de spam: cada usuário recebe no máximo 1 push por janela.
- Logs no painel mostram contagem clara por execução, facilitando diagnóstico futuro.
