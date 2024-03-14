import { TipoEvento, TipoFarda } from '@prisma/client';
import type { ActionFunctionArgs, LinksFunction, MetaFunction } from '@remix-run/node';
import { Form, Link, useNavigation } from '@remix-run/react';
import { useState } from 'react';
//@ts-ignore
import { CurrencyInput } from 'react-currency-mask';

import novoEventoPageStyle from '~/assets/css/novo-evento-page.css';
import loading from '~/assets/img/loading.gif';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Calendário - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Gerenciamento de operações financeiras de entrada e saída do Chave',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: novoEventoPageStyle }];
};

export async function action({ request }: ActionFunctionArgs) {
  //@ts-ignore
  let usuario: Usuario = await authenticator.isAuthenticated(request);

  let form = await request.formData();

  let tipoEvento = form.get('tipo') as TipoEvento;
  let titulo = form.get('titulo') as string;
  let descricao = form.get('descricao') as string;
  let dataHora = form.get('data_hora') as string;
  let vestimenta = form.get('vestimenta') as TipoFarda;

  await criarNovoEvento(tipoEvento, titulo, descricao, vestimenta, dataHora);

  return redirect('/financeiro');
}

export default function CalendarioNovoIndex() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1> </h1>
            <Link to={'/calendario'}>Voltar</Link>
          </div>
          <div className='view-body'>
            <Form method='post' className='form-calendario'>
              {/* TIPO EVENTO*/}

              <div className='tipo-evento'>
                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_aberto'
                    name='tipo'
                    value={TipoEvento.EVENTO_ABERTO}
                    defaultChecked={true}
                  />
                  <label htmlFor='tipo_evento_aberto'>Evento aberto</label>
                </div>
                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_trabalho_aberto'
                    name='tipo'
                    value={TipoEvento.TRABALHO_ABERTO}
                    defaultChecked={false}
                  />
                  <label htmlFor='tipo_trabalho_aberto'>Trabalho aberto</label>
                </div>
                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_trabalho_fechado'
                    name='tipo'
                    value={TipoEvento.TRABALHO_FECHADO}
                    defaultChecked={false}
                  />
                  <label htmlFor='tipo_trabalho_fechado'>Trabalho fechado</label>
                </div>
              </div>

              {/* Titulo */}
              <div className='form-group titulo'>
                <label htmlFor='titulo'>Título</label>
                <input
                  type='text'
                  id='titulo'
                  placeholder='ex: Concentração'
                  name='titulo'
                  defaultValue={''}
                />
              </div>

              {/* Descrição */}
              <div className='form-group descricao'>
                <label htmlFor='descricao'>Descrição ou hinário</label>
                <input
                  type='text'
                  id='titulo'
                  placeholder='ex: Caderno de hinos e orações'
                  name='descricao'
                  defaultValue={''}
                />
              </div>

              {/* Data e hora */}
              <div className='form-group descricao'>
                <label htmlFor='descricao'>Data hora</label>
                <input
                  type='datetime-local'
                  id='data'
                  name='data_hora'
                  defaultValue={''}
                />
              </div>

              {/* TIPO VESTIMENTA*/}

              <div className='tipo-evento'>
                <div className='form-group vestimenta'>
                  <input
                    type='radio'
                    id='farda_azul'
                    name='vestimenta'
                    value={TipoFarda.FARDA_AZUL}
                    defaultChecked={true}
                  />
                  <label htmlFor='farda_azul'>Farda azul</label>
                </div>

                <div className='form-group vestimenta'>
                  <input
                    type='radio'
                    id='farda_branca'
                    name='vestimenta'
                    value={TipoFarda.FARDA_BRANCA}
                    defaultChecked={false}
                  />
                  <label htmlFor='farda_branca'>Farda branca</label>
                </div>

                <div className='form-group vestimenta'>
                  <input
                    type='radio'
                    id='roupa_branca'
                    name='vestimenta'
                    value={TipoFarda.ROUPA_BRANCA}
                    defaultChecked={false}
                  />
                  <label htmlFor='roupa_branca'>Roupa branca</label>
                </div>

                <div className='form-group vestimenta'>
                  <input
                    type='radio'
                    id='nao_aplica'
                    name='vestimenta'
                    value={TipoFarda.NAO_APLICA}
                    defaultChecked={true}
                  />
                  <label htmlFor='nao_aplica'>Não aplicável</label>
                </div>
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
