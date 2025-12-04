import React from 'react';
import { Papel } from '@prisma/client';
import { canAccess } from './authorization';

interface ProtectedRouteProps {
  children: React.ReactNode;
  path: string;
  userRole: string | Papel;
  fallback?: React.ReactNode;
}

/**
 * Componente para renderizar conteúdo apenas se o usuário tiver permissão
 * @example
 * <ProtectedRoute path="/app/financeiro" userRole={usuario.papel}>
 *   <FinanceiroPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  path,
  userRole,
  fallback,
}: ProtectedRouteProps) {
  if (!canAccess(path, userRole as string)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface RoleBasedRenderProps {
  children: React.ReactNode;
  roles: (string | Papel)[];
  userRole: string | Papel;
  fallback?: React.ReactNode;
}

/**
 * Componente para renderizar conteúdo apenas se o usuário tiver um dos papéis especificados
 * @example
 * <RoleBasedRender roles={['ADMIN', 'SECRETARIA']} userRole={usuario.papel}>
 *   <AdminPanel />
 * </RoleBasedRender>
 */
export function RoleBasedRender({
  children,
  roles,
  userRole,
  fallback,
}: RoleBasedRenderProps) {
  const hasRole = roles.includes(userRole);

  if (!hasRole) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface ConditionalNavLinkProps {
  children: React.ReactNode;
  path: string;
  userRole: string | Papel;
  component?: React.ElementType;
  [key: string]: any;
}

/**
 * Componente para renderizar um link de navegação apenas se o usuário tiver permissão
 * @example
 * <ConditionalNavLink path="/app/financeiro" userRole={usuario.papel} to="/app/financeiro">
 *   Financeiro
 * </ConditionalNavLink>
 */
export function ConditionalNavLink({
  children,
  path,
  userRole,
  component: Component = 'a',
  ...props
}: ConditionalNavLinkProps) {
  if (!canAccess(path, userRole as string)) {
    return null;
  }

  return <Component {...props}>{children}</Component>;
}
