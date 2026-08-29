import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { deletarDocumento } from '~/domain/Delecao/deletar-em-cascata.server';
import { documentoPertenceAoUsuario, requirePermissaoDelecao } from '~/secure/delete-permissions.server';
import { redirecionarComResultado } from '~/shared/Delecao.util';

export async function action({ request, params }: ActionFunctionArgs) {
  const { usuario, escopo } = await requirePermissaoDelecao(request, 'documento');

  const documentoId = params.id;
  if (!documentoId) {
    return redirecionarComResultado('/app/documentos', { success: false, message: 'Documento não informado.' });
  }

  if (escopo === 'PROPRIOS' && !(await documentoPertenceAoUsuario(documentoId, usuario.id))) {
    throw new Response('Não autorizado', { status: 403 });
  }

  const resultado = await deletarDocumento(documentoId);

  return redirecionarComResultado('/app/documentos', resultado);
}

export function loader() {
  return redirect('/app/documentos');
}
