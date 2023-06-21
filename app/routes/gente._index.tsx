import { LoaderArgs } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';


export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Gente - ChaveCloud',
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
  return {};
}

export default function GenteIndex() {
  return (
    <main>
      <h1>Gente</h1>
      <Link to="/gente/perfil">Listar perfis</Link>
      <br/>
      <Link to="/gente/perfil/novo">Novo perfil</Link>
    </main>
  );
}
