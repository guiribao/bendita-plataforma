import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { authenticator } from '~/secure/authentication.server';
import { Papel } from '@prisma/client';
import registrarPagamento from '~/domain/Pagamento/registrar-pagamento.server';

export const action: ActionFunction = async ({ request, params }) => {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Apenas admins e secretaria podem registrar pagamentos
  if (usuario.papel !== Papel.ADMIN && usuario.papel !== Papel.SECRETARIA) {
    return json({ error: 'Sem permissão para registrar pagamentos' }, { status: 403 });
  }

  const associadoId = params.id;

  if (!associadoId) {
    return json({ error: 'ID do associado não fornecido' }, { status: 400 });
  }

  const pagamento = await registrarPagamento(associadoId);

  if (!pagamento) {
    return json({ error: 'Erro ao registrar pagamento' }, { status: 500 });
  }

  return redirect('/app/gente');
};
