//@ts-nocheck
import { LoaderFunctionArgs } from '@remix-run/node';
import pegarFeirantesPorFeira from '~/domain/Calendario/pegar-feirantes-por-feiras.server';
import buscarPerfil from '~/domain/Perfil/buscar-perfil.server';
import { authenticator } from '~/secure/authentication.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  let usuario: Usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  const { id } = params;
  
  let feirantes = await pegarFeirantesPorFeira(id);

  return new Response(JSON.stringify(feirantes), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
