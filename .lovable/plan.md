## Objetivo

Na aba Palpites > Palpites, hoje o campo de busca filtra apenas pelo nome do participante. Vou estender para também aceitar placares como "2x1", "2-1", "2 1" ou apenas "2".

## Como vai funcionar

- Continua buscando por nome (case-insensitive).
- Também detecta números na busca e casa contra `predicted_home_score` / `predicted_away_score`.
  - "2x1", "2-1", "2:1", "2 1" → mostra todos os palpites com placar exato 2 a 1.
  - "2" sozinho → mostra palpites em que casa OU visitante marcou 2.
- Se a busca tiver letras E números misturados, aplica nome OU placar (união) para não esconder resultados.
- Placeholder atualizado para algo como "Buscar participante ou placar (ex: 2x1)" nos 4 idiomas (pt/en/es/fr).

## Arquivos afetados

- `src/components/MatchPredictionsList.tsx` — lógica do filtro + placeholder via i18n.
- `src/i18n/locales/{pt,en,es,fr}.json` — nova chave `match.searchParticipantOrScore`.

Sem mudanças de backend, schema ou RLS.