import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { Papel } from '@prisma/client';
import registrarPagamento from '~/domain/Pagamento/registrar-pagamento.server';
import { requireRoles } from '~/secure/require-role.server';

export const action: ActionFunction = async ({ request, params }) => {
  await requireRoles(request, [Papel.ADMIN, Papel.SECRETARIA]);

  const associadoId = params.id;

  if (!associadoId) {
    return json({ error: 'ID do associado não fornecido' }, { status: 400 });
  }

  const resultado = await registrarPagamento(associadoId);

  if (!resultado.ok && resultado.reason === 'ja_registrado_mes_atual') {
    return json({ error: 'Este associado já possui mensalidade registrada neste mês' }, { status: 409 });
  }

  if (!resultado.ok) {
    return json({ error: 'Erro ao registrar pagamento' }, { status: 500 });
  }

  return redirect('/app/gente');
};
