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
import pegarFeirantesPorFeira from '~/domain/Calendario/pegar-feirantes-por-feiras.server';
import pegarFeirantePorFeiraPerfil from '~/domain/Calendario/pegar-feirante-por-feira-perfil';

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

export async function loader({ request, params }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let { id, feiranteId } = params;

  let feira = await pegarEventoFeiraPorId(id);
  let feirante = await pegarFeirantePorFeiraPerfil(id, feiranteId)

  delete feira.Feirantes

  return json({ feira, feirante });
}

export default function FeiraIndex() {
  const { feira, feirante } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  let [valorReal, setValorReal] = useState(0);
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

  if (feirante.Operacao) {
    feirante.Operacao.forEach((operacao) => {
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
      totalArrecadacao = (feirante.perfil.membro) ? totalVendido * .2 : totalVendido * .3;
      totalLucro = totalVendido - totalArrecadacao;
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
      label: 'Total vendas',
      icon: 'las la-dollar-sign',
      classes: '',
    },
    {
      quantidade: totalArrecadacao.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      label: 'Saldo arrecadação',
      icon: 'las la-dolly',
      classes: '',
    },
    {
      quantidade: totalLucro.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      label: 'Saldo lucro',
      icon: 'las la-hand-holding-usd',
      classes: '',
    },
  ];

  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1></h1>
            <Link to={'/financeiro'}>Voltar</Link>
          </div>
          <div className='view-body'>
            <div className='feira'>
              <div className='feirante' data-role='CARDS_FEIRANTE'>
                <Minicards cards={minicardsData} />
              </div>

              <div className='group view extrato' data-role='FEIRANTE_EXTRATO'>
                <div className='form-view'>

                  <h1>Extrato de {(feirante.perfil.nome_banca) ? feirante.perfil.nome_banca : `${feirante.perfil.nome} ${feirante.perfil.sobrenome}`}</h1>
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
                        {feirante.Operacao?.length === 0 && (
                          <tr>
                            <td style={{ textAlign: 'center' }} colSpan={7}>
                              Nenhum dado foi encontrado
                            </td>
                          </tr>
                        )}
                        {feirante.Operacao?.map((operacao) => {
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
                              <td></td>
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

              <div className='group view basicas'>
                <div className='group-header'>
                  <h1>Informações bancárias</h1>
                </div>

                <div className='field-group'>
                  <div className='field'>
                    <h3 htmlFor='descricao'>Banco</h3>
                    <p id='descricao'>{feirante.pagamento_banco||"Não informado"}</p>
                  </div>
                </div>

                <div className='field-group'>
                  <div className='field'>
                    <h3 htmlFor='descricao'>Agência</h3>
                    <p id='descricao'>{feirante.pagamento_agencia||"Não informado"}</p>
                  </div>
                </div>

                <div className='field-group'>
                  <div className='field'>
                    <h3 htmlFor='descricao'>Conta</h3>
                    <p id='descricao'>{feirante.pagamento_conta||"Não informado"}</p>
                  </div>
                </div>

                <div className='field-group'>
                  <div className='field'>
                    <h3 htmlFor='descricao'>Chave PIX</h3>
                    <p id='descricao'>{feirante.pagamento_chave_pix||"Não informado"}</p>
                  </div>
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
