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

export const action: ActionFunction = async ({ request }) => {};

export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: Limit e offset - Paginação
  let perfis = await pegarPerfis();

  return json({ perfis });
}

export default function FinanceiroIndex() {
  const { perfis } = useLoaderData();
  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1> </h1>
            <div className='view-header-actions'>
              <Link to={'/gente/perfil/novo'}>+ Perfil</Link>
              <Link to={'/gente/usuario/novo'}>+ Usuário</Link>
            </div>
          </div>
          <div className='view-body gente'>
            {perfis.length === 0 && (
              <div className='sem-dados'>
                <p style={{ textAlign: 'center' }}>Nenhum dado foi encontrado</p>
              </div>
            )}

            <div className='lista-gente'>
              {perfis.map((perfil) => (
                <div className='card-gente' key={perfil.id} onClick={() => linkToPerfil(perfil.id)}>
                  <div className='card-gente-header'>
                    <img src={perfil.foto} />
                    <div className='gente-header-info'>
                      <span className='gente-grupo'>{perfil.grupo}</span>
                      {perfil.membro && <span className='gente-membro'>membro</span>}
                    </div>
                  </div>
                  <div className='card-gente-body'>
                    <Link to={`/gente/perfil/${perfil.id}`}>
                      <h2>
                        {perfil.nome} {perfil.sobrenome}
                      </h2>
                    </Link>
                    
                    <div className='gente-body-info'>
                      <span>{perfil.profissao}</span>
                      <InputMask
                        type='text'
                        name='celular'
                        id='celular'
                        defaultValue={perfil?.celular ?? ''}
                        autoComplete='off'
                        required
                        readOnly={!!perfil?.cpf}
                        mask='+99 (99) 9 9999-9999'
                        maskChar={' '}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* <tr>
                

                <td>usuarioId</td>
                <td>criado_em</td>
              </tr> */}
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
