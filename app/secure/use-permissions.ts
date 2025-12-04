import { useMemo } from 'react';
import { useLocation } from '@remix-run/react';
import { canAccess, canView, specificDynPages } from './authorization';
import { getMenuItemsForRole, getMenuItemByPath } from './menu-config';
import type { Papel } from '@prisma/client';
import type { MenuItemConfig } from './menu-config';

/**
 * Hook para verificar permissões de acesso a páginas
 * @param userRole - Papel do usuário
 * @returns Objeto com funções de verificação de permissões
 */
export function usePermissions(userRole: string | Papel) {
  const location = useLocation();

  return useMemo(() => ({
    /**
     * Verifica se o usuário pode visualizar um caminho
     */
    canViewPath: (pathname: string) => canView(pathname, userRole as string),

    /**
     * Verifica se o usuário pode acessar um caminho
     */
    canAccessPath: (pathname: string) => canAccess(pathname, userRole as string),

    /**
     * Verifica permissões dinâmicas (páginas com parâmetros)
     */
    canAccessDynamicPage: (pathname: string) => specificDynPages(pathname, userRole as string),

    /**
     * Obtém todos os itens de menu disponíveis para o usuário
     */
    getAvailableMenuItems: (): MenuItemConfig[] => getMenuItemsForRole(userRole),

    /**
     * Verifica se pode acessar a página atual
     */
    canAccessCurrentPage: () => canAccess(location.pathname, userRole as string),

    /**
     * Obtém informações do item de menu atual
     */
    getCurrentMenuItem: (): MenuItemConfig | undefined => getMenuItemByPath(location.pathname),

    /**
     * Verifica se um caminho específico é acessível
     */
    isPathAccessible: (pathname: string) => canAccess(pathname, userRole as string),
  }), [userRole, location.pathname]);
}

/**
 * Hook para verificar se o usuário tem um papel específico
 */
export function useRole(userRole: string | Papel) {
  return useMemo(() => ({
    isAdmin: () => userRole === 'ADMIN',
    isSecretaria: () => userRole === 'SECRETARIA',
    isSaude: () => userRole === 'SAUDE',
    isAssociado: () => userRole === 'ASSOCIADO',
    isAssociadoDependente: () => userRole === 'ASSOCIADO_DEPENDENTE',
    hasRole: (role: string | Papel) => userRole === role,
    isOneOf: (roles: (string | Papel)[]) => roles.includes(userRole as Papel),
  }), [userRole]);
}
