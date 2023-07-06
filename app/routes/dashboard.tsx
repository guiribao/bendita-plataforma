import { LoaderArgs, json } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
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

  return json({ usuario });
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

      <div className='cards'>
        <div className='view operacoes'>
          <div className='view-header'>
            <h1>Últimas operações</h1>
            <Link to={''}>Ver +</Link>
          </div>
          <div className='view-body'>
            <table width={`100%`}>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Data</td>
                  <td>Descrição</td>
                  <td>Valor</td>
                  <td>Tipo</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>101</td>
                  <td>5 jun de 2023</td>
                  <td>Lenha para feitio #55</td>
                  <td>R$4.200,00</td>
                  <td>Saída</td>
                </tr>
                <tr>
                  <td>102</td>
                  <td>4 jun de 2023</td>
                  <td>Doação anônima</td>
                  <td>R$5.000,00</td>
                  <td>Entrada</td>
                </tr>
                <tr>
                  <td>103</td>
                  <td>4 jun de 2023</td>
                  <td>Doação do Salomão</td>
                  <td>R$700,00</td>
                  <td>Entrada</td>
                </tr>
                <tr>
                  <td>104</td>
                  <td>3 jun de 2023</td>
                  <td>Pagamento internet</td>
                  <td>R$99,00</td>
                  <td>Saída</td>
                </tr>
                <tr>
                  <td>105</td>
                  <td>2 jun de 2023</td>
                  <td>Doação do Jesus</td>
                  <td>R$10,00</td>
                  <td>Entrada</td>
                </tr>
                <tr>
                  <td>106</td>
                  <td>2 jun de 2023</td>
                  <td>Doação da Maria</td>
                  <td>R$20,00</td>
                  <td>Entrada</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>

        <div className='view ultimos-perfis'>
          <div className='view-header'>
            <h1>Últimos perfis</h1>
            <Link to={''}>Ver +</Link>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Nome</td>
                  <td>Grupo</td>
                  <td>É membro</td>
                  <td>Cadastro em</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2301</td>
                  <td>Paloma Dutra</td>
                  <td>Membro</td>
                  <td><i className="las la-check"></i></td>
                  <td>20 mai de 2023 </td>
                </tr>
                <tr>
                  <td>2302</td>
                  <td>Guilherme Rosa</td>
                  <td>Membro</td>
                  <td><i className="las la-check"></i></td>
                  <td>20 mai de 2023 </td>
                </tr>
                <tr>
                  <td>2303</td>
                  <td>Bruno Soares</td>
                  <td>Membro</td>
                  <td><i className="las la-check"></i></td>
                  <td>20 mai de 2023 </td>
                </tr>
                <tr>
                  <td>2304</td>
                  <td>Janaina Camargo</td>
                  <td>Membro</td>
                  <td><i className="las la-check"></i></td>
                  <td>20 mai de 2023 </td>
                </tr>
                <tr>
                  <td>2305</td>
                  <td>José Maria</td>
                  <td>Visitante</td>
                  <td></td>
                  <td>21 mai de 2023 </td>
                </tr>
                <tr>
                  <td>2306</td>
                  <td>Albertina Alves</td>
                  <td>Visitante</td>
                  <td></td>
                  <td>21 mai de 2023 </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>

        <div className='view eventos'>
          <div className='view-header'>
            <h1>Eventos</h1>
            <Link to={''}>Ver +</Link>
          </div>
          <div className='view-body'>
            <table width={`100%`}>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Data</td>
                  <td>Nome</td>
                  <td>Tipo</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>101</td>
                  <td>15 jun de 2023</td>
                  <td>Concentração</td>
                  <td>Trabalho</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
