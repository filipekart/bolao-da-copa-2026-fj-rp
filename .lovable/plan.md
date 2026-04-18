
## Plano: Toggle de tema claro/escuro

### O que vou fazer

**1. Adicionar variáveis de tema claro em `src/index.css`**
- Criar bloco `.light { ... }` com paleta clara (fundo branco/off-white, texto escuro, mantendo verde e dourado como acento).
- Manter `:root` como está (tema escuro permanece o padrão).
- Ajustar `.glass` e `.gradient-dark` para responder ao tema (ou criar variantes).

**2. Criar `src/lib/theme.tsx` (ThemeProvider)**
- Context com `theme: 'dark' | 'light'` e `toggleTheme()`.
- Persistência em `localStorage` (`bolao-theme`).
- Default: `dark` (preserva identidade visual atual).
- Aplica/remove classe `light` no `<html>`.

**3. Envolver app com `ThemeProvider` em `src/App.tsx`**
- Logo após `AuthProvider`.

**4. Criar componente `src/components/ThemeToggle.tsx`**
- Botão com ícones `Sun`/`Moon` (lucide-react).
- Usa `useTheme()` do provider.

**5. Adicionar toggle em `src/pages/ProfilePage.tsx`**
- Nova linha na seção de configurações (junto com seletor de idioma), com label traduzida.

**6. Traduções em `src/i18n/locales/*.json`**
- Chaves: `profile.theme`, `profile.themeDark`, `profile.themeLight` em pt/en/es/fr.

### Paleta clara proposta
- `--background: 0 0% 98%` (off-white)
- `--foreground: 220 20% 12%`
- `--card: 0 0% 100%`
- `--muted: 220 15% 94%`
- `--border: 220 15% 88%`
- `--primary` (verde) e `--accent` (dourado) inalterados — identidade preservada

### Observação
A memória registra "Exclusively Dark Mode" como parte da identidade visual. Vou manter dark como padrão e tratar o claro como opção opcional do usuário, sem alterar a identidade default. Após implementar, posso atualizar a memória se você confirmar que o tema claro agora é oficialmente suportado.

### Arquivos
- novo: `src/lib/theme.tsx`, `src/components/ThemeToggle.tsx`
- editados: `src/index.css`, `src/App.tsx`, `src/pages/ProfilePage.tsx`, `src/i18n/locales/{pt,en,es,fr}.json`
