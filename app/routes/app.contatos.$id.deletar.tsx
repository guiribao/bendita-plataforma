import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { deletarContato } from '~/domain/Delecao/deletar-em-cascata.server';
import { requirePermissaoDelecao } from '~/secure/delete-permissions.server';
import { redirecionarComResultado } from '~/shared/Delecao.util';

export async function action({ request, params }: ActionFunctionArgs) {
  await requirePermissaoDelecao(request, 'contato');

  const contatoId = params.id;
  if (!contatoId) {
    return redirecionarComResultado('/app/contatos', { success: false, message: 'Contato não informado.' });
  }

  const resultado = await deletarContato(contatoId);

  return redirecionarComResultado('/app/contatos', resultado);
}

export function loader() {
  return redirect('/app/contatos');
}
