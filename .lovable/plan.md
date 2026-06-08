## Problema

A função `public.get_general_ranking()` (criada na correção do Ranking Geral) ficou com `EXECUTE` para `PUBLIC` e `anon`, além de `authenticated`. Como é `SECURITY DEFINER`, qualquer requisição anônima pode invocá-la pela Data API e ler nomes/pontos de todos os participantes aprovados sem login — origem do alerta do scanner.

Todas as outras funções `SECURITY DEFINER` do projeto já estão restritas (sem `anon`, sem `PUBLIC`). Só `get_general_ranking` está exposta.

## Correção (migração mínima)

```sql
REVOKE EXECUTE ON FUNCTION public.get_general_ranking() FROM PUBLIC, anon;
-- authenticated mantém EXECUTE (já concedido); service_role idem.
```

Nada muda no frontend — `useRanking` continua chamando via cliente autenticado.

## Validação

- Rodar o linter / scan novamente: alerta sai.
- Logar como usuário comum e abrir a aba Geral: ranking continua aparecendo.
- Chamada anônima a `rpc('get_general_ranking')` passa a retornar erro de permissão.
