
## Plano: Porta de entrada "Bola da Vez"

### O que vou fazer

Criar rota pública `/boladavez` com tela de login/cadastro de marca própria. Mesmo backend, mesmo bolão, mesmo fluxo de aprovação.

### Implementação

**1. Asset da imagem**
- Copiar a imagem enviada para `src/assets/boladavez-hero.jpeg`.

**2. Nova página `src/pages/BolaDaVezAuthPage.tsx`**
- Mesma lógica de `AuthPage` (signup / signin / forgot password — mesmas chamadas `useAuth`).
- Visual próprio:
  - Hero no topo com a imagem da Copa do Mundo 2026.
  - Título "Bolão Bola da Vez" + subtítulo "by Bilhões da Virada".
  - Card de login/cadastro abaixo com tabs Entrar / Cadastrar.
  - Mantém paleta verde/dourado (combina com a imagem).

**3. Nova rota em `src/App.tsx`**
- Adicionar `<Route path="/boladavez" element={<BolaDaVezAuthGuard />} />` dentro de `AppRoutes`.
- `BolaDaVezAuthGuard` espelha o `AuthGuard`: se já autenticado → redireciona para `/`; senão renderiza `BolaDaVezAuthPage`.

**4. Diferenciação opcional (origem do cadastro)**
- Marcar `signup_source: 'boladavez'` no `user_metadata` no `signUp` desta página, para futura segmentação. Não cria tabela nem migration agora — fica registrado no auth do usuário.

### O que NÃO muda
- Banco: zero migration. Mesmos `auth.users` + `profiles`.
- Aprovação admin, ranking, RLS, regras de pontuação: idênticos.
- Após login: mesmo `AppLayout`, mesmo header "BOLÃO FJ | RP", mesmo bolão.
- Reset de senha: continua usando `/reset-password` padrão.

### Link para compartilhar
`https://bolao-da-copa-2026-fj-rp.lovable.app/boladavez`

### Arquivos
- novo: `src/pages/BolaDaVezAuthPage.tsx`, `src/assets/boladavez-hero.jpeg`
- editado: `src/App.tsx`
