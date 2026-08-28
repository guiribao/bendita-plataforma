import type { Papel } from '@prisma/client';
import { authenticator } from './authentication.server';

export async function requireRoles(request: Request, roles: Papel[]) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  if (!roles.includes(usuario.papel as Papel)) {
    throw new Response('Não autorizado', { status: 403 });
  }

  return usuario;
}