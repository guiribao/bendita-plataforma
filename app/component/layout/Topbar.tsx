import { LoaderArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useLocation } from 'react-router-dom';
import { Usuario } from '@prisma/client';
import { getPageInfo } from '~/shared/PageInfo';

import { authenticator } from '~/secure/authentication.server';

import userImage from '~/assets/img/user.png';

export const loader = ({ request }: LoaderArgs) => {
  let usuario = authenticator.isAuthenticated(request);
  return json({ usuario });
};

export default function Topbar() {
  const { usuario, perfil } = useLoaderData();
  const location = useLocation();
  const info = getPageInfo(location.pathname);

  return (
    usuario && (
      <header>
        <h2>
          <label htmlFor='nav-toggle'>
            <span className='las la-bars'></span>
          </label>
          {info?.title}
        </h2>

        <div className='user-wrapper'>
          <img src={userImage} alt='some random user image' width={'40px'} height={'40px'} />
          <div>
            <h4>{(perfil?.nome) ? `${perfil?.nome} ${perfil?.sobrenome}` : usuario.email}</h4>
            <small>
              <Link to='/perfil'>Meu perfil</Link>
              {' | '}
            </small>
            <small>
              <Link to='/autentica/sair'>Sair</Link>
            </small>
          </div>
        </div>
      </header>
    )
  );
}
