import { FinalidadeOperacao } from '@prisma/client';
import { json, redirect } from '@remix-run/node';
import type { ActionFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import DeletingModal from '~/component/DeletingModal';
import pegarEventosFeiras from '~/domain/Calendario/pegar-eventos-feiras.server';
import pegarFeirantesPorFeira from '~/domain/Calendario/pegar-feirantes-por-feiras.server';
import deletarOperacaoPorId from '~/domain/Financeiro/deletar-operacao-por-id.server';
import pegarOperacoes from '~/domain/Financeiro/pegar-operacoes.server';
import { gerarDescricaoOperacaoFeira } from '~/shared/Operacao.util';

export const meta: MetaFunction = () => {
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

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const action: string = form.get('_action') as string;
  const operacaoId: number = Number(form.get('resource') as string);

  if (action !== 'delete' && !operacaoId) return { success: false };

  await deletarOperacaoPorId(operacaoId);

  return { success: true };
};

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: Limit e offset - Paginação
  let operacoes = await pegarOperacoes();

  operacoes = operacoes.map((operacao) => {
    let valor = parseFloat(operacao.valor).toLocaleString('pt-br', {
      minimumFractionDigits: 2,
      style: 'currency',
      currency: 'BRL',
    });

    operacao.valor = valor;
    return operacao;
  });

  let feiras = await pegarEventosFeiras()

  return json({ operacoes, feiras });
}

export default function FinanceiroIndex() {
  const { operacoes, feiras } = useLoaderData();
  const navigate = useNavigate();

  // Dados para modal deletar item
  let [deleting, setDeleting] = useState(false);
  let [deletingItem, setDeletingItem] = useState({});

  let [feirantes, setFeirantes] = useState([])

  function openDeletingModal(operacao) {
    setDeleting(true);
    setDeletingItem(operacao);
  }

  function closeDeletingModal() {
    setDeleting(false);
    setDeletingItem({});
  }

  function verOperacao(operacaoId) {
    navigate(`/financeiro/${operacaoId}`);
  }

  async function carregarFeirantes(event) {
    let feiraId = event.target.value

    if (feiraId == 0) {
      setFeirantes([])
      return
    }

    let feirantes = await fetch(`/feira/${feiraId}/feirante`, { method: 'get' })
      .then((res) => res.json());

    setFeirantes(feirantes)
  }

  return (
    <main>
      {deleting && (
        <DeletingModal item={deletingItem} close={closeDeletingModal} entity='financeiro' />
      )}

      {/* Financeiro geral CHAVE: Admin */}
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
                  <td>ID</td>
                  <td>Descrição</td>
                  <td>Tipo</td>
                  <td>Finalidade</td>
                  <td>Valor</td>
                  <td>Criado em</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {operacoes.length === 0 && (
                  <tr>
                    <td style={{ textAlign: 'center' }} colSpan={7}>
                      Nenhum dado foi encontrado
                    </td>
                  </tr>
                )}
                {operacoes.map((operacao) => {
                  if (operacao.finalidade == FinalidadeOperacao.FEIRA)
                    operacao.descricao = gerarDescricaoOperacaoFeira(operacao);

                  return (
                    <tr key={operacao.id}>
                      <td>
                        <Link to={`/financeiro/${operacao.id}`}>{operacao.id}</Link>
                      </td>
                      <td>
                        <Link to={`/financeiro/${operacao.id}`}>{operacao.descricao}</Link>
                      </td>
                      <td>{operacao.tipo}</td>
                      <td>{operacao.finalidade}</td>
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
                      <td>
                        <div id='actions'>
                          <Link to={`/financeiro/${operacao.id}`}>
                            <i className='lar la-eye'></i>
                          </Link>
                          <Link to={`/financeiro/${operacao.id}/editar`}>
                            <i className='las la-pen'></i>
                          </Link>
                          <button onClick={() => openDeletingModal(operacao)}>
                            <i className='las la-trash'></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>

      {/* Financeiro das feiras: Admin e Feirante */}
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1>Financeiro feiras</h1>
            <div>
              <label className='select'>
                <select onChange={carregarFeirantes}>
                  <option value="0" defaultChecked>Selecionar feira</option>
                  {feiras.map(feira => (
                    <option key={feira.id} value={feira.id}>{feira.titulo}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Nome banca</td>
                  <td>Responsável</td>
                  <td style={{ textAlign: "center" }}>Status caixa</td>
                  <td style={{ textAlign: "center" }}>Chave PIX</td>
                  <td style={{ textAlign: "center" }}>Qtd. vendas</td>
                  <td style={{ textAlign: "center" }}>Total vendido</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {feirantes.length === 0 && (
                  <tr>
                    <td style={{ textAlign: 'center' }} colSpan={7}>
                      Nenhum dado para mostrar
                    </td>
                  </tr>
                )}
                {feirantes.map((feirante) => {
                  return (
                    <tr key={feirante.id}>
                      <td style={{ maxWidth: "240px" }}>
                        {feirante.perfil.nome_banca}
                      </td>
                      <td style={{ maxWidth: "180px" }}>
                        {feirante.perfil.nome} {feirante.perfil.sobrenome}
                      </td>
                      <td style={{ textAlign: "center" }}>{feirante.caixa_aberto ? "ABERTO" : "FECHADO"}</td>
                      <td style={{ textAlign: "center" }}>
                        {feirante.pagamento_chave_pix}
                      </td>
                      <td style={{ textAlign: "center" }}>{feirante.Operacao.length}</td>
                      <td style={{ textAlign: "center" }}>{feirante.valorVendas.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}</td>
                      <td>
                        <div id='actions'>
                          <Link to={`/feira/${feirante.eventoId}/feirante/${feirante.perfilId}`}>
                            <i className="las la-search-dollar"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
