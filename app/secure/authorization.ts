//@ts-nocheck
import { Papel } from '@prisma/client';
import { FuncionalidadesPorPapel, PaginasAbertas, PaginasPorPapel } from './permissions';

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

  if (/\/calendario\/feira\/[0-9]/i.test(pathname)) {
    const papeisPermitidos = PaginasPorPapel['/calendario/feira/{id}'];
    return papeisPermitidos?.includes(papelUsuario);
  }


  if (/\/gente\/[0-9]+/i.test(pathname)) {
    const papeisPermitidos = PaginasPorPapel['/gente/{id}'];
    return papeisPermitidos?.includes(papelUsuario);
  }

  return canI;
}

export function handleElements(document, papel, path) {
  let saned = '/' + path.split('/')[1];
  let elements = document.querySelectorAll('[data-role]');
  if (!FuncionalidadesPorPapel[saned]) return;
  let funcionalidades = FuncionalidadesPorPapel[saned];
  
  for (let element of elements) {
    if (
      !funcionalidades[element.dataset.role] ||
      !funcionalidades[element.dataset.role].includes(papel)
    ) {
      element.parentNode?.removeChild(element);
    }
  }
}
