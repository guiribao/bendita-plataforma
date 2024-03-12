import { LoaderArgs, json } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import pegarOperacoes from '~/domain/Operation/pegar-operacoes.server';
import { getPageInfo } from '~/shared/PageInfo';

export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Financeiro - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Gerenciamento de operações financeiras de entrada e saída do Chave',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: Limit e offset - Paginação
  let operacoes = await pegarOperacoes();

  operacoes = operacoes.map((operacao) => {
    let valor = parseFloat(operacao.valor).toLocaleString('pt-br', {
      minimumFractionDigits: 2,
    });

    operacao.valor = valor;
    return operacao;
  });

  return json({ operacoes });
}

export default function FinanceiroIndex() {
  const { operacoes } = useLoaderData();
  
  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1> </h1>
            <Link to={'/financeiro/novo'}>+ Operação</Link>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Id</td>
                  <td>Descrição</td>
                  <td>Tipo</td>
                  <td>Valor R$</td>
                  <td>Criado em</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {operacoes.map((operacao) => (
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
                    <td id='actions'>
                      <Link to={`/financeiro/${operacao.id}`}>
                        <i className='lar la-eye'></i>
                      </Link>
                      <Link to={`/financeiro/${operacao.id}/editar`}>
                        <i className='las la-pen'></i>
                      </Link>
                      <button onClick={() => openDeletingModal(captador)}>
                        <i className='las la-trash'></i>
                      </button>
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
