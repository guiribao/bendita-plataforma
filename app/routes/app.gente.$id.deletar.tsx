//@ts-nocheck
import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import deletarPerfilCompleto from '~/domain/Perfil/deletar-perfil-completo.server';
import { authenticator } from '~/secure/authentication.server';

export const action: ActionFunction = async ({ request, params }) => {
  // Verificar autenticação
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  const perfilId = params.id;

  if (!perfilId) {
    return json({ success: false, message: 'ID do perfil não fornecido.' }, { status: 400 });
  }

  // Executar deleção completa
  const resultado = await deletarPerfilCompleto(perfilId);

  if (resultado.success) {
    return redirect('/app/gente');
  } else {
    return json(resultado, { status: 500 });
  }
};
