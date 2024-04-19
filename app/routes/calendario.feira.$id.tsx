//@ts-nocheck
import { FormaPagamento } from '@prisma/client';
import { json } from '@remix-run/node';

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

  let form = await request.formData();
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
  feira.eventoFeirante = feira.Feirantes.find((feirante) => feirante.perfilId == perfil.id);

  if (feira.eventoFeirante)
    feira.operacoes = await pegarOperacoesPorFeirante(feira?.eventoFeirante.id);

  return json({ feira, APP_URL });
}

export default function FeiraIndex() {
  const { feira, APP_URL } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  let [vendendo, setVendendo] = useState(false);
  let [valorReal, setValorReal] = useState(0);

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
  ];

  function handleVendendo() {
    setVendendo(!vendendo);
  }

  useEffect(() => {
    setVendendo(false);
  }, [isSubmitting]);

  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1></h1>
            <Link to={'/calendario'}>Voltar</Link>
          </div>
          <div className='view-body'>
            {vendendo && (
              <Form method='post' className='venda' data-role='FEIRANTE_VENDA'>
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

            <div className='feira'>
              <div className='feirante' data-role='CARDS_FEIRANTE'>
                <Minicards cards={minicardsData} />
              </div>

              <div className='informacoes'>
                <div className='detalhes-feira'>
                  <div className='descricao'>
                    <h1>{feira?.titulo}</h1>
                    <p>{feira.descricao}</p>
                  </div>
                  <div className='data'>
                    <h2>Data</h2>
                    <p>
                      {format(new Date(feira.data_hora), "d 'de' LLLL 'de' yyyy', 'HH:mm'h'", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className='detalhes-feirantes'>
                  <h1>Feirantes</h1>
                  <ul>
                    {feira.Feirantes.map((feirante) => (
                      <li key={feirante.id}>
                        <img
                          src={`http://localhost:3000/user.png`}
                          alt={`Logo da barraca do feirante - ${feirante.perfil.nome} ${feirante.perfil.sobrenome}`}
                          width={32}
                        />
                        <p>
                          {feirante.nome_barraca ||
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
