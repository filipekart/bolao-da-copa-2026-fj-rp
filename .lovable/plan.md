

## Unificar queries de extras em uma única chamada

### Problema
Nas linhas 241-248, duas queries separadas buscam dados de `extra_predictions` e `knockout_predictions` para montar os lembretes de extras. São dois roundtrips ao banco que podem ser consolidados em um.

### Solução
Criar uma database function (RPC) que retorna, para cada usuário, quais categorias de extras já foram preenchidas — unificando champion (de `knockout_predictions`) com top_scorer/mvp (de `extra_predictions`) numa só query.

### Mudanças

**1. Migration: criar função `get_extras_completion`**

```sql
CREATE OR REPLACE FUNCTION public.get_extras_completion()
RETURNS TABLE(user_id uuid, category text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, category
  FROM public.extra_predictions
  WHERE category IN ('top_scorer', 'mvp')

  UNION ALL

  SELECT user_id, 'champion'::text AS category
  FROM public.knockout_predictions
  WHERE stage = 'CHAMPION'
$$;
```

**2. Edge function: substituir as duas queries por uma**

Em `supabase/functions/send-push-reminders/index.ts`, linhas 241-252, trocar:

```typescript
// Antes: duas queries
const { data: extraPreds } = await supabase.from('extra_predictions')...
const { data: championPreds } = await supabase.from('knockout_predictions')...
```

Por:

```typescript
// Depois: uma RPC
const { data: completions } = await supabase.rpc('get_extras_completion');
const extraSet = new Set(
  (completions ?? []).map((c: any) => `${c.user_id}:${c.category}`)
);
```

E ajustar as verificações de missing (linhas 261-264) para usar `extraSet` para as três categorias:

```typescript
if (!extraSet.has(`${userId}:champion`)) missing.push(missingLabels.champion);
if (!extraSet.has(`${userId}:top_scorer`)) missing.push(missingLabels.top_scorer);
if (!extraSet.has(`${userId}:mvp`)) missing.push(missingLabels.mvp);
```

Removendo o `championSet` separado.

### Impacto
- 2 queries → 1 RPC call (1 roundtrip a menos)
- Lógica simplificada com um único Set para todas as categorias
- Sem mudança na lógica de negócio

