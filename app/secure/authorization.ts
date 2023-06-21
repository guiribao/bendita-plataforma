import { Papel } from '@prisma/client';
import { PaginasAbertas, PaginasPorPapel } from './permissions';

export function canView (path: string, papelUsuario: string) {
  const papeisPermitidos = PaginasPorPapel[path];
  return papeisPermitidos?.includes(papelUsuario) || PaginasAbertas.find(e => {
    return path.includes(e) == true
  })
}

export function canAccess (request: Request, papelUsuario: string) {
  const symbol = Object.getOwnPropertySymbols(request)[1];
  const parsed_url = request[symbol].parsedURL;
  const papeisPermitidos = PaginasPorPapel[parsed_url.pathname];

  return papeisPermitidos?.includes(papelUsuario);
}
