import { LoaderFunctionArgs, json } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { authenticator } from '~/secure/authentication.server';

export const loader = ({ request }: LoaderFunctionArgs) => {
  let usuario = authenticator.isAuthenticated(request);

  return json({ usuario });
};

export default function Nav() {

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
      <div className='menu-actions'>
        <Link to="/cadastro/basico">Associe-se</Link>
        <Link to="/autentica/entrar">Entrar</Link>
      </div>
    </div>
  );
}
