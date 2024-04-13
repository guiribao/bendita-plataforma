import { TipoEvento, TipoFarda } from '@prisma/client';
import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import {
  Form,
  Link,
  json,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

import novoEventoPageStyle from '~/assets/css/novo-evento-page.css';
import loading from '~/assets/img/loading.gif';
import criarNovoEvento from '~/domain/Calendario/editar-evento.server';
import pegarEventoPorId from '~/domain/Calendario/pegar-evento-por-id.server';
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let evento = await pegarEventoPorId(params.id);

  return json({ evento });
}

export default function CalendarioNovoIndex() {
  const { evento } = useLoaderData();
  const [tipoEvento, setTipoEvento] = useState(evento?.tipo);


  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1> </h1>
            <div className='view-header-actions'>
              <Link data-role="EDITAR_EVENTO" to={`/calendario/${evento.id}/editar`}>Editar</Link>
              <Link to={'/calendario'}>Voltar</Link>
            </div>
          </div>
          <div className='view-body'>
            <Form method='post' className='form-calendario'>
              {/* TIPO EVENTO*/}

              <div className='tipo-evento'>
                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_evento'
                    name='tipo'
                    value={TipoEvento.EVENTO}
                    checked={evento.tipo == TipoEvento.EVENTO}
                    readOnly
                  />
                  <label htmlFor='tipo_evento_evento'>Evento</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_feirinha'
                    name='tipo'
                    value={TipoEvento.FEIRINHA}
                    checked={evento.tipo == TipoEvento.FEIRINHA}
                    readOnly
                  />
                  <label htmlFor='tipo_evento_feirinha'>Feirinha</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_trabalho'
                    name='tipo'
                    value={TipoEvento.TRABALHO}
                    checked={evento.tipo == TipoEvento.TRABALHO}
                    readOnly
                  />
                  <label htmlFor='tipo_evento_trabalho'>Trabalho</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_treinamento'
                    name='tipo'
                    value={TipoEvento.TREINAMENTO}
                    checked={evento.tipo == TipoEvento.TREINAMENTO}
                    readOnly
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
                  defaultValue={evento?.titulo}
                  required
                  disabled
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
                  defaultValue={evento?.descricao}
                  disabled
                />
              </div>

              {/* Data e hora */}
              <div className='form-group descricao'>
                <label htmlFor='data'>Data hora</label>
                <input
                  type='datetime-local'
                  id='data'
                  name='data_hora'
                  defaultValue={format(evento.data_hora, "yyyy'-'MM'-'dd HH:mm", {
                    locale: ptBR,
                  })}
                  disabled
                />
              </div>

              {/* TIPO VESTIMENTA*/}
              {evento?.tipo == TipoEvento.TRABALHO && (
                <div className='detalhes-trabalho'>
                  <div>
                    <h2>Detalhes do trabalho</h2>
                  </div>
                  <div className='observacoes'>
                    <div className='form-group'>
                      <input
                        type='checkbox'
                        id='trabalho_terco'
                        name='trabalho_terco'
                        defaultChecked={evento?.trabalho_terco}
                        readOnly
                      />
                      <label htmlFor='trabalho_terco'>Tem terço</label>
                    </div>
                    <div className='form-group'>
                      <input
                        type='checkbox'
                        id='trabalho_missa'
                        name='trabalho_missa'
                        defaultChecked={evento?.trabalho_missa}
                        readOnly
                      />
                      <label htmlFor='trabalho_missa'>Tem missa</label>
                    </div>
                    <div className='form-group'>
                      <input
                        type='checkbox'
                        id='trabalho_fechado'
                        name='trabalho_fechado'
                        defaultChecked={evento?.trabalho_fechado}
                        readOnly
                      />
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
                        checked={evento?.vestimenta == TipoFarda.FARDA_AZUL}
                        readOnly
                      />
                      <label htmlFor='farda_azul'>Farda azul</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='farda_branca'
                        name='vestimenta'
                        value={TipoFarda.FARDA_BRANCA}
                        checked={evento?.vestimenta == TipoFarda.FARDA_BRANCA}
                        readOnly
                      />
                      <label htmlFor='farda_branca'>Farda branca</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='roupa_branca'
                        name='vestimenta'
                        value={TipoFarda.ROUPA_BRANCA}
                        checked={evento?.vestimenta == TipoFarda.ROUPA_BRANCA}
                        readOnly
                      />
                      <label htmlFor='roupa_branca'>Roupa branca</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='nao_aplica'
                        name='vestimenta'
                        value={TipoFarda.NAO_APLICA}
                        checked={evento?.vestimenta == TipoFarda.NAO_APLICA}
                        readOnly
                      />
                      <label htmlFor='nao_aplica'>Não aplicável</label>
                    </div>
                  </div>
                </div>
              )}
            </Form>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
