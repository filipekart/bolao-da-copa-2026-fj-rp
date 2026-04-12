

## Plan: Remover a trava de 5 horas — liberar palpites e estatísticas para sempre após o kickoff

### Por que não afeta performance
- A RLS faz lookup por PK (`m.id = match_id`) — O(1)
- Max ~300 rows por partida, consultadas uma de cada vez
- Cache no cliente (staleTime) já reduz requisições

### Mudanças

**1. Migration — Atualizar RLS policy**
- Drop policy `"users read predictions after kickoff"`
- Criar nova policy simplificada:
```sql
CREATE POLICY "users read predictions after kickoff"
ON public.match_predictions FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
      AND now() >= m.kickoff_at
    )
  )
);
```

**2. Código — Simplificar `isMatchRevealed`** (`src/lib/matchVisibility.ts`)
- Remover o limite de 5 horas, tornando-a equivalente a `isMatchVisible`:
```typescript
export function isMatchRevealed(match: MatchWithTeams): boolean {
  return Date.now() >= new Date(match.kickoff_at).getTime();
}
```

**3. Código — Simplificar condição no MatchDetailPage** (`src/pages/MatchDetailPage.tsx`)
- Com `isMatchRevealed` sem limite, a linha `const revealed = isMatchRevealed(match) || isFinished` pode ser simplificada para apenas `isMatchRevealed(match)` (já que `isFinished` implica que o kickoff passou)

Nenhuma outra mudança necessária. Os hooks `useMatchPredictions` e `useMatchStats` continuam funcionando igual.

