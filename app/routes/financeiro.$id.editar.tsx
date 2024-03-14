import { TipoOperacao } from '@prisma/client';
import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { Form, Link, json, redirect, useLoaderData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
//@ts-ignore
import { CurrencyInput } from 'react-currency-mask';
import { authenticator } from '~/secure/authentication.server';
import pegarOperacaoPorId from '~/domain/Financeiro/pegar-operacao-por-id.server';
import atualizarOperacao from '~/domain/Financeiro/atualizar-operacao.server';

import novaOperacaoPageStyle from '~/assets/css/nova-operacao-page.css';
import loading from '~/assets/img/loading.gif';


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

export async function action({ request }: ActionFunctionArgs) {
  let form = await request.formData();
  let id = form.get('id') as string;
  let tipo = form.get('tipo') as TipoOperacao;
  let descricao = form.get('descricao') as string;
  let valor = form.get('valor_real') as string;
  let referenciaId = form.get('perfil') as number | null;

  await atualizarOperacao(id, tipo, descricao, valor, referenciaId);

  return redirect('/financeiro');
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let operacao = await pegarOperacaoPorId(params.id);

  return json({ operacao });
}

export default function FinanceiroEditarIndex() {
  let { operacao } = useLoaderData();

  let [perfis, setPerfis] = useState([]);
  let [referencia, setReferencia] = useState(operacao.perfil);
  let [valorReal, setValorReal] = useState(0);

  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  async function buscarPerfil(e) {
    let valorBusca = e.target.value;

    let response = await fetch(`/buscar/perfil/${valorBusca}`, { method: 'get' }).then((res) =>
      res.json()
    );

    setPerfis(response?.perfis);
  }

  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1>Editar #{operacao.id}</h1>
            <Link to={'/financeiro'}>Voltar</Link>
          </div>
          <div className='view-body'>
            <Form method='post' className='form-financeiro'>
              <input type='hidden' name='id' defaultValue={operacao.id} />
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
                  />
                  <label id='label-tipo-saida' htmlFor='tipo_saida'>
                    Saída
                  </label>
                </div>
              </div>

              {/* Descrição */}
              <div className='form-group descricao'>
                <label htmlFor='descricao'>Descrição ou título</label>
                <input
                  type='text'
                  id='descricao'
                  placeholder='Descrição'
                  name='descricao'
                  defaultValue={operacao.descricao}
                />
              </div>

              {/* Valor */}
              <div className='form-group valor'>
                <label htmlFor='valor'>Valor da operação</label>
                <input type='hidden' name='valor_real' defaultValue={valorReal} />
                <CurrencyInput
                  name='valor'
                  defaultValue={parseFloat(operacao.valor)}
                  onChangeValue={(event, original, masked) => {
                    setValorReal(Number(original));
                  }}
                ></CurrencyInput>
              </div>

              {/* Referencia */}
              <div className='form-group referencia'>
                <label htmlFor='vincular-perfil-input'>Víncular perfil a operação</label>
                <input type='hidden' name='perfil' defaultValue={referencia?.id} />
                {referencia && (
                  <div className='referencia-perfil'>
                    <span onClick={() => setReferencia(null)}>Limpar referencia</span>
                    <div>
                      {referencia.nome} {referencia.sobrenome}
                    </div>
                  </div>
                )}

                {!referencia && (
                  <div className='form-group'>
                    <input
                      type='text'
                      id='vincular-perfil-input'
                      placeholder='Vincular perfil'
                      defaultValue={''}
                      onChange={buscarPerfil}
                    />

                    <ul>
                      {perfis.map((perfil) => (
                        <li key={perfil.id} onClick={() => setReferencia(perfil)}>
                          <input type='checkbox' />
                          {perfil.nome} {perfil.sobrenome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className='form-group'>
                <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
                  {!isSubmitting && 'Salvar'}
                  {isSubmitting && <img src={loading} alt='Salvando' />}
                </button>
              </div>
            </Form>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
