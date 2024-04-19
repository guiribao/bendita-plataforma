//@ts-nocheck
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
import { useRef, useState } from 'react';

import novoEventoPageStyle from '~/assets/css/novo-evento-page.css';
import loading from '~/assets/img/loading.gif';
import DeletingModal from '~/component/DeletingModal';
import editarEvento from '~/domain/Calendario/editar-evento.server';
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

export async function action({ request }: ActionFunctionArgs) {
  //@ts-ignore
  let usuario: Usuario = await authenticator.isAuthenticated(request);
  let errors = {};

  let form = await request.formData();
  
  let feirantes = form.get('feirantes') as string;
  let tipoEvento = form.get('tipo') as string;
  let titulo = form.get('titulo') as string;
  let descricao = form.get('descricao') as string;
  let dataHora = form.get('data_hora') as string;
  let vestimenta = form.get('vestimenta') as string;
  let trabalho_terco = form.get('trabalho_terco');
  let trabalho_missa = form.get('trabalho_missa');
  let trabalho_fechado = form.get('trabalho_fechado');
  let eventoId = form.get('eventoId');

  if ([!dataHora, !titulo, !descricao].some(Boolean)) {
    errors = Object.assign(errors, { data: 'Preencha todos os campos obrigatórios' });
    return json({ errors });
  }

  await editarEvento({
    tipoEvento,
    titulo,
    descricao,
    vestimenta,
    dataHora,
    trabalho_terco: !!trabalho_terco,
    trabalho_missa: !!trabalho_missa,
    trabalho_fechado: !!trabalho_fechado,
    eventoId: Number(eventoId),
    feirantesIds: feirantes?.split(',').map(id => Number(id)) || []
  });

  return redirect('/calendario');
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let APP_URL = process.env.APP_URL;
  let evento = await pegarEventoPorId(params.id);
  return json({ evento, APP_URL });
}

