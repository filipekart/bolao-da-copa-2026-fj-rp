

## Plano: Rankings personalizados (paralelos)

### Conceito
Cada usuário pode criar um ou mais "mini-rankings" selecionando participantes do bolão. Exemplo: "Família Jorge", "Amigos do trabalho". Os pontos vêm do ranking geral existente — é apenas um filtro/agrupamento personalizado.

### Alterações

**1. Duas novas tabelas (migração SQL)**

- `custom_rankings` — id, owner_id (uuid), name (text), created_at
- `custom_ranking_members` — id, ranking_id (FK), user_id (uuid), added_at

RLS: owner pode CRUD no próprio ranking; membros adicionados podem visualizar o ranking onde foram incluídos.

**2. Nova aba "Meus Rankings" na página de Ranking**

- Botão "+" para criar novo ranking (nome + seleção de participantes via checklist)
- Cada ranking customizado aparece como um card expansível ou sub-aba
- A listagem reutiliza o componente `RankingList` existente, filtrando os dados do ranking geral pelos membros selecionados
- O dono pode editar (adicionar/remover membros) ou excluir o ranking

**3. Hook `useCustomRankings`**

- Busca os rankings do usuário logado com seus membros
- Cruza com os dados do `useRanking()` existente para calcular posições relativas

**4. Fluxo do usuário**

```text
Ranking Page
├── Geral | Grupos | R1 | R2 | R3 | 2ª Fase   (abas existentes)
└── [⭐ Meus Rankings]                          (nova aba)
    ├── + Criar ranking
    ├── "Família Jorge" (5 membros)  [Editar] [Excluir]
    │   └── Lista filtrada com posições 1-5
    └── "Trabalho" (8 membros)       [Editar] [Excluir]
        └── Lista filtrada com posições 1-8
```

**5. Traduções**
- Chaves: `ranking.myRankings`, `ranking.createRanking`, `ranking.rankingName`, `ranking.selectMembers`, `ranking.deleteRanking`, `ranking.editRanking`, `ranking.noCustomRankings`

### Detalhes técnicos
- Não cria views nem RPCs novas — filtra client-side a partir do ranking geral já carregado
- Limite sugerido: 10 rankings por usuário, 50 membros por ranking
- O dono é automaticamente incluído como membro
- Nenhuma alteração nas tabelas ou views de ranking existentes

