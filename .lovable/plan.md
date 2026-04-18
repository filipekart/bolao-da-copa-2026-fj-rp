

## Plano: Mover ThemeToggle para o header

**O que vou fazer**

Adicionar o `ThemeToggle` no topo do AppLayout, visível em todas as páginas.

**Alterações**

1. **Importar ThemeToggle** em `src/components/AppLayout.tsx`
2. **Adicionar header row** logo após `<div className="max-w-lg mx-auto w-full px-4">`:
   - Flex row com `justify-between`
   - Esquerda: logo/título "Bolão FJ | RP" 
   - Direita: `<ThemeToggle />` (ícone compacto, sem texto)

**Resultado**: Botão de tema acessível em qualquer tela, sem ocupar espaço no conteúdo principal.

