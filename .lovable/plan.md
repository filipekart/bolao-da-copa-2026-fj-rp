

## Otimização: score_finished_matches()

### Situação Atual
A função já filtra por `mp.scored_at IS NULL OR m.updated_at > mp.scored_at`, o que evita re-pontuar predições de jogos que não mudaram. Isso é melhor que `rule_applied = 'PENDING'` porque permite re-pontuar quando o admin corrige um resultado.

### Problema Real
O bloco de "reset" no início da função faz UPDATE em todas as predições de jogos não-finalizados que já foram pontuadas — isso pode incluir rows desnecessárias. Além disso, o `matches.updated_at` precisa ser atualizado corretamente quando o placar muda (via trigger).

### Plano

**1. Migration SQL** — Verificar e garantir que o trigger `set_updated_at` está ativo na tabela `matches`, para que `m.updated_at` reflita mudanças de placar. Se não estiver, criar o trigger.

**2. Nenhuma mudança na lógica de scoring** — O filtro atual `(mp.scored_at IS NULL OR m.updated_at > mp.scored_at)` já é a abordagem correta e eficiente. Não usar `rule_applied = 'PENDING'` pois quebraria re-cálculo após correção de placar.

### Por que NÃO usar `rule_applied = 'PENDING'`
- Se o admin insere placar errado (3x1), as predições são pontuadas
- Admin corrige para 2x1 — `rule_applied` já é `RESULT_ONLY` ou similar
- Com filtro `PENDING`, essas predições **nunca seriam recalculadas**
- O filtro por `scored_at vs updated_at` resolve isso corretamente

### Conclusão
A função já está otimizada para o cenário descrito. A única verificação necessária é confirmar que o trigger `set_updated_at` existe na tabela `matches`.

