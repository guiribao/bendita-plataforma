import { LoaderArgs, json } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';

export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Dashboard - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content:
        'Dashboard para análise e geração de relatórios de usuários, de operações e de atividades da núvem do Chave',
    },
  ];
};

export async function loader({ request }: LoaderArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return json({usuario});
}

export default function DashboardIndex() {
  let { usuario } = useLoaderData();
  
  return (
    <main>
      <div className='cards'>
        <div className='card-single'>
          <div>
            <h1>5050</h1>
            <span>Membros</span>
          </div>
          <div>
            <span className='las la-users'></span>
          </div>
        </div>
        <div className='card-single'>
          <div>
            <h1>409</h1>
            <span>Fardados</span>
          </div>
          <div>
            <span className='las la-star'></span>
          </div>
        </div>
        <div className='card-single'>
          <div>
            <h1>900</h1>
            <span>Presenças (últimos 30 dias)</span>
          </div>
          <div>
            <span className='las la-user-friends'></span>
          </div>
        </div>
        <div className='card-single'>
          <div>
            <h1>5.001</h1>
            <span>Visitantes cadastrados</span>
          </div>
          <div>
            <span className='las la-user-friends'></span>
          </div>
        </div>
      </div>
    </main>
  );
}
