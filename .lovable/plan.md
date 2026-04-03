

## Plano: Perfil familiar — Rafael Pasqua gerencia Roberta, Pedro e Manuela

### Visão geral
Permitir que Rafael Pasqua faça login e alterne entre seus perfis familiares (Roberta, Pedro, Manuela) para fazer palpites em nome de cada um.

### Alterações

**1. Nova tabela `managed_profiles` (migração SQL)**
```sql
CREATE TABLE public.managed_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL,
  managed_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(manager_id, managed_id)
);
ALTER TABLE public.managed_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage" ON public.managed_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "managers read own" ON public.managed_profiles FOR SELECT TO authenticated
  USING (auth.uid() = manager_id);
```

**2. Inserir vínculos (via insert tool)**
- Buscar user_ids de Rafael, Roberta, Pedro e Manuela na tabela `profiles`
- Inserir 3 registros: Rafael → Roberta, Rafael → Pedro, Rafael → Manuela

**3. Modificar RPC `submit_match_prediction` (migração SQL)**
- Adicionar parâmetro opcional `p_acting_as uuid DEFAULT NULL`
- Se informado, validar que existe vínculo em `managed_profiles`
- Usar `p_acting_as` como user_id

**4. Novo contexto `ActiveProfileContext` (`src/lib/activeProfile.tsx`)**
- Estado global `activeUserId` (padrão: usuário logado)
- Hook `useActiveProfile()` retorna `{ activeUserId, setActiveUserId, isActingAsOther }`
- Envolver no `App.tsx` dentro do `AuthProvider`

**5. Seletor de perfil na aba Perfil (`src/pages/ProfilePage.tsx`)**
- Dropdown com seta mostrando perfis gerenciados
- Query em `managed_profiles` + `profiles` para obter nomes
- Ao trocar, atualiza o contexto global

**6. Indicador global no `AppLayout.tsx`**
- Banner sutil no topo quando operando como outro perfil (ex: "Apostando como: Roberta Pasqua")
- Botão para voltar ao perfil próprio

**7. Atualizar hooks para usar perfil ativo**
- `usePredictions.ts`, `useSubmitPrediction`: usar `activeUserId`
- `HomePage.tsx`, `MyBetsPage.tsx`, `ExtrasPage.tsx`, `ChampionPage.tsx`: usar `activeUserId`
- RPC de submit passa `p_acting_as` quando for perfil gerenciado

**8. Traduções (pt, en, es, fr)**
- Chaves: `profile.managedProfiles`, `profile.switchProfile`, `profile.actingAs`, `profile.backToMyProfile`

### Detalhes técnicos
- A RPC `submit_match_prediction` é `SECURITY DEFINER`, então contorna RLS de forma segura ao inserir como outro user
- Para extras/campeão, as tabelas usam `auth.uid() = user_id` nas policies — será necessário criar RPCs similares ou ajustar para aceitar `p_acting_as`
- As queries de leitura (palpites do perfil ativo) precisarão de uma policy ou RPC que permita o manager ler os dados do managed

