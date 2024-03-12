import { TipoOperacao } from '@prisma/client';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, Link, redirect, useLoaderData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
//@ts-ignore
import CurrencyInput from 'react-currency-masked-input';
import criarNovaOperacao from '~/domain/Operation/criar-nova-operacao.server';
import novaOperacaoPageStyle from '~/assets/css/nova-operacao-page.css';
import loading from '~/assets/img/loading.gif';
import pegarOperacoes from '~/domain/Operation/pegar-operacoes.server';

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
  let tipo = form.get('tipo') as TipoOperacao;
  let descricao = form.get('descricao') as string;
  let valor = form.get('valor') as string;
  let referenciaId = form.get('perfil') as number | null;

  await criarNovaOperacao(tipo, descricao, valor, referenciaId);

  return redirect('/financeiro');
}

export default function FinanceiroNovoIndex() {
  let [perfis, setPerfis] = useState([]);
  let [referencia, setReferencia] = useState(null);
  
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
            <h1> </h1>
            <Link to={'/financeiro'}>Voltar</Link>
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
                    defaultChecked={true}
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
                  defaultValue={''}
                />
              </div>

              {/* Valor */}
              <div className='form-group valor'>
                <label htmlFor='valor'>Valor da operação</label>
                <CurrencyInput
                  name='valor'
                  id='valor'
                  placeholder='Algum valor em R$'
                  defaultValue={''}
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
                  {!isSubmitting && 'Cadastrar'}
                  {isSubmitting && <img src={loading} alt='Cadastrando' />}
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
