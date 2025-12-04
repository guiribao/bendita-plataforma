import { Papel } from "@prisma/client";

import { PaginasPorPapel } from "./permissions";
export interface MenuItemConfig {
  id: string;
  label: string;
  path: keyof typeof PaginasPorPapel;
  icon: string;
  ativo?: boolean;
  descricao?: string;
}

/**
 * Configuração de itens do menu da área restrita
 * Cada item deve ter um path que está configurado em permissions.ts
 */
export const MenuItems: MenuItemConfig[] = [
  {
    id: "dashboard",
    label: "Início",
    path: "/app/dashboard",
    icon: "las la-home",
    descricao: "Página inicial com visão geral",
  },
  {
    id: "gente",
    label: "Pessoas",
    path: "/app/gente",
    icon: "las la-users",
    descricao: "Gerenciar associados e usuários",
  },
  {
    id: "contatos",
    label: "Contatos",
    path: "/app/contatos",
    icon: "las la-address-book",
    descricao: "Lista de contatos e relacionamentos",
  },
  {
    id: "documentos",
    label: "Documentos",
    path: "/app/documentos",
    icon: "las la-folder-open",
    descricao: "Visualizar e gerenciar documentos",
  },
  {
    id: "medicacao",
    label: "Medicação",
    path: "/app/medicacao",
    icon: "las la-pills",
    descricao: "Gerenciar remessas e interesses",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    path: "/app/financeiro",
    icon: "las la-wallet",
    descricao: "Controle financeiro e pagamentos",
  },
];

/**
 * As permissões são obtidas de permissions.ts
 * Filtra os itens de menu que o usuário tem permissão de acessar
 * @param papelUsuario - Papel do usuário autenticado
 * @returns Array de MenuItemConfig autorizado para o usuário
 */
export function getMenuItemsForRole(papelUsuario: string | Papel): MenuItemConfig[] {
  return MenuItems.filter((item) => {
    const permissoes = PaginasPorPapel[item.path as keyof typeof PaginasPorPapel];
    return permissoes && permissoes.includes(papelUsuario as any);
  }).filter((item) => item.ativo !== false);
}

/**
 * Obtém um item de menu específico pelo ID
 * @param id - ID do item de menu
 * @returns MenuItemConfig ou undefined
 */
export function getMenuItemById(id: string): MenuItemConfig | undefined {
  return MenuItems.find((item) => item.id === id);
}

/**
 * Obtém um item de menu específico pelo path
 * @param path - Path do item de menu
 * @returns MenuItemConfig ou undefined
 */
export function getMenuItemByPath(path: string): MenuItemConfig | undefined {
  return MenuItems.find((item) => item.path === path);
}
