import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import accessDenied from '~/assets/img/undraw/access_denied.svg';
import naoAutorizadoPage from '~/assets/css/nao-autorizado-page.css';

export const meta: MetaFunction = () => {
  return [{ title: 'ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: naoAutorizadoPage }];
};

export async function loader({ request: _request }: LoaderFunctionArgs) {
  return {};
}

export default function NotAuthorized() {
  return (
    <main className='nao-autorizado'>
      <div className='header'>
        <img src={accessDenied} alt='Acesso não autorizado' width='380' />
        <h1>Hey!</h1>
        <p>Parece que você não tem autorização para acessar este recurso.</p>
      </div>
    </main>
  );
}
