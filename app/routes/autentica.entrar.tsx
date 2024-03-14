import {
  ActionFunction,
  LinksFunction,
  LoaderArgs,
  LoaderFunctionArgs,
  MetaFunction,
  json,
  redirect,
} from '@remix-run/node';
import { Form, Link, useActionData, useNavigation, useSearchParams } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import cadastroLoginPageStyle from '~/assets/css/cadastro-login-page.css';
import loading from '~/assets/img/loading.gif';
import { useContext, useEffect } from 'react';
import Constraints from '~/shared/Constraints';
import Toastify from 'toastify-js';
import { createBrowserHistory } from 'history';

export const meta: MetaFunction = () => {
  return [{ title: 'Entrar - ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroLoginPageStyle }];
};

export const action: ActionFunction = async ({ request, context }) => {
  await authenticator.authenticate('form', request, {
    successRedirect: '/dashboard',
    failureRedirect: '/autentica/entrar?fail=true',
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  let user = await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
  return {};
}

export default function Entrar() {
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isSubmitting = navigation.state === 'submitting';

  useEffect(() => {
    const history = createBrowserHistory();

    if (Boolean(searchParams.get('fail')) == true && navigation.state === 'idle') {
      Toastify({
        text: 'Vish. Suas credenciais não estão batendo ...',
        className: 'info',
        style: {
          background: Constraints.NOTIFY_COLOR,
        },
      }).showToast();
      history.replace('/autentica/entrar');
    }
  }, [navigation.state]);

  return (
    <main>
      <div className='header'>
        <h1>Entrar</h1>
        <p>
          Digite as informações abaixo <br />
          para entrar
        </p>
      </div>
      <Form method='POST' className='form-cadastro'>
        <div className='form-group'>
          <label>E-mail</label>
          <input type='email' name='email' id='email' autoComplete='off' />
        </div>
        <div className='form-group'>
          <label>Senha</label>
          <input type='password' name='senha' id='senha' autoComplete='off' />
          <p>
            Esqueceu sua senha? <Link to='/autentica/senha'>Clique aqui</Link>
          </p>
        </div>
        <div className='form-group form-button'>
          <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
            {!isSubmitting && 'Entrar'}
            {isSubmitting && <img src={loading} alt='Carregando' />}
          </button>
        </div>
      </Form>
      <div className='footer'>
        <p>
          Não tem uma conta ainda? <br />
          <Link to='/autentica/cadastro'>Cadastre-se</Link>
        </p>
      </div>
    </main>
  );
}
