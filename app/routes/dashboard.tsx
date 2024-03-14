//@ts-nocheck
import { LoaderArgs, json } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunctiond } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Minicards from '~/component/Minicards';
import pegarDadosOperacoesDashboard from '~/domain/Financeiro/pegar-dados-operacoes-dashboard.server';
import pegarDadosPerfisDashboard from '~/domain/Perfil/pegar-dados-perfis-dashboard.server';
import { authenticator } from '~/secure/authentication.server';

export const meta: MetaFunction = () => {
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

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // - Get operacoes data
  let { ultimasDezOperacoes, qtdOperacoes } = await pegarDadosOperacoesDashboard();
  console.log(qtdOperacoes);
  // - Get perfis data
  let { ultimosDezPerfis, qtdPerfis } = await pegarDadosPerfisDashboard();
  // - Get eventos data

  return json({ usuario, ultimasDezOperacoes, qtdOperacoes, ultimosDezPerfis, qtdPerfis });
}

export default function DashboardIndex() {
  let { usuario, ultimasDezOperacoes, qtdOperacoes, ultimosDezPerfis, qtdPerfis } = useLoaderData();

  let qtdPerfilFardado = qtdPerfis.find((e) => e.grupo == 'FARDADO');
  let qtdPerfilVisitante = qtdPerfis.find((e) => e.grupo == 'VISITANTE');

  let qtdOperacaoEntrada = qtdOperacoes.find((e) => e.tipo == 'ENTRADA');
  let qtdOperacaoSaida = qtdOperacoes.find((e) => e.tipo == 'SAIDA');

  let minicardsData = [
    {
      quantidade: qtdPerfilFardado?._count,
      label: 'Fardados',
      icon: 'las la-star',
    },
    {
      quantidade: qtdPerfilVisitante?._count,
      label: 'Visitantes',
      icon: 'las la-users',
    },
    {
      quantidade: qtdOperacaoEntrada?._count,
      label: 'Entradas',
      icon: 'las la-file-export',
    },
    {
      quantidade: qtdOperacaoSaida?._count,
      label: 'Saídas',
      icon: 'las la-file-import',
    },
  ];

  return (
    <main>
      <Minicards cards={minicardsData} />

      <div className='cards'>
        <div className='view operacoes'>
          <div className='view-header'>
            <h1>Últimas operações</h1>
            <Link to={'/financeiro'}>+ Financeiro</Link>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Descrição</td>
                  <td>Tipo</td>
                  <td>Valor</td>
                  <td>Data</td>
                </tr>
              </thead>
              <tbody>
                {ultimasDezOperacoes.map((operacao) => (
                  <tr key={operacao.id}>
                    <td>{operacao.id}</td>
                    <td>{operacao.descricao}</td>
                    <td>{operacao.tipo}</td>
                    <td>{operacao.valor}</td>
                    <td
                      title={format(new Date(operacao.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    >
                      {format(new Date(operacao.criado_em), "d 'de' LLLL 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                  </tr>
                ))}
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
                {ultimosDezPerfis.map((perfil) => (
                  <tr key={perfil.id}>
                    <td>{perfil.id}</td>
                    <td>
                      {perfil.nome} {perfil.sobrenome}
                    </td>
                    <td>{perfil.grupo}</td>
                    <td>{perfil.membro && <i className='las la-check'></i>}</td>
                    <td
                      title={format(new Date(perfil.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    >
                      {format(new Date(perfil.criado_em), "d 'de' LLLL 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                  </tr>
                ))}
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
            <table>
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
