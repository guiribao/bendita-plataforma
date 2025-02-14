import { LoaderArgs, json } from '@remix-run/node';

import { authenticator } from '~/secure/authentication.server';

export const loader = ({ request }: LoaderArgs) => {
  let usuario = authenticator.isAuthenticated(request);

  return json({ usuario });
};

export default function NavAuthenticated() {

  return (
    <div className='menu'>
      <ul className='menu-list'>
        <li>Gente</li>
        <li>Documentos</li>
        <li>Medicação</li>
        <li>Financeiro</li>
      </ul>

      <div className='user-wrapper'>
        <img src={userImage} alt='some random user image' width={'40px'} height={'40px'} />
        
        {/* <div>
          <h4>{perfil?.nome ? `${perfil?.nome} ${perfil?.sobrenome}` : usuario?.email}</h4>
          <small>
            <Link to='/perfil'>Meu perfil</Link>
            {' | '}
          </small>
          <small>
            <Link to='/autentica/sair'>Sair</Link>
          </small>
        </div> */}

      </div>
    </div>
  );
}
