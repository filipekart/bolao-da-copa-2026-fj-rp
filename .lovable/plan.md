

## Corrigir aba "Meus Rankings" para mostrar rankings em que o usuário é membro

### Problema
Em `src/hooks/useCustomRankings.ts`, a query filtra `custom_rankings` por `owner_id = user.id`. Logo, usuários adicionados a rankings criados por outras pessoas não veem nada — mesmo a RLS permitindo (`is_ranking_member`).

### Solução
Remover o filtro `.eq('owner_id', user!.id)` e deixar a RLS retornar tudo que o usuário pode ver (rankings próprios + rankings em que é membro). Adaptar a UI para distinguir rankings próprios vs. compartilhados.

### Alterações

**1. `src/hooks/useCustomRankings.ts`**
- Remover `.eq('owner_id', user!.id)` no `queryFn`. A RLS já garante que só vêm rankings próprios ou onde o usuário é membro.

**2. `src/components/ranking/CustomRankingsTab.tsx`**
- Calcular `isOwner = r.owner_id === user?.id` para cada ranking.
- Esconder os botões de Editar/Excluir quando `!isOwner` (RLS bloquearia mesmo, e visualmente confunde).
- Adicionar um pequeno badge/legenda "Compartilhado" quando `!isOwner`, para o usuário entender que foi adicionado por outra pessoa.
- Adicionar nova string i18n `ranking.shared` nos 4 locales (pt: "Compartilhado", en: "Shared", es: "Compartido", fr: "Partagé").

### Arquivos
- `src/hooks/useCustomRankings.ts`
- `src/components/ranking/CustomRankingsTab.tsx`
- `src/i18n/locales/{pt,en,es,fr}.json`

