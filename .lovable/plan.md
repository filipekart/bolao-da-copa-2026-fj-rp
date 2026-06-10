## Objetivo
Mostrar de forma clara quantos palpites de jogos da fase de grupos o usuário já fez, tanto no geral quanto por grupo.

## O que muda

### 1. Badge global no topo da Home (`src/pages/HomePage.tsx`)
- Logo abaixo do header gradiente "Bolão da Copa" (e antes da seção "Ao vivo"), exibir um chip discreto:
  - `✅ 72/72 palpites` — verde (primary) quando completo
  - `⚠️ 70/72 palpites` — âmbar/destaque quando faltam
- Conta apenas matches da fase de grupos (`GROUP_STAGE`), que é exatamente o que `useMatches('GROUP_STAGE')` já retorna na Home.
- Considera apenas palpites com `predicted_home_score` e `predicted_away_score` preenchidos (não-null) — dados já disponíveis em `existingPredictions`.
- Quando o usuário está apostando por outro perfil (`isActingAsOther`), o contador reflete o `activeUserId` (já é o caso, pois `existingPredictions` usa `activeUserId`).

### 2. Contador por grupo no header do `GroupCard`
- Substituir o ✓ verde atual por `Y/N` (ex: `3/6`) ao lado do nome do grupo.
- Quando `Y === N`, manter o ✓ verde **junto** com o número (`6/6 ✓`) para reforçar o "completo".
- Cor: muted quando incompleto, primary quando completo.

### 3. Visual / estilo
- Apenas números, sem barra de progresso (conforme decidido).
- Sem incluir Extras (Campeão/Artilheiro/MVP) — só os 72 jogos.

## Detalhes técnicos
- Cálculo total: `matches.length` (já é 72 ao filtrar GROUP_STAGE) e `existingPredictions.length` filtrando os que têm score válido.
- Cálculo por grupo: dentro do `GroupCard`, já recebe `existingPredictionIds` — derivar `filled = matches.filter(m => existingPredictionIds.has(m.id)).length` e total `matches.length`.
- Tudo client-side, sem mudanças de schema, RPC ou RLS.
- Adicionar chaves i18n em `pt.json`, `en.json`, `es.json`, `fr.json`:
  - `home.predictionsProgress` ("{{done}}/{{total}} palpites")
  - `home.groupProgress` ("{{done}}/{{total}}")

## Fora do escopo
- Página "Meus Palpites" (não alterada nesta task).
- Contagem dos Extras.
- Banner de alerta perto do kickoff (pode virar follow-up).
- Mata-mata (a Home só lida com fase de grupos hoje).
