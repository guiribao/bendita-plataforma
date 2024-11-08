//@ts-nocheck
import { FormaPagamento } from '@prisma/client';
import { json, unstable_parseMultipartFormData } from '@remix-run/node';

import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import { CurrencyInput } from 'react-currency-mask';

import feiraPageStyle from '~/assets/css/feira-page.css';
import Minicards from '~/component/Minicards';
import pegarEventoFeiraPorId from '~/domain/Calendario/pegar-evento-feira-por-id.server';
import criarNovaOperacaoFeira from '~/domain/Financeiro/criar-nova-operacao-feira.server';
import pegarOperacoesPorFeirante from '~/domain/Financeiro/pegar-operacoes-por-feirante-id.server';
import pegarPerfilPeloIdUsuario from '~/domain/Perfil/perfil-pelo-id-usuario.server';
import { authenticator } from '~/secure/authentication.server';

import uploadIcon from '~/assets/img/undraw/upload_photo.svg';
import { getObjectUrlFromS3, s3UploaderHandler } from '~/storage/s3.service.server';
import editarConfiguracoesBanca from '~/domain/Perfil/editar-perfil-feirante.server';
import DeletingModal from '~/component/DeletingModal';
import deletarOperacaoPorId from '~/domain/Financeiro/deletar-operacao-por-id.server';
import editarPagamentoFeirante from '~/domain/Calendario/editar-pagamento-feirante.server';

export const meta: MetaFunction = ({ data }) => {
  return [
    {
      charset: 'utf-8',
      title: `${data.feira.titulo} - ChaveCloud`,
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: `${data.feira.descricao} - Feira do Chave`,
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: feiraPageStyle }];
};

export async function action({ request, params }: ActionFunctionArgs) {
  let usuario: Usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let { id } = params;
  let errors = {};

  const form = await unstable_parseMultipartFormData(request, s3UploaderHandler);

  let action = form.get('_action') as string;

  if (action === 'nova_venda') {
    let produto = form.get('produto') as string;
    let cliente = form.get('cliente') as string;
    let formaPagamento = form.get('forma_pagamento') as string;
    let valor = form.get('valor_real') as string;
    let observacao = form.get('observacao') as string;
    let eventoId = form.get('eventoId') as string;
    let feiranteId = form.get('feiraId') as string;

    await criarNovaOperacaoFeira(
      produto,
      cliente,
      formaPagamento,
      Number(valor),
      observacao,
      Number(eventoId),
      Number(feiranteId),
      Number(usuario.id)
    );
  }

  if (action === 'editar_configuracao') {
    let perfil_id = form.get('perfil_id') as string;
    let nome_banca = form.get('nome_banca') as string;
    let logo_banca = form.get(`logo_banca_${perfil_id}`);

    let evento_feirante_id = form.get('evento_feirante_id') as string;
    let pagamento_conta = form.get('pagamento_conta') as string;
    let pagamento_agencia = form.get('pagamento_agencia') as string;
    let pagamento_banco = form.get('pagamento_banco') as string;
    let pagamento_chave_pix = form.get('pagamento_chave_pix') as string;

    await editarConfiguracoesBanca({
      perfilId: Number(perfil_id),
      nomeBanca: nome_banca,
      logoBanca: logo_banca,
    });

    await editarPagamentoFeirante({
      eventoFeiranteId: Number(evento_feirante_id),
      pagamentoConta: pagamento_conta,
      pagamentoAgencia: pagamento_agencia,
      pagamentoBanco: pagamento_banco,
      pagamentoChavePix: pagamento_chave_pix
    })
  }

  if (action === 'delete') {
    let operacaoId: number = Number(form.get('resource') as string);
    await deletarOperacaoPorId(operacaoId);
    return redirect(`/calendario/feira/${id}?consulting`);
  }

  return redirect(`/calendario/feira/${id}`);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let perfil = await pegarPerfilPeloIdUsuario(usuario.id);
  let APP_URL = process.env.APP_URL;
  let { id } = params;

  let feira = await pegarEventoFeiraPorId(id);

  feira.Feirantes.forEach((feirante) => {
    feirante.perfil.logo_banca = feirante.perfil?.logo_banca
      ? `https://chave-files.s3.sa-east-1.amazonaws.com/${feirante.perfil.logo_banca}`
      : null;

    if (feirante.perfilId == perfil.id) feira.eventoFeirante = feirante;
  });

  if (feira.eventoFeirante)
    feira.operacoes = await pegarOperacoesPorFeirante(feira?.eventoFeirante?.id);

  return json({ feira, APP_URL });
}

