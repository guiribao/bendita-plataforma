import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { deletarPagamento } from '~/domain/Delecao/deletar-em-cascata.server';
import { requirePermissaoDelecao } from '~/secure/delete-permissions.server';
import { redirecionarComResultado } from '~/shared/Delecao.util';

export async function action({ request, params }: ActionFunctionArgs) {
  await requirePermissaoDelecao(request, 'pagamento');

  const pagamentoId = params.id;
  if (!pagamentoId) {
    return redirecionarComResultado('/app/financeiro', { success: false, message: 'Pagamento não informado.' });
  }

  const resultado = await deletarPagamento(pagamentoId);

  return redirecionarComResultado('/app/financeiro', resultado);
}

export function loader() {
  return redirect('/app/financeiro');
}
