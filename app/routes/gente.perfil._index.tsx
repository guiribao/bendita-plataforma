import { LoaderArgs, json } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';
import { authenticator } from '~/secure/authentication.server';

export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Perfis - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content:
        'Gerenciamento de cadastro de pessoas da núvem do Chave',
    },
  ];
};

export async function loader({ request }: LoaderArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return json({ usuario });
}

export default function GenteIndex() {
  return (
    <main>
      <h1>Lista de Perfis</h1>
    </main>
  );
}
