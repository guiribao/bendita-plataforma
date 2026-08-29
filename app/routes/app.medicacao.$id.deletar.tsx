import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { deletarRemessa } from '~/domain/Delecao/deletar-em-cascata.server';
import { requirePermissaoDelecao } from '~/secure/delete-permissions.server';
import { redirecionarComResultado } from '~/shared/Delecao.util';

export async function action({ request, params }: ActionFunctionArgs) {
  await requirePermissaoDelecao(request, 'remessa');

  const remessaId = params.id;
  if (!remessaId) {
    return redirecionarComResultado('/app/medicacao', { success: false, message: 'Remessa não informada.' });
  }

  const resultado = await deletarRemessa(remessaId);

  return redirecionarComResultado('/app/medicacao', resultado);
}

export function loader() {
  return redirect('/app/medicacao');
}
