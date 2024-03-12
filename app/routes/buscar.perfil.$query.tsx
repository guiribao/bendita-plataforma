//@ts-nocheck
import { LoaderFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/secure/authentication.server';
import buscarPerfil from '~/domain/Perfil/buscar-perfil.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  const { query } = params;

  let perfis = await buscarPerfil(query);

  return new Response(JSON.stringify(perfis), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
