

## Paralelizar envio de Push Notifications

### Problema
Os dois loops de envio (match reminders e extras reminders) usam `await` sequencial dentro de loops aninhados. Com 300 usuários e múltiplos jogos, centenas de requests HTTP sequenciais podem causar timeout na Edge Function.

### Mudanças

**Arquivo: `supabase/functions/send-push-reminders/index.ts`**

**1. Match reminders (linhas 176-218)** — Substituir os loops com `await` sequencial por coleta de promises + `Promise.allSettled`:

```typescript
const pushPromises: Promise<{ ok: boolean; endpoint: string }>[] = [];

for (const match of matches) {
  // ... timeLabel logic stays the same ...
  for (const [userId, subs] of subsByUser) {
    if (predictionSet.has(`${userId}:${match.id}`)) continue;
    const payload = JSON.stringify({ ... });
    for (const sub of subs) {
      pushPromises.push(
        sendWebPush(sub, payload, ...).then(ok => ({ ok, endpoint: sub.endpoint }))
          .catch(() => ({ ok: false, endpoint: sub.endpoint }))
      );
    }
  }
}

const results = await Promise.allSettled(pushPromises);
for (const r of results) {
  if (r.status === 'fulfilled') {
    if (r.value.ok) sent++;
    else expiredEndpoints.push(r.value.endpoint);
  }
}
```

**2. Extras reminders (linhas 262-296)** — Mesma transformação: coletar promises e resolver com `Promise.allSettled`.

### Impacto
- Centenas de requests HTTP sequenciais passam a ser paralelas
- Tempo total cai de soma de latências para max de latências
- Elimina risco de timeout na Edge Function
- Nenhuma mudança na lógica de negócio ou na API

