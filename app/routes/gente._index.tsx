import { json, redirect } from '@remix-run/node';
import type {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import InputMask from 'react-input-mask';

import pegarPerfis from '~/domain/Perfil/pegar-perfis.server';
import gentePageStyle from '~/assets/css/gente-page.css';
import { createHashHistory } from 'history';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DeletingModal from '~/component/DeletingModal';
import { useState } from 'react';
import deletarPerfilPorId from '~/domain/Perfil/deletar-perfil-por-id.server';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Gente - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Gerenciamento de gente do Chave - usuários e perfis',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: gentePageStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const action: string = form.get('_action') as string;
  const operacaoId: number = Number(form.get('resource') as string);

  if (action !== 'delete' && !operacaoId) return { success: false };

  await deletarPerfilPorId(operacaoId);

  return { success: true };
};

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: Limit e offset - Paginação
  let perfis = await pegarPerfis();
  let APP_URL = process.env.APP_URL;

  return json({ perfis, APP_URL });
}

export default function FinanceiroIndex() {
  const { perfis, APP_URL } = useLoaderData();

  // Dados para modal deletar item
  let [deleting, setDeleting] = useState(false);
  let [deletingItem, setDeletingItem] = useState({});

  function openDeletingModal(perfil) {
    setDeleting(true);
    setDeletingItem(perfil);
  }

  function closeDeletingModal() {
    setDeleting(false);
    setDeletingItem({});
  }

  return (
    <main>
      {deleting && <DeletingModal item={deletingItem} close={closeDeletingModal} entity='gente' />}

      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1> </h1>
            <div className='view-header-actions'>
              {/* <Link to={'/gente/perfil/novo'}>+ Perfil</Link>
              <Link to={'/gente/usuario/novo'}>+ Usuário</Link> */}
            </div>
          </div>
          <div className='view-body'>
            <table>
              <thead>
                <tr>
                  <td>Id</td>
                  <td style={{ minWidth: '50px' }}>Foto</td>
                  <td style={{ minWidth: '200px' }}>Nome</td>
                  <td style={{ minWidth: '200px' }}>Celular</td>
                  <td style={{ textAlign: 'left' }}>Grupo</td>
                  <td style={{ textAlign: 'center' }}>Membro</td>
                  <td style={{ textAlign: 'center' }}>Criado em</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {perfis.length === 0 && (
                  <tr>
                    <td style={{ textAlign: 'center' }} colSpan={10}>
                      Nenhum dado foi encontrado
                    </td>
                  </tr>
                )}

                {perfis.map((perfil) => (
                  <tr key={perfil.id}>
                    <td>
                      <Link to={`/gente/${perfil.id}`}>{perfil.id}</Link>
                    </td>
                    <td style={{ minWidth: '50px' }}>
                      <img
                        src={`${APP_URL}/${perfil.foto}`}
                        alt='Imagem do usuário'
                        width={'32px'}
                      />
                    </td>
                    <td>
                      <Link to={`/gente/${perfil.id}`}>
                        {perfil.nome} {perfil.sobrenome}
                      </Link>
                    </td>
                    <td>{perfil.celular}</td>
                    <td style={{ textAlign: 'left' }}>{perfil.grupo}</td>
                    <td style={{ textAlign: 'center' }}>
                      {perfil.membro && <i className='las la-check'></i>}
                    </td>
                    <td
                      style={{ textAlign: 'center' }}
                      title={format(new Date(perfil.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    >
                      {format(new Date(perfil.criado_em), "d 'de' LLLL 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </td>
                    <td>
                      <div id='actions'>
                        <Link to={`/gente/${perfil.id}`}>
                          <i className='lar la-eye'></i>
                        </Link>
                        <button onClick={() => openDeletingModal(perfil)}>
                          <i className='las la-trash'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
