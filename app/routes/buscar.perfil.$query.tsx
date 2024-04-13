//@ts-nocheck
import { LoaderFunctionArgs } from '@remix-run/node';
import buscarPerfil from '~/domain/Perfil/buscar-perfil.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { query } = params;
  const searchParams = new URL(request.url).searchParams;

  const onlyUsers = searchParams.has('onlyUsers');

  let perfis = await buscarPerfil(query, { onlyUsers });

  return new Response(JSON.stringify(perfis), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
