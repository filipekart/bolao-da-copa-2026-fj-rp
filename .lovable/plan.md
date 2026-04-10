

## Unificar Notificações de Lembretes

### Problema
Dois sistemas independentes enviam lembretes de apostas pendentes:
1. **`useMatchReminders` (cliente)** — polling a cada 2 min, usa `new Notification()`, só funciona com aba aberta
2. **Edge Function `send-push-reminders` (servidor)** — via cron + Web Push, funciona com browser fechado

Resultado: usuários com aba aberta + push ativo recebem notificação duplicada.

### Solução
Modificar `useMatchReminders` para verificar se o usuário tem push subscription ativa. Se tiver, o hook **não dispara** notificações — delega tudo ao Web Push via service worker. O hook só atua como fallback para quem não tem push ativo.

### Mudanças

**Arquivo: `src/hooks/useMatchReminders.ts`**
- Antes de disparar notificações, verificar se existe uma PushSubscription ativa no service worker (`registration.pushManager.getSubscription()`)
- Se existir subscription ativa → skip (o servidor cuida via Web Push)
- Se não existir → manter comportamento atual como fallback

A verificação é feita uma vez por ciclo de check, usando `navigator.serviceWorker.ready` + `getSubscription()`. Isso é leve e não requer chamada ao banco.

```text
checkReminders():
  1. SW registrado? → getSubscription()
  2. subscription !== null → return (Web Push cuidará)
  3. subscription === null → continuar com new Notification() (fallback)
```

### Impacto
- Sem mudanças no banco de dados
- Sem mudanças na Edge Function
- Apenas 1 arquivo modificado: `useMatchReminders.ts`
- Zero risco de quebra — se a verificação falhar, o fallback continua funcionando

