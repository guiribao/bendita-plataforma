# Sistema de Menu Dinâmico com Controle de Permissões

## 📋 Visão Geral

Este sistema gerencia o menu da área restrita dinamicamente baseado no papel (role) do usuário. O menu é construído automaticamente iterando sobre uma lista de itens configurados e apenas exibindo aqueles para os quais o usuário tem permissão.

## 🗂️ Estrutura de Arquivos

- **`menu-config.ts`** - Configuração centralizada de todos os itens de menu
- **`authorization.ts`** - Lógica de verificação de permissões
- **`permissions.ts`** - Mapeamento de papéis para páginas
- **`use-permissions.ts`** - Hooks customizados para usar permissões em componentes
- **`protected-components.tsx`** - Componentes utilitários para renderização condicional

## 🎯 Como Usar

### 1. Adicionar um Novo Item ao Menu

Edite `app/secure/menu-config.ts`:

```typescript
export const MenuItems: MenuItemConfig[] = [
  // ... itens existentes ...
  {
    id: "novo-item",
    label: "Novo Item",
    path: "/app/novo-item",
    icon: "las la-star",
    papelAutorizado: [Papel.ADMIN, Papel.SECRETARIA],
    descricao: "Descrição do novo item",
  },
];
```

### 2. Adicionar Permissões para a Página

Edite `app/secure/permissions.ts`:

```typescript
export const PaginasPorPapel = {
  // ... páginas existentes ...
  "/app/novo-item": [
    Papel.ADMIN,
    Papel.SECRETARIA,
  ],
};
```

### 3. Verificar Permissões em Componentes

Use o hook `usePermissions`:

```typescript
import { usePermissions } from '~/secure/use-permissions';

export function MeuComponente({ usuario }) {
  const permissions = usePermissions(usuario.papel);

  if (!permissions.canAccessPath('/app/novo-item')) {
    return <p>Acesso negado</p>;
  }

  return <p>Conteúdo permitido</p>;
}
```

### 4. Renderizar Conteúdo Condicionalmente

Use o componente `ProtectedRoute`:

```typescript
import { ProtectedRoute } from '~/secure/protected-components';

export function Dashboard({ usuario }) {
  return (
    <ProtectedRoute path="/app/financeiro" userRole={usuario.papel}>
      <FinanceiroWidget />
    </ProtectedRoute>
  );
}
```

## 🔑 Interfaces e Tipos

### MenuItemConfig

```typescript
interface MenuItemConfig {
  id: string;                    // ID único do item
  label: string;                 // Texto exibido no menu
  path: string;                  // Caminho da página
  icon: string;                  // Classe de ícone (Line Awesome)
  papelAutorizado: Papel[];      // Array de papéis autorizados
  ativo?: boolean;               // Se deve aparecer no menu (padrão: true)
  descricao?: string;            // Tooltip ao passar mouse
}
```

## 📱 Componentes Disponíveis

### ProtectedRoute

Renderiza conteúdo apenas se o usuário tiver permissão de acessar o caminho:

```typescript
<ProtectedRoute 
  path="/app/financeiro" 
  userRole={usuario.papel}
  fallback={<p>Acesso negado</p>}
>
  <FinanceiroPage />
</ProtectedRoute>
```

### RoleBasedRender

Renderiza conteúdo apenas se o usuário tiver um dos papéis especificados:

```typescript
<RoleBasedRender 
  roles={['ADMIN', 'SECRETARIA']} 
  userRole={usuario.papel}
>
  <AdminPanel />
</RoleBasedRender>
```

### ConditionalNavLink

Renderiza um link apenas se o usuário tiver permissão:

```typescript
<ConditionalNavLink 
  path="/app/financeiro" 
  userRole={usuario.papel}
  component={Link}
  to="/app/financeiro"
>
  Financeiro
</ConditionalNavLink>
```

## 🪝 Hooks Disponíveis

### usePermissions

```typescript
const permissions = usePermissions(usuario.papel);

// Verificar acesso
permissions.canAccessPath('/app/financeiro');
permissions.canAccessCurrentPage();
permissions.isPathAccessible('/app/gente');

// Obter informações
permissions.getAvailableMenuItems();
permissions.getCurrentMenuItem();
```

### useRole

```typescript
const role = useRole(usuario.papel);

// Verificar papéis
role.isAdmin();
role.isSecretaria();
role.isSaude();
role.hasRole(Papel.ADMIN);
role.isOneOf([Papel.ADMIN, Papel.SECRETARIA]);
```

## 🔄 Fluxo de Funcionamento

1. **NavRestrictArea** obtém o papel do usuário
2. Chama `getMenuItemsForRole(userRole)` para obter itens permitidos
3. Itera sobre os itens e renderiza apenas os autorizados
4. Cada item tem um tooltip com a descrição
5. O item ativo é destacado comparando com `location.pathname`

## 📊 Papéis Disponíveis

- `ADMIN` - Administrador completo
- `SECRETARIA` - Setor administrativo
- `SAUDE` - Profissional de saúde
- `ASSOCIADO` - Membro associado
- `ASSOCIADO_DEPENDENTE` - Dependente de associado

## 🎨 Exemplo Completo

```typescript
// Em um componente qualquer:
import { usePermissions, useRole } from '~/secure/use-permissions';
import { ProtectedRoute } from '~/secure/protected-components';

export function Dashboard({ usuario }) {
  const permissions = usePermissions(usuario.papel);
  const role = useRole(usuario.papel);

  return (
    <div>
      <h1>Dashboard</h1>
      
      <ProtectedRoute path="/app/financeiro" userRole={usuario.papel}>
        <Card>
          <Card.Title>Financeiro</Card.Title>
          {/* Conteúdo financeiro */}
        </Card>
      </ProtectedRoute>

      {role.isAdmin() && (
        <Card>
          <Card.Title>Painel de Administração</Card.Title>
          {/* Conteúdo admin */}
        </Card>
      )}

      <div>
        Menu items disponíveis: 
        {permissions.getAvailableMenuItems().map(item => (
          <span key={item.id}>{item.label}, </span>
        ))}
      </div>
    </div>
  );
}
```

## ✅ Benefícios

- ✅ **Centralizado** - Todas as configurações em um lugar
- ✅ **Dinâmico** - Menu se adapta automaticamente ao papel
- ✅ **Seguro** - Validação no backend e frontend
- ✅ **Reutilizável** - Componentes e hooks para qualquer página
- ✅ **Manutenível** - Fácil adicionar/remover itens
- ✅ **Acessível** - Tooltips e ícones bem definidos
