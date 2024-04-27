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

    await editarConfiguracoesBanca({
      perfilId: Number(perfil_id),
      nomeBanca: nome_banca,
      logoBanca: logo_banca,
    });
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

  feira.Feirantes.forEach(async (feirante) => {
    if (feirante.perfilId == perfil.id) feira.eventoFeirante = feirante;

    feirante.perfil.logo_banca = feirante.perfil?.logo_banca
      ? await getObjectUrlFromS3(feirante.perfil.logo_banca).then((r) => r)
      : feirante.perfil.logo_banca;
  });

  if (feira.eventoFeirante)
    feira.operacoes = await pegarOperacoesPorFeirante(feira?.eventoFeirante?.id);

  console.log(feira);
  return json({ feira, APP_URL });
}

export default function FeiraIndex() {
  const { feira, APP_URL } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  let [vendendo, setVendendo] = useState(false);
  let [valorReal, setValorReal] = useState(0);

  let [configurando, setConfigurando] = useState(false);

  let somaValorOperacoes = 0;
  if (feira.operacoes)
    somaValorOperacoes = feira.operacoes.reduce(
      (acumulado, operacao) => acumulado + Number(operacao.valor),
      0
    );

  let minicardsData = [
    {
      quantidade: somaValorOperacoes.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      label: 'Total vendido',
      icon: 'las la-hand-holding-usd',
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

  function handleVendendo() {
    if (configurando) setConfigurando(!configurando);

    setVendendo(!vendendo);
  }

  function handleConfigurando() {
    if (vendendo) setVendendo(!vendendo);
    setConfigurando(!configurando);
  }

  useEffect(() => {
    setVendendo(false);
  }, [isSubmitting]);

  console.log(feira);

  return (
    <main>
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
              {vendendo && (
                <Form method='post' className='group view venda' data-role='FEIRANTE_VENDA'>
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
                    <select name='forma_pagamento' id='forma_pagamento' defaultValue={''} required>
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
                    <input type='hidden' name='_action' value='editar_configuracao' />
                    <input
                      type='hidden'
                      name='perfil_id'
                      id='perfil_id'
                      value={feira.eventoFeirante.perfil.id}
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
                  <ul>
                    {feira.Feirantes.map((feirante) => (
                      <li className='field' key={feirante.id}>
                        <img
                          src={feirante.perfil?.logo_banca || `${APP_URL}/user.png`}
                          alt={`Logo da barraca do feirante - ${feirante.perfil.nome} ${feirante.perfil.sobrenome}`}
                          width={32}
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
