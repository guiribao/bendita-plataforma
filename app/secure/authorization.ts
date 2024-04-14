//@ts-nocheck
import { Papel } from '@prisma/client';
import {
  FuncionalidadesPorPapel,
  PaginaComPapelAdicional,
  PaginasAbertas,
  PaginasPorPapel,
} from './permissions';

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

export async function loadAditionalRoles(pathname: string, usuario, perfil) {
  let should = !!PaginaComPapelAdicional.find((str) => pathname.includes(str));

  if (should === false) return [];

  let response = await fetch('/autentica/roles/', {
    method: 'post',
    body: JSON.stringify({ path: pathname, perfilId: perfil.id }),
  }).then((res) => res.json());

  return response.roles;
}

export async function handleElements(document, papel, papelAdicional, path) {
  let module = '/' + path.split('/')[1];
  let elements = document.querySelectorAll('[data-role]');

  let aditionalRole = await papelAdicional();

  if (!FuncionalidadesPorPapel[module]) return;
  let funcionalidades = FuncionalidadesPorPapel[module];

  for (let element of elements) {
    if (
      !funcionalidades[element.dataset.role] ||
      (!funcionalidades[element.dataset.role].includes(papel) &&
        !aditionalRole.find((str) => funcionalidades[element.dataset.role] == str))
    ) {
      element.parentNode?.removeChild(element);
    }
  }
}
