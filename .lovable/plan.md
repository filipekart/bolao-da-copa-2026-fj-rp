## Escopo

Aplicar **apenas na aba "Ranking Geral"** (tab `geral`). As demais abas (Grupos, Rodadas, Mata-mata, Personalizados) continuam como estão. Comportamento atual de busca e "Encontre-me" preservado.

## UX

**Linha compacta (clicável):**

```
[pos] [nome truncado]            [PE: X] [🏆 bandeira] [pontos]
```

- `PE: X` vira um badge compacto (ao invés do texto solto atual).
- Bandeira do campeão aparece apenas se `extrasRevealed || isMe`.
- Artilheiro/MVP saem da linha compacta — vão para o dropdown.
- Indicador visual: chevron que rotaciona ao expandir.

**Dropdown expandido (lazy):**

- Artilheiro: nome + bandeira do time (se `extrasRevealed || isMe`, senão "—" ou oculto).
- MVP: idem.
- Lista de placares exatos: cada item mostra `Time A [bandeira] X x Y [bandeira] Time B` + label da rodada/fase (ex.: "Rodada 1", "Oitavas"). Loading spinner enquanto carrega.
- Estado vazio: "Nenhum placar exato ainda".

**Comportamento:**

- Estado local `expandedUserId: string | null` no `RankingList`. Só um aberto por vez (abrir outro fecha o anterior).
- Dados dos acertos buscados via `useQuery` por user_id, ativado apenas quando expandido (`enabled: expandedUserId === entry.user_id`), com cache.

## Backend

**Nova RPC `get_user_exact_hits(p_user_id uuid)`** — `SECURITY DEFINER`, `STABLE`, `search_path = public`:

Retorna:
- `match_id uuid`
- `match_number int`
- `stage match_stage`
- `kickoff_at timestamptz`
- `home_team_name text`, `home_flag_url text`
- `away_team_name text`, `away_flag_url text`
- `official_home_score int`, `official_away_score int`

Filtros: somente `match_predictions` onde `rule_applied = 'EXACT_SCORE'` E partida `FINISHED` E `user_id = p_user_id`. Ordenado por `match_number`.

A RPC em si **não precisa checar `extrasRevealed`** (placares exatos são públicos por natureza). A trava de extras (artilheiro/MVP/campeão) acontece na RPC de ranking que já existe — mas o requisito do usuário pede revelação respeitada no backend. Para cumprir:

**Atualizar `get_general_ranking`** para zerar `top_scorer_name/flag`, `mvp_name/flag` e `champion_team_name/flag` para usuários ≠ `auth.uid()` quando `is_tournament_open() = true`. Hoje isso é feito só no front — passa a ser feito no servidor também (defense-in-depth). O check `extrasRevealed` no front continua para o caso de cache.

**Índice de performance:**

`match_predictions(user_id, match_id)` — verificar se já existe (geralmente há uma UNIQUE `(user_id, match_id)`); se sim, dispensa novo índice. Caso contrário, criar.

## Frontend

**`src/hooks/useUserExactHits.ts`** (novo): hook que recebe `userId` e `enabled`, chama a RPC, cache 5min.

**`src/pages/RankingPage.tsx`**:
- Adicionar prop/state `expandedUserId` + `setExpandedUserId` no `RankingList`.
- Converter linha em `<button>` com `aria-expanded`.
- Mover Artilheiro/MVP para bloco expandido.
- Renderizar `PE: X` como badge compacto.
- Renderizar lista de acertos via subcomponente `UserExactHitsList` que dispara `useUserExactHits` apenas quando montado.

**i18n** (pt/en/es/fr): chaves novas
- `ranking.exactHitsList` ("Placares exatos")
- `ranking.noExactHits` ("Nenhum placar exato")
- `ranking.loadingHits` ("Carregando...")
- Labels de stage já existem em `tournament.stage.*`.

## Pontos a confirmar

1. **Linha compacta — bandeira do campeão**: deve aparecer no compacto para todos quando `extrasRevealed`, ou sempre só para `isMe` antes da Copa começar?  → Plano atual: respeita `extrasRevealed || isMe`.
2. **Mostrar data/rodada no item de acerto exato**: sim, label curto tipo "R1", "Oitavas". OK?
3. **Sem `extrasRevealed`**: no dropdown, ocultar totalmente as linhas de Artilheiro/MVP de terceiros, ou mostrar com "—"?  → Plano: ocultar totalmente.

Aguardando seu OK.
