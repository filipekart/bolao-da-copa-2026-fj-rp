
## Plano: Gerenciar multi-perfis na aba Admin

### Visão geral
Adicionar uma nova seção/aba "Multi-perfis" no painel Admin para criar, visualizar e remover vínculos de gerenciamento entre perfis (tabela `managed_profiles`).

### Alterações

**1. Nova aba "Multi-perfis" no `AdminPage.tsx`**
- Adicionar terceira aba ao seletor existente (`users | matches | profiles`)
- Listar todos os vínculos atuais (manager → managed) com nomes
- Botão para remover vínculos existentes (com confirmação)
- Formulário para criar novos vínculos:
  - Dropdown "Gerente" com lista de usuários aprovados
  - Dropdown "Gerenciado" com lista de usuários aprovados (excluindo o gerente selecionado)
  - Botão "Vincular"

**2. Novos hooks em `useAdmin.ts`**
- `useManagedProfilesAdmin()`: lista todos os vínculos com nomes (join com profiles)
- `useCreateManagedProfile()`: insere novo vínculo
- `useDeleteManagedProfile()`: remove vínculo por ID

**3. Traduções (pt, en, es, fr)**
- Chaves: `admin.multiProfiles`, `admin.manager`, `admin.managed`, `admin.linkProfile`, `admin.unlinkProfile`, `admin.confirmUnlink`

### Detalhes técnicos
- As políticas RLS já permitem que admins façam CRUD completo em `managed_profiles` (policy "admins manage")
- O admin pode usar `supabase.from('managed_profiles')` diretamente para todas as operações
- Para mostrar nomes, faz join com `profiles` ou usa a RPC `get_public_profiles()`
