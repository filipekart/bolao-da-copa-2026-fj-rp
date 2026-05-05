# Painel Admin: Registrar Resultados de Extras

## Problema
A função de pontuação (`refresh_leaderboard`) já sabe pontuar Campeão (100 pts), Artilheiro (50 pts) e MVP (50 pts) — mas hoje **não existe interface** para o admin registrar quem foram os vencedores oficiais. Os dados precisam ir parar em:

- `knockout_results` (stage = `CHAMPION`, team_id) → para o Campeão
- `extra_predictions` (category = `top_scorer_result`, player_name + team_id) → para o Artilheiro
- `extra_predictions` (category = `mvp_result`, player_name + team_id) → para o MVP

## O que vou construir

Adicionar uma nova aba/seção no `AdminPage.tsx` chamada **"Resultados Extras"** com 3 cards:

### 1. Campeão Oficial
- Dropdown com a lista de times (`teams`)
- Botão "Salvar Campeão"
- Mostra o time atualmente registrado (com bandeira)
- Botão "Limpar" para apagar o resultado

### 2. Artilheiro Oficial
- Campo de texto para o nome do jogador
- Dropdown opcional do time (para mostrar bandeira no ranking)
- Botão "Salvar Artilheiro"
- Mostra o jogador atualmente registrado
- Botão "Limpar"

### 3. MVP Oficial
- Mesmo padrão do artilheiro (nome + time opcional)
- Botão "Salvar MVP"
- Mostra o MVP atual + botão "Limpar"

Após salvar qualquer resultado, dispara automaticamente `refresh_leaderboard` para recalcular as pontuações de todos os usuários.

## Detalhes técnicos

**Novas RPCs** (`SECURITY DEFINER`, com `has_role(auth.uid(), 'admin')`):
- `admin_set_champion(p_team_id uuid)` — apaga linha anterior em `knockout_results` com stage CHAMPION e insere a nova
- `admin_clear_champion()`
- `admin_set_extra_result(p_category text, p_player_name text, p_team_id uuid)` — categoria deve ser `top_scorer_result` ou `mvp_result`. Faz upsert por categoria (vou usar `user_id = auth.uid()` do admin como chave técnica, já que `extra_predictions` exige `user_id NOT NULL`).
- `admin_clear_extra_result(p_category text)`

Todas chamam `refresh_leaderboard()` no final.

**Observação sobre `extra_predictions`**: a tabela atual usa `(user_id, category)` como chave de unicidade. Para os "resultados oficiais", vou usar o `user_id` do admin que registrou — a função `refresh_leaderboard` já filtra por `category = 'top_scorer_result'` / `'mvp_result'` independentemente do user_id, então funciona.

**Frontend**:
- Novo componente `src/components/admin/ExtrasResultsPanel.tsx`
- Hooks novos em `src/hooks/useAdmin.ts`: `useChampionResult`, `useExtraResults`, `useSetChampion`, `useSetExtraResult`, `useClearChampion`, `useClearExtraResult`
- Integrar como nova aba dentro da `AdminPage`

## Resultado
Você abre **Admin → Resultados Extras**, escolhe o campeão, digita o nome do artilheiro e do MVP, clica salvar, e o ranking de todos os usuários é recalculado automaticamente. Cada usuário que acertou ganha 100/50/50 pontos.
