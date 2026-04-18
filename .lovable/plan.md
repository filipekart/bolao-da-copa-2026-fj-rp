
Vou tornar explícito na seção "Premiação" do Perfil (e no `RulesModal`) o que compõe cada fatia dos 20% de parciais, especialmente "1ª fase" e "2ª fase + extras", que hoje aparecem sem detalhamento.

## Situação atual
Em `src/pages/ProfilePage.tsx` (seção Premiação) e `src/components/RulesModal.tsx`, os itens aparecem como:
- 1ª rodada — 3%
- 2ª rodada — 3%
- 3ª rodada — 3%
- 1ª fase — 6%
- 2ª fase + extras — 5%

Não fica claro que "1ª fase" = soma das 3 rodadas da fase de grupos, nem que "2ª fase" = mata-mata (incluindo Disputa do 3º e Final), nem o que são os "extras".

## O que vou alterar

**1. `src/pages/ProfilePage.tsx` — bloco "Parciais — 20% do total"**

Renomear/clarificar os labels e adicionar uma linha de descrição curta abaixo de cada item (texto `text-[11px] text-muted-foreground`):

- "1ª rodada da fase de grupos" — 3% — *"Maior pontuação somando apenas os jogos da rodada 1"*
- "2ª rodada da fase de grupos" — 3% — *"Somando apenas os jogos da rodada 2"*
- "3ª rodada da fase de grupos" — 3% — *"Somando apenas os jogos da rodada 3"*
- "Campeão da 1ª fase (fase de grupos)" — 6% — *"Maior pontuação somando todos os jogos da fase de grupos (rodadas 1 + 2 + 3)"*
- "Campeão da 2ª fase (mata-mata) + Extras" — 5% — *"Soma dos jogos do mata-mata (16-avos até a Final, incluindo Disputa do 3º) + acertos de Campeão, Artilheiro e MVP"*

**2. `src/components/RulesModal.tsx` — mesmo bloco "Parciais"**

Aplicar exatamente os mesmos textos para manter consistência entre o modal de regras e a página de Perfil.

**3. i18n (`src/i18n/locales/en.json`, `es.json`, `fr.json`, `pt.json`)**

Adicionar chaves novas para as descrições (`profile.prizesRound1Desc`, `prizesRound2Desc`, `prizesRound3Desc`, `prizesPhase1Desc`, `prizesPhase2Desc`) e ajustar os labels existentes (`prizesPhase1`, `prizesPhase2`) para refletir o novo texto. O Profile usa i18n; o RulesModal hoje está em PT hardcoded — manterei hardcoded para não expandir o escopo, apenas atualizando o texto em português.

## Fora do escopo
- Não mexo nos percentuais nem na lógica de cálculo.
- Não mexo no bloco "Ranking final — 80%".
