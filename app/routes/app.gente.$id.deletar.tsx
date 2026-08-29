import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { deletarPerfilCompleto } from '~/domain/Delecao/deletar-em-cascata.server';
import { requirePermissaoDelecao } from '~/secure/delete-permissions.server';
import { redirecionarComResultado } from '~/shared/Delecao.util';

export async function action({ request, params }: ActionFunctionArgs) {
  await requirePermissaoDelecao(request, 'perfil');

  const perfilId = params.id;
  if (!perfilId) {
    return redirecionarComResultado('/app/gente', { success: false, message: 'Perfil não informado.' });
  }

  const resultado = await deletarPerfilCompleto(perfilId);

  return redirecionarComResultado('/app/gente', resultado);
}

export function loader() {
  return redirect('/app/gente');
}
