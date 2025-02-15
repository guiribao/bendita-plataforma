import { LoaderArgs, json } from '@remix-run/node';

import { authenticator } from '~/secure/authentication.server';

import userImage from '~/assets/img/user.png'
import { Link, useLoaderData } from '@remix-run/react';
import pegarPerfilPeloIdUsuario from '~/domain/Perfil/perfil-pelo-id-usuario.server';

export const loader = async ({ request }: LoaderArgs) => {
  let usuario = await authenticator.isAuthenticated(request);
  let perfil = await pegarPerfilPeloIdUsuario(usuario.id)

  return json({ usuario, perfil });
};

export default function NavAuthenticated() {
  let { perfil, usuario } = useLoaderData()

  return (
    <div className='menu'>
      <ul className='menu-list'>
        <li>
          <Link to="/sobre">Sobre</Link>
        </li>
        <li>
          <Link to="/servicos">Serviços</Link>
        </li>
        <li>
          <Link to="/conhecimento">Conhecimento</Link>
        </li>
        <li>
          <Link to="/contato">Contato</Link>
        </li>
      </ul>

      <div className='user-wrapper'>
        <img src={userImage} alt='some random user image' width={'40px'} height={'40px'} />
        <div>
          <h4>{perfil?.nome ? `${perfil?.nome} ${perfil?.sobrenome}` : usuario?.email}</h4>
          <small>
            <Link to='/perfil'>Meu perfil</Link>
            {' | '}
          </small>
          <small>
            <Link to='/autentica/sair'>Sair</Link>
          </small>
        </div>
      </div>
    </div>
  );
}