export default function FeiraIndex() {
  const { feira, APP_URL } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [params, setParams] = useSearchParams();

  let [consultando, setConsultando] = useState(params.has('consulting'));

  let [vendendo, setVendendo] = useState(params.has('selling'));
  let [valorReal, setValorReal] = useState(0);

  let [configurando, setConfigurando] = useState(params.has('config'));

  // Dados para modal deletar item
  let [deleting, setDeleting] = useState(false);
  let [deletingItem, setDeletingItem] = useState({});

  let totalVendido = 0;
  let totalVendidoPorTipo = {
    PIX: 0,
    CREDITO: 0,
    DINHEIRO: 0,
  };

  let saldoNoFeirante = 0;
  let saldoNoChave = 0;

  let balanco = 0;
  let feedbackPrompt = 'Ainda não calculado';

  let totalLucro = 0;
  let totalArrecadacao = 0;

  if (feira.operacoes) {
    feira?.operacoes.forEach((operacao) => {
      if (operacao.forma_pagamento == 'PIX') {
        totalVendidoPorTipo['PIX'] += Number(operacao.valor);
        saldoNoChave += Number(operacao.valor);
      } else if (operacao.forma_pagamento == 'DINHEIRO') {
        totalVendidoPorTipo['DINHEIRO'] += Number(operacao.valor);
        saldoNoFeirante += Number(operacao.valor);
      } else {
        totalVendidoPorTipo['CREDITO'] += Number(operacao.valor);
        saldoNoFeirante += Number(operacao.valor);
      }

      totalVendido += Number(operacao.valor);
      totalLucro = totalVendido * 0.8;
      totalArrecadacao = totalVendido * 0.2;

      balanco = totalVendido - saldoNoFeirante - totalArrecadacao;

      if (balanco == 0) {
        feedbackPrompt = `Tudo certinho, as contas bateram!`;
      } else if (balanco > 0) {
        // O CHAVE irá repassar pra você
        feedbackPrompt = `Saldo a receber do CHAVE: ${balanco.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}`;
      } else {
        // Você deve repassar para o CHAVE
        feedbackPrompt = `Saldo a enviar para o CHAVE: ${balanco
          .toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })
          .replace('-', '')}`;
      }
    });
  }

  let minicardsData = [
    {
      quantidade: totalVendido.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      label: 'Total vendas - ver extrato',
      icon: 'las la-dollar-sign',
      callback: handleConsultando,
      classes: 'card-clicavel',
    },

    {
      quantidade: '+venda',
      label: 'Cadastrar uma nova venda',
      icon: 'las la-dolly',
      callback: handleVendendo,
      classes: 'card-clicavel',
    },
    {
      quantidade: 'configurar',
      label: 'Editar informações da banca',
      icon: 'las la-pen',
      callback: handleConfigurando,
      classes: 'card-clicavel',
    },
  ];

  let minicardsExtratoData = [
    {
      quantidade: totalArrecadacao.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      label: 'Saldo arrecadação',
      icon: 'las la-dolly',
    },
    {
      quantidade: totalLucro.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      label: 'Saldo lucro',
      icon: 'las la-hand-holding-usd',
    },
  ];

  function handleConsultando() {
    if (vendendo) setVendendo(!vendendo);
    if (configurando) setConfigurando(!configurando);
    setConsultando(!consultando);
  }

  function handleVendendo() {
    if (consultando) setConsultando(!consultando);
    if (configurando) setConfigurando(!configurando);
    setVendendo(!vendendo);
  }

  function handleConfigurando() {
    if (consultando) setConsultando(!consultando);
    if (vendendo) setVendendo(!vendendo);
    setConfigurando(!configurando);
  }

  function openDeletingModal(operacao) {
    setDeleting(true);
    setDeletingItem(operacao);
  }

  function closeDeletingModal() {
    setDeleting(false);
    setDeletingItem({});
  }

  useEffect(() => {
    setConsultando(consultando);
    setVendendo(false);
    setConfigurando(false);
  }, [isSubmitting, params]);

  return (
    <main>
      {deleting && (
        <DeletingModal item={deletingItem} close={closeDeletingModal} entity='financeiro feira' />
      )}
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1></h1>
            <Link to={'/calendario'}>Voltar</Link>
          </div>
          <div className='view-body'>
            <div className='feira'>
              <div className='feirante' data-role='CARDS_FEIRANTE'>
                <Minicards cards={minicardsData} />
              </div>
              {consultando && (
                <div className='group view extrato' data-role='FEIRANTE_EXTRATO'>
                  <div className='form-view'>
                    <h1>
                      Saldos{' '}
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        onClick={handleConsultando}
                        style={{ cursor: 'pointer' }}
                      >
                        <path d='M23 20.168l-8.185-8.187 8.185-8.174-2.832-2.807-8.182 8.179-8.176-8.179-2.81 2.81 8.186 8.196-8.186 8.184 2.81 2.81 8.203-8.192 8.18 8.192z' />
                      </svg>
                    </h1>
                    <Minicards cards={minicardsExtratoData} />
                  </div>
                  <div className='form-view'>
                    <h1>Extrato</h1>
                    <div className='form-view detalhamento'>
                      <h2>Vendas por método de pagamento</h2>
                      <ul>
                        <li>
                          <h4>PIX</h4>
                          <p>
                            {totalVendidoPorTipo['PIX'].toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </li>
                        <li>
                          <h4>Dinheiro</h4>
                          <p>
                            {totalVendidoPorTipo['DINHEIRO'].toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </li>
                        <li>
                          <h4>Crédito / Negociado</h4>
                          <p>
                            {totalVendidoPorTipo['CREDITO'].toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </li>
                      </ul>
                    </div>

                    <div className='tabela'>
                      <table>
                        <thead>
                          <tr>
                            <td>Produto</td>
                            <td>Cliente</td>
                            <td>Valor</td>
                            <td>Forma de pagamento</td>
                            <td>Observações</td>
                            <td></td>
                          </tr>
                        </thead>
                        <tbody>
                          {feira.operacoes?.length === 0 && (
                            <tr>
                              <td style={{ textAlign: 'center' }} colSpan={7}>
                                Nenhum dado foi encontrado
                              </td>
                            </tr>
                          )}
                          {feira.operacoes?.map((operacao) => {
                            return (
                              <tr key={operacao.id}>
                                <td>{operacao.produto}</td>
                                <td>{operacao.nome_cliente}</td>
                                <td>
                                  {Number(operacao.valor).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </td>
                                <td>{operacao.forma_pagamento}</td>
                                <td>{operacao.observacao}</td>
                                <td>
                                  <div id='actions'>
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

                    <div className='form-view historico'>
                      <div className='form-vew historico-info'>
                        <h4>N° de vendas</h4>
                        <span>{feira.operacoes?.length}</span>
                      </div>

                      <div className='form-vew historico-info'>
                        <h4>$ de vendas</h4>
                        <span>
                          {totalVendido.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className='form-view resumo'>
                      <h2>Resumo financeiro</h2>
                      <ul>
                        <li>
                          <h4>Pago na banca</h4>
                          <p>
                            {saldoNoFeirante.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </li>
                        <li>
                          <h4>Pago ao CHAVE</h4>
                          <p>
                            {saldoNoChave.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </li>
                        <li>
                          <h4>Saldo balancete</h4>
                          <p>
                            {balanco.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </li>
                      </ul>
                    </div>
                    <div className='form-view feedback'>
                      <h2 className='feedback'>Resumo do balancete</h2>
                      <p>{feedbackPrompt}</p>
                    </div>
                  </div>
                </div>
              )}

              {vendendo && (
                <Form
                  method='post'
                  encType='multipart/form-data'
                  className='group view venda'
                  data-role='FEIRANTE_VENDA'
                >
                  <div className='form-view'>
                    <input type='hidden' name='_action' value='nova_venda' />
                    <input type='hidden' name='eventoId' value={feira.id} />
                    <input type='hidden' name='feiraId' value={feira?.eventoFeirante?.id} />
                    <h1>
                      Nova venda{' '}
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        onClick={handleVendendo}
                        style={{ cursor: 'pointer' }}
                      >
                        <path d='M23 20.168l-8.185-8.187 8.185-8.174-2.832-2.807-8.182 8.179-8.176-8.179-2.81 2.81 8.186 8.196-8.186 8.184 2.81 2.81 8.203-8.192 8.18 8.192z' />
                      </svg>
                    </h1>
                    <div className='form-group'>
                      <label htmlFor='produto'>Produto</label>
                      <input
                        type='text'
                        id='produto'
                        placeholder='Um ou mais produtos'
                        name='produto'
                        defaultValue={''}
                        autoComplete='off'
                        required
                      />
                    </div>
                    <div className='form-group'>
                      <label htmlFor='cliente'>Nome cliente</label>
                      <input
                        type='text'
                        id='cliente'
                        name='cliente'
                        defaultValue={''}
                        autoComplete='off'
                        required
                      />
                    </div>
                    <div className='form-group'>
                      <label htmlFor='forma_pagamento'>Forma de pagamento *</label>
                      <select
                        name='forma_pagamento'
                        id='forma_pagamento'
                        defaultValue={''}
                        required
                      >
                        <option value={FormaPagamento.PIX}>Pix</option>
                        <option value={FormaPagamento.DINHEIRO}>Dinheiro</option>
                        <option value={FormaPagamento.CREDITO_AVISTA}>Crédito a vista</option>
                        <option value={FormaPagamento.CREDITO_PARCELADO}>Crédito Parcelado</option>
                        <option value={FormaPagamento.NEGOCIACAO}>Negociação</option>
                      </select>
                    </div>
                    <div className='form-group valor'>
                      <label htmlFor='valor'>Valor da venda</label>
                      <input type='hidden' name='valor_real' defaultValue={valorReal} />
                      <CurrencyInput
                        name='valor'
                        id='valor'
                        onChangeValue={(event, original, masked) => {
                          setValorReal(Number(original));
                        }}
                      ></CurrencyInput>
                    </div>
                    <div className='form-group'>
                      <label htmlFor='observacao'>Observação</label>
                      <input
                        type='text'
                        id='observacao'
                        name='observacao'
                        defaultValue={''}
                        autoComplete='off'
                      />
                    </div>

                    <div className='form-group'>
                      <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
                        {!isSubmitting && 'Cadastrar'}
                        {isSubmitting && 'Cadastrando'}
                      </button>
                    </div>
                  </div>
                </Form>
              )}

              {configurando && (
                <Form
                  method='post'
                  className='group view configuracao'
                  encType='multipart/form-data'
                  data-role='FEIRANTE_CONFIGURACAO'
                >
                  <div className='form-view'>
                    <h1>
                      Configurar banca{' '}
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        onClick={handleConfigurando}
                        style={{ cursor: 'pointer' }}
                      >
                        <path d='M23 20.168l-8.185-8.187 8.185-8.174-2.832-2.807-8.182 8.179-8.176-8.179-2.81 2.81 8.186 8.196-8.186 8.184 2.81 2.81 8.203-8.192 8.18 8.192z' />
                      </svg>
                    </h1>
                    <input type='hidden' name='_action' value='editar_configuracao' />
                    <input
                      type='hidden'
                      name='perfil_id'
                      id='perfil_id'
                      value={feira.eventoFeirante.perfil.id}
                    />
                    <input
                      type='hidden'
                      name='evento_feirante_id'
                      id='evento_feirante_id'
                      value={feira.eventoFeirante.id}
                    />

                    
                    <div className='form-group'>
                      <img src={uploadIcon} width={256} alt='Escolha um logotipo para sua banca' />
                      <label htmlFor='logo_banca'>Escolha um logotipo para sua banca</label>
                      <input
                        type='file'
                        name={`logo_banca_${feira.eventoFeirante.perfil.id}`}
                        id='logo_banca'
                        defaultValue={''}
                      />
                      <p>É recomendada uma imagem de 500 x 500</p>
                    </div>

                    <div className='form-group'>
                      <label htmlFor='nome_banca'>Qual o nome da sua banca?</label>
                      <input
                        type='text'
                        id='nome_banca'
                        placeholder='O nome da sua banca'
                        name='nome_banca'
                        defaultValue={feira.eventoFeirante.perfil?.nome_banca || ''}
                        autoComplete='off'
                      />
                    </div>

                    <div className='form-disclaimer'>
                      <h3>Configuração financeira</h3>
                      <div className='form-group'>
                        <label htmlFor='pagamento_banco'>Banco</label>
                        <input
                          type='text'
                          id='pagamento_banco'
                          placeholder='Nome da instituição bancária'
                          name='pagamento_banco'
                          defaultValue={feira.eventoFeirante.pagamento_banco || ''}
                          autoComplete='off'
                        />
                      </div>
                      <div className='form-group'>
                        <label htmlFor='pagamento_agencia'>Agência</label>
                        <input
                          type='text'
                          id='pagamento_agencia'
                          placeholder='Número da sua agência'
                          name='pagamento_agencia'
                          defaultValue={feira.eventoFeirante.pagamento_agencia || ''}
                          autoComplete='off'
                        />
                      </div>
                      <div className='form-group'>
                        <label htmlFor='pagamento_conta'>Conta</label>
                        <input
                          type='text'
                          id='pagamento_conta'
                          placeholder='Conta que receberá os valores'
                          name='pagamento_conta'
                          defaultValue={feira.eventoFeirante.pagamento_conta || ''}
                          autoComplete='off'
                        />
                      </div>
                      <div className='form-group'>
                        <label htmlFor='pagamento_chave_pix'>Chave PIX</label>
                        <input
                          type='text'
                          id='pagamento_chave_pix'
                          placeholder='Chave para recebimento dos valores'
                          name='pagamento_chave_pix'
                          defaultValue={feira.eventoFeirante.pagamento_chave_pix || ''}
                          autoComplete='off'
                        />
                      </div>
                    </div>

                    <div className='form-group'>
                      <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
                        {!isSubmitting && 'Salvar'}
                        {isSubmitting && 'Salvando'}
                      </button>
                    </div>
                  </div>
                </Form>
              )}

              <div className='group view basicas'>
                <div className='group-header'>
                  <h1>Informações básicas</h1>
                </div>

                <div className='field-group'>
                  <div className='field'>
                    <h3 htmlFor='descricao'>{feira?.titulo}</h3>
                    <p id='descricao'>{feira.descricao}</p>
                  </div>
                </div>

                <div className='field-group'>
                  <div className='field'>
                    <h3 htmlFor='descricao'>Data e hora</h3>
                    <p id='descricao'>
                      {format(new Date(feira.data_hora), "d 'de' LLLL 'de' yyyy', 'HH:mm'h'", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className='group view informacoes'>
                <div className='group-header'>
                  <h1>Feirantes</h1>
                </div>

                <div className='field-group detalhes-feirantes'>
                  {feira.Feirantes.length === 0 && <p>Nenhum feirante foi encontrado</p>}

                  <ul>
                    {feira.Feirantes.map((feirante) => (
                      <li className='field' key={feirante.id}>
                        <img
                          src={feirante.perfil?.logo_banca || `${APP_URL}/user.png`}
                          alt={`Logo da barraca do feirante - ${feirante.perfil.nome} ${feirante.perfil.sobrenome}`}
                          width={84}
                        />
                        <p>
                          {feirante.perfil.nome_banca ||
                            `${feirante.perfil.nome} ${feirante.perfil.sobrenome}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
