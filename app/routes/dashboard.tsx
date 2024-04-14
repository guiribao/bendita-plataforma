//@ts-nocheck
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CurrencyInput } from 'react-currency-mask';
import Minicards from '~/component/Minicards';
import pegarDadosEventosDashboard from '~/domain/Calendario/pegar-dados-eventos-dashboard.server';
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
  // - Get perfis data
  let { ultimosDezPerfis, qtdPerfis } = await pegarDadosPerfisDashboard();
  // - Get eventos data
  let eventos = await pegarDadosEventosDashboard();

  return json({ ultimasDezOperacoes, qtdOperacoes, ultimosDezPerfis, qtdPerfis, eventos });
}

export default function DashboardIndex() {
  let { eventos, ultimasDezOperacoes, qtdOperacoes, ultimosDezPerfis, qtdPerfis } = useLoaderData();

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
      <Minicards cards={minicardsData} role='MINICARDS_ADM' />

      <div className='cards'>
        <div className='view operacoes' data-role='ULTIMAS_OPERACOES'>
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
                {ultimasDezOperacoes.length === 0 && (
                  <tr>
                    <td style={{ textAlign: 'center' }} colSpan={5}>
                      Nenhum dado foi encontrado
                    </td>
                  </tr>
                )}
                {ultimasDezOperacoes.map((operacao) => (
                  <tr key={operacao.id}>
                    <td>{operacao.id}</td>
                    <td>{operacao.descricao}</td>
                    <td>{operacao.tipo}</td>
                    <td>
                      <CurrencyInput
                        name='valor'
                        defaultValue={operacao.valor * 1}
                        readOnly
                        className="valor-operacao"
                      ></CurrencyInput>
                    </td>
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

        <div className='view ultimos-perfis' data-role='ULTIMOS_PERFIS'>
          <div className='view-header'>
            <h1>Últimos perfis</h1>
            <Link to={'/gente'}>+ Gente</Link>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Nome</td>
                  <td>Grupo</td>
                  <td>É membro</td>
                </tr>
              </thead>
              <tbody>
                {ultimosDezPerfis.length === 0 && (
                  <tr>
                    <td style={{ textAlign: 'center' }} colSpan={7}>
                      Nenhum dado foi encontrado
                    </td>
                  </tr>
                )}
                {ultimosDezPerfis.map((perfil) => (
                  <tr key={perfil.id}>
                    <td>{perfil.id}</td>
                    <td>
                      {perfil.nome} {perfil.sobrenome}
                    </td>
                    <td>{perfil.grupo}</td>
                    <td>{perfil.membro && <i className='las la-check'></i>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>

        <div className='view eventos' data-role='PROXIMOS_EVENTOS'>
          <div className='view-header'>
            <h1>Próximos eventos</h1>
            <Link to={'/calendario'}>+ Calendário</Link>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Tipo</td>
                  <td>Titulo</td>
                  <td style={{ minWidth: '180px' }}>Data e hora</td>
                </tr>
              </thead>
              <tbody>
                {eventos.length === 0 && (
                  <tr>
                    <td style={{ textAlign: 'center' }} colSpan={7}>
                      Nenhum dado foi encontrado
                    </td>
                  </tr>
                )}
                {eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>{evento.id}</td>
                    <td>{evento.tipo}</td>
                    <td>{evento.titulo}</td>
                    <td
                      title={format(new Date(evento.data_hora), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    >
                      {format(new Date(evento.data_hora), "dd/MM/yyyy 'às' HH:mm", {
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
      </div>
    </main>
  );
}
