import { FinalidadeOperacao, TipoOperacao } from '@prisma/client';
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, Link, json, redirect, useLoaderData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
//@ts-ignore
import { CurrencyInput } from 'react-currency-mask';

import { authenticator } from '~/secure/authentication.server';
import pegarOperacaoPorId from '~/domain/Financeiro/pegar-operacao-por-id.server';

import novaOperacaoPageStyle from '~/assets/css/nova-operacao-page.css';

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

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: novaOperacaoPageStyle }];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let operacao = await pegarOperacaoPorId(params.id);

  return json({ operacao });
}

export default function FinanceiroEditarIndex() {
  let { operacao } = useLoaderData();

  let [referencia, setReferencia] = useState(operacao.perfil);

  function gerarDescricaoOperacaoFeira(operacao) {
    let nomeBarraca = operacao.feirante?.nome_barraca || `${operacao.feirante.perfil.nome} ${operacao.feirante.perfil.sobrenome}`
    return `${operacao.evento.titulo} - venda de ${nomeBarraca}`
  }

  if(operacao.finalidade == FinalidadeOperacao.FEIRA) operacao.descricao = gerarDescricaoOperacaoFeira(operacao)
  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1>Operação: #{operacao.id}</h1>
            <div className='view-header-actions'>
              <Link to={`/financeiro/${operacao.id}/editar`}>Editar</Link>
              <Link to={'/financeiro'}>Voltar</Link>
            </div>
          </div>
          <div className='view-body'>
            <Form method='post' className='form-financeiro'>
              {/* TIPO               */}

              <div className='tipo-operacao'>
                <div className='form-group operacao'>
                  <input
                    type='radio'
                    id='tipo_entrada'
                    name='tipo'
                    value={TipoOperacao.ENTRADA}
                    placeholder='Entrada'
                    defaultChecked={operacao.tipo === TipoOperacao.ENTRADA}
                    disabled
                  />
                  <label id='label-tipo-entrada' htmlFor='tipo_entrada'>
                    Entrada
                  </label>
                </div>
                <div className='form-group operacao'>
                  <input
                    type='radio'
                    id='tipo_saida'
                    name='tipo'
                    value={TipoOperacao.SAIDA}
                    defaultChecked={operacao.tipo === TipoOperacao.SAIDA}
                    placeholder='Saída'
                    disabled
                  />
                  <label id='label-tipo-saida' htmlFor='tipo_saida'>
                    Saída
                  </label>
                </div>
              </div>

              {/* Descrição */}
              <div className='form-group descricao'>
                <label htmlFor='descricao'>Descrição</label>
                <input
                  type='text'
                  id='descricao'
                  name='descricao'
                  defaultValue={operacao.descricao}
                  disabled
                />
              </div>

              {/* Valor */}
              <div className='form-group valor'>
                <label htmlFor='valor'>Valor da operação</label>
                <CurrencyInput
                  name='valor'
                  id='valor'
                  defaultValue={operacao.valor * 1}
                  disabled
                ></CurrencyInput>
              </div>

              {/* Referencia */}
              <div className='form-group referencia'>
                <label htmlFor='vincular-perfil-input'>Víncular perfil a operação</label>
                <input type='hidden' name='perfil' defaultValue={referencia?.id} />
                {referencia && (
                  <div className='referencia-perfil'>
                    <div>
                      {referencia.nome} {referencia.sobrenome}
                    </div>
                  </div>
                )}

                {!referencia && (
                  <div className='form-group'>
                    <small>Nenhum perfil vinculado a esta operação</small>
                  </div>
                )}
              </div>
            </Form>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