export default function CalendarioEditarIndex() {
  const { evento, APP_URL } = useLoaderData();
  const actionData = useActionData();

  const navigation = useNavigation();
  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);
  const [tipoEvento, setTipoEvento] = useState(evento?.tipo);

  let [perfis, setPerfis] = useState([]);
  let [feirantes, setFeirantes] = useState(evento.Feirantes.map(f => f.perfil));

  let searchInput = useRef(null);

  function setarTipoEvento(event) {
    let value = event.target.value;
    if (value != tipoEvento) setTipoEvento(value);
  }

  async function buscarPerfil(e) {
    let valorBusca = e.target.value;

    if (valorBusca.length == 0) {
      setPerfis([]);
    }

    if (valorBusca.length < 3) return;

    let response = await fetch(`/buscar/perfil/${valorBusca}?onlyUsers`, { method: 'get' }).then((res) =>
      res.json()
    );

    // Todos perfis que não estão em feirantes
    setPerfis([
      ...response?.perfis.filter(
        (perfil) => !feirantes.find((feirantes) => feirantes.id == perfil.id)
      ),
    ]);
  }

  function adicionarFeirante(perfil) {
    setFeirantes([...feirantes, perfil]);
    setPerfis(perfis.filter((p) => p.id != perfil.id));
  }

  function removerFeirante(perfil) {
    let nome = `${perfil.nome} ${perfil.sobrenome}`;
    if (nome.includes(searchInput.current.value)) setPerfis([...perfis, perfil]);
    setFeirantes(feirantes.filter((p) => p.id != perfil.id));
  }

  // Dados para modal deletar item
  let [deleting, setDeleting] = useState(false);
  let [deletingItem, setDeletingItem] = useState({});

  function openDeletingModal(evento) {
    setDeleting(true);
    setDeletingItem(evento);
  }

  function closeDeletingModal() {
    setDeleting(false);
    setDeletingItem({});
  }

  return (
    <main>
      {deleting && (
        <DeletingModal item={deletingItem} close={closeDeletingModal} entity='calendario' />
      )}
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1> </h1>

            <div className='view-header-actions'>
              <Link to={'/calendario'}>Voltar</Link>
            </div>
          </div>
          <div className='view-body'>
            <Form method='post' className='form-calendario'>
              {actionData?.errors?.data && (
                <p className='mensagem-erro'>{actionData?.errors?.data}</p>
              )}
              {/* TIPO EVENTO*/}

              <input
                type='hidden'
                value={evento?.id}
                name='eventoId'
                id='eventoId'
                autoComplete='off'
              />

              <div className='tipo-evento'>
                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_evento'
                    name='tipo'
                    value={TipoEvento.EVENTO}
                    defaultChecked={evento.tipo == TipoEvento.EVENTO}
                    onChange={setarTipoEvento}
                  />
                  <label htmlFor='tipo_evento_evento'>Evento</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_feirinha'
                    name='tipo'
                    value={TipoEvento.FEIRA}
                    defaultChecked={evento.tipo == TipoEvento.FEIRA}
                    onChange={setarTipoEvento}
                  />
                  <label htmlFor='tipo_evento_feirinha'>Feira</label>
                </div>

                <div className='form-group evento'>
                  <input
                    type='radio'
                    id='tipo_evento_trabalho'
                    name='tipo'
                    value={TipoEvento.TRABALHO}
                    defaultChecked={evento.tipo == TipoEvento.TRABALHO}
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
                    defaultChecked={evento.tipo == TipoEvento.TREINAMENTO}
                    onChange={setarTipoEvento}
                  />
                  <label htmlFor='tipo_evento_treinamento'>Treinamento</label>
                </div>
              </div>

              {/* Titulo */}
              <div className='form-group titulo'>
                <label htmlFor='titulo'>Nome</label>
                <input
                  type='text'
                  id='titulo'
                  placeholder='ex: Concentração'
                  name='titulo'
                  defaultValue={evento?.titulo}
                  autoComplete='off'
                  required
                />
              </div>

              {/* Descrição */}
              <div className='form-group descricao'>
                <label htmlFor='descricao'>Descrição</label>
                <input
                  type='text'
                  id='descricao'
                  placeholder='ex: Caderno de hinos e orações'
                  name='descricao'
                  defaultValue={evento?.descricao}
                  autoComplete='off'
                  required
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
                />
              </div>

              {/* TIPO VESTIMENTA*/}
              {tipoEvento == TipoEvento.TRABALHO && (
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
                      />
                      <label htmlFor='trabalho_terco'>Tem terço</label>
                    </div>
                    <div className='form-group'>
                      <input
                        type='checkbox'
                        id='trabalho_missa'
                        name='trabalho_missa'
                        defaultChecked={evento?.trabalho_missa}
                      />
                      <label htmlFor='trabalho_missa'>Tem missa</label>
                    </div>
                    <div className='form-group'>
                      <input
                        type='checkbox'
                        id='trabalho_fechado'
                        name='trabalho_fechado'
                        defaultChecked={evento?.trabalho_fechado}
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
                        defaultChecked={evento?.vestimenta == TipoFarda.FARDA_AZUL}
                      />
                      <label htmlFor='farda_azul'>Farda azul</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='farda_branca'
                        name='vestimenta'
                        value={TipoFarda.FARDA_BRANCA}
                        defaultChecked={evento?.vestimenta == TipoFarda.FARDA_BRANCA}
                      />
                      <label htmlFor='farda_branca'>Farda branca</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='roupa_branca'
                        name='vestimenta'
                        value={TipoFarda.ROUPA_BRANCA}
                        defaultChecked={evento?.vestimenta == TipoFarda.ROUPA_BRANCA}
                      />
                      <label htmlFor='roupa_branca'>Roupa branca</label>
                    </div>

                    <div className='form-group vestimenta'>
                      <input
                        type='radio'
                        id='nao_aplica'
                        name='vestimenta'
                        value={TipoFarda.NAO_APLICA}
                        defaultChecked={evento?.vestimenta == TipoFarda.NAO_APLICA}
                      />
                      <label htmlFor='nao_aplica'>Não aplicável</label>
                    </div>
                  </div>
                </div>
              )}

              {/* SELECIONAR FEIRANTES */}
              {tipoEvento == TipoEvento.FEIRA && (
                <div className='detalhes-feira'>
                  <div>
                    <h2>Adicionar feirantes</h2>
                    <div className='form-group'>
                      <input
                        type='text'
                        id='vincular-perfil-input'
                        placeholder='Digite para buscar'
                        defaultValue={''}
                        onChange={buscarPerfil}
                        ref={searchInput}
                        autoComplete='off'
                      />
                    </div>
                    <ul className='busca-feirantes'>
                      {perfis.map((perfil) => (
                        <li
                          key={perfil.id}
                          onClick={() => adicionarFeirante(perfil)}
                          className='badge'
                        >
                          <img
                            src={`${APP_URL}/${perfil.foto}`}
                            alt={`Foto do feirante - ${perfil.nome} ${perfil.sobrenome}`}
                            width={32}
                          />
                          {perfil.nome} {perfil.sobrenome}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                          >
                            <path d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
                          </svg>
                        </li>
                      ))}

                      {perfis.length === 0 && searchInput.value && <p>Nada encontrado</p>}
                    </ul>
                  </div>
                  <div>
                    <h2>Feirantes</h2>
                    <ul className='lista-feirantes'>
                      <input
                        type='hidden'
                        defaultValue={feirantes.map((f) => f.id)}
                        name='feirantes'
                      />
                      {feirantes.map((feirante) => (
                        <li key={feirante.id} className='badge'>
                          <img
                            src={`${APP_URL}/${feirante.foto}`}
                            alt={`Foto do feirante - ${feirante.nome} ${feirante.sobrenome}`}
                            width={32}
                          />
                          {feirante.nome} {feirante.sobrenome}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            onClick={() => removerFeirante(feirante)}
                          >
                            <path d='M23 20.168l-8.185-8.187 8.185-8.174-2.832-2.807-8.182 8.179-8.176-8.179-2.81 2.81 8.186 8.196-8.186 8.184 2.81 2.81 8.203-8.192 8.18 8.192z' />
                          </svg>
                        </li>
                      ))}

                      {feirantes.length === 0 && <p>Nenhum feirante adicionado</p>}
                    </ul>
                  </div>
                </div>
              )}

              <div className='form-group btn-save-delete'>
                <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
                  {!isSubmitting && 'Salvar'}
                  {isSubmitting && 'Salvando'}
                </button>

                <button
                  type='button'
                  className='delete-button'
                  data-role='DELETAR_EVENTO'
                  onClick={() => openDeletingModal(evento)}
                >
                  <i className='las la-trash'></i>
                  Excluir
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
