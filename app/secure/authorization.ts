//@ts-nocheck
import { Papel } from '@prisma/client';
import { PaginasAbertas, PaginasPorPapel } from './permissions';

export function canView(pathname: string, papelUsuario: string) {
  
  const papeisPermitidos = PaginasPorPapel[pathname];
  return (
    papeisPermitidos?.includes(papelUsuario) ||
    PaginasAbertas.find((e) => {
      return pathname.includes(e) == true;
    }) ||
    specificDynPages(pathname, papelUsuario)
  );
}

export function canAccess(pathname: string, papelUsuario: string) {
  const papeisPermitidos = PaginasPorPapel[pathname];
  return (
    papeisPermitidos?.includes(papelUsuario) ||
    PaginasAbertas.find((e) => {
      return pathname.includes(e) == true;
    })
  );
}

export function specificDynPages(pathname: string, papelUsuario: string) {
  let canI = false;

  if (/\/financeiro\/[0-9]+/i.test(pathname)) {
    const papeisPermitidos = PaginasPorPapel['/financeiro/{id}'];
    return papeisPermitidos?.includes(papelUsuario);
  }

  if (/\/calendario\/[0-9]+/i.test(pathname)) {
    const papeisPermitidos = PaginasPorPapel['/calendario/{id}'];
    return papeisPermitidos?.includes(papelUsuario);
  }

  return canI;
}
