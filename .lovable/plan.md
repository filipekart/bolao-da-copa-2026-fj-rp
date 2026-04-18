
## Problema

Hoje na tab "Jogos" todos os placares começam em `0 × 0`, e ao salvar um grupo, **todos** os jogos não-bloqueados são enviados ao RPC `submit_match_prediction` — mesmo os que o usuário não tocou. Resultado: jogos não intencionais ficam gravados como `0 × 0`.

## Solução proposta

Tratar o placar como "vazio" (`null`) até o usuário interagir, exibir em branco na UI, e só enviar ao backend os jogos **explicitamente preenchidos**.

### Mudanças (apenas `src/pages/HomePage.tsx`)

**1. Tipo `Scores`** — aceitar valores nulos:
```ts
type Scores = Record<string, { home: number | null; away: number | null }>;
```

**2. Inicialização (linhas 329-340)** — jogos sem palpite começam vazios:
```ts
initial[m.id] = pred
  ? { home: pred.predicted_home_score, away: pred.predicted_away_score }
  : { home: null, away: null };
```

**3. `MatchRow` (linhas 24-98)** — exibir vazio quando `null`, e tornar os botões `+`/`−` "iniciadores":
- Display: se `null` mostrar `–` (ou string vazia) em vez de `0`
- Botão `+` no lado vazio → vira `1`; botão `−` → vira `0`
- Standings preditas continuam tratando `null` como `0` (apenas para cálculo visual)

**4. Cálculo de standings preditas (linhas 192-198)** — usar `0` como fallback apenas para o cálculo (sem alterar o estado):
```ts
homeScore: scores[m.id]?.home ?? 0,
awayScore: scores[m.id]?.away ?? 0,
```
(já é assim — fica igual)

**5. `handleSaveGroup` (linhas 419-429)** — filtrar jogos não preenchidos:
```ts
.filter(m => new Date(m.kickoff_at) > now)
.filter(m => {
  const s = scores[m.id];
  return s && s.home !== null && s.away !== null;
})
.map(m => {
  const s = scores[m.id]!;
  return supabase.rpc('submit_match_prediction', {
    p_match_id: m.id,
    p_predicted_home_score: s.home,
    p_predicted_away_score: s.away,
    ...
  });
});
```
Se nenhum jogo foi preenchido, mostrar toast informativo (`t('home.nothingToSave')`) em vez de chamar o RPC.

**6. Lógica `allHavePredictions`** — continua usando `existingPredictionIds` (vem do banco), então não muda.

**7. i18n** — adicionar chave `home.nothingToSave` em pt/en/es/fr ("Nenhum palpite preenchido para salvar.").

### Observações

- **Edição de palpite existente:** se o jogo já tem palpite salvo, ele aparece com os valores reais (não vazio), então o usuário pode editar normalmente.
- **Backend não muda.** O RPC `submit_match_prediction` continua exigindo home/away — apenas deixamos de chamá-lo para jogos vazios.
- **Auto-derivação de mata-mata** (`deriveAndSaveKnockoutPredictions`) continua rodando após save; ela só dispara quando todos os grupos têm palpites completos no banco, então segue correta.
