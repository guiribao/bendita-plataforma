import { TipoEvento, TipoFarda } from '@prisma/client';
import type { ActionFunctionArgs, LinksFunction, MetaFunction } from '@remix-run/node';
import { Form, Link, json, redirect, useActionData, useNavigation } from '@remix-run/react';
import { useState } from 'react';

import novoEventoPageStyle from '~/assets/css/novo-evento-page.css';
import loading from '~/assets/img/loading.gif';
import editarEvento from '~/domain/Calendario/editar-evento.server';
import { authenticator } from '~/secure/authentication.server';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Calendário - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Gerenciamento de eventos do Chave',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: novoEventoPageStyle }];
};

export async function action({ request }: ActionFunctionArgs) {
  //@ts-ignore
  let usuario: Usuario = await authenticator.isAuthenticated(request);
  let errors = {};

  let form = await request.formData();

  let tipoEvento = form.get('tipo') as string;
  let titulo = form.get('titulo') as string;
  let descricao = form.get('descricao') as string;
  let dataHora = form.get('data_hora') as string;
  let vestimenta = form.get('vestimenta') as string;
  let trabalho_terco = form.get('trabalho_terco');
  let trabalho_missa = form.get('trabalho_missa');
  let trabalho_fechado = form.get('trabalho_fechado');


  if ([!dataHora, !titulo, !descricao].some(Boolean)) {
    errors = Object.assign(errors, { data: 'Preencha todos os campos obrigatórios' });
    return json({ errors });
  }

  await editarEvento(
    tipoEvento,
    titulo,
    descricao,
    vestimenta,
    dataHora,
    !!trabalho_terco,
    !!trabalho_missa,
    !!trabalho_fechado,
    0
  );

  return redirect('/calendario');
}

export default function CalendarioNovoIndex() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [tipoEvento, setTipoEvento] = useState(TipoEvento.EVENTO);

  function setarTipoEvento(event) {
    let value = event.target.value;
    if (value != tipoEvento) setTipoEvento(value);
  }

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
              {actionData?.errors?.data && (
                <p className='mensagem-erro'>{actionData?.errors?.data}</p>
              )}
              {/* TIPO EVENTO*/}

              <div className='tipo-evento'>
                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_evento'
                    name='tipo'
                    value={TipoEvento.EVENTO}
                    defaultChecked={true}
                    onChange={setarTipoEvento}
                  />
                  <label htmlFor='tipo_evento_evento'>Evento</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_feirinha'
                    name='tipo'
                    value={TipoEvento.FEIRINHA}
                    onChange={setarTipoEvento}
                  />
                  <label htmlFor='tipo_evento_feirinha'>Feirinha</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_trabalho'
                    name='tipo'
                    value={TipoEvento.TRABALHO}
                    onChange={setarTipoEvento}
                  />
                  <label htmlFor='tipo_evento_trabalho'>Trabalho</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_treinamento'
                    name='tipo'
                    value={TipoEvento.TREINAMENTO}
                    onChange={setarTipoEvento}
                  />
                  <label htmlFor='tipo_evento_treinamento'>Treinamento</label>
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
                  required
                />
              </div>

              {/* Descrição */}
              <div className='form-group descricao'>
                <label htmlFor='descricao'>Descrição ou hinário</label>
                <input
                  type='text'
                  id='descricao'
                  placeholder='ex: Caderno de hinos e orações'
                  name='descricao'
                  defaultValue={''}
                  required
                />
              </div>

              {/* Data e hora */}
              <div className='form-group descricao'>
                <label htmlFor='data'>Data hora</label>
                <input type='datetime-local' id='data' name='data_hora' defaultValue={''} />
              </div>

              {/* TIPO VESTIMENTA*/}
              {tipoEvento == TipoEvento.TRABALHO && (
                <div className='detalhes-trabalho'>
                  <div>
                    <h2>Detalhes do trabalho</h2>
                  </div>
                  <div className='observacoes'>
                    <div className='form-group'>
                      <input type='checkbox' id='trabalho_terco' name='trabalho_terco' />
                      <label htmlFor='trabalho_terco'>Tem terço</label>
                    </div>
                    <div className='form-group'>
                      <input type='checkbox' id='trabalho_missa' name='trabalho_missa' />
                      <label htmlFor='trabalho_missa'>Tem missa</label>
                    </div>
                    <div className='form-group'>
                      <input type='checkbox' id='trabalho_fechado' name='trabalho_fechado' />
                      <label htmlFor='trabalho_fechado'>Trabalho fechado</label>
                    </div>
                  </div>

                  <div className='tipo-evento'>
                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='farda_azul'
                        name='vestimenta'
                        value={TipoFarda.FARDA_AZUL}
                      />
                      <label htmlFor='farda_azul'>Farda azul</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='farda_branca'
                        name='vestimenta'
                        value={TipoFarda.FARDA_BRANCA}
                      />
                      <label htmlFor='farda_branca'>Farda branca</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='roupa_branca'
                        name='vestimenta'
                        value={TipoFarda.ROUPA_BRANCA}
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
                </div>
              )}

              <div className='form-group'>
                <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
                  {!isSubmitting && 'Cadastrar'}
                  {isSubmitting && 'Cadastrando'}
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
