import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  json,
  redirect,
} from '@remix-run/node';
import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useRouteError,
  useSearchParams,
} from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import cadastroPageStyle from '~/assets/css/cadastro-page.css';
import loading from '~/assets/img/loading.gif';
import { useEffect } from 'react';
import Toastify from 'toastify-js';
import { createBrowserHistory } from 'history';

export const meta: MetaFunction = () => {
  return [{ title: 'Entrar - ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroPageStyle }];
};

export const action: ActionFunction = async ({ request, context }) => {
  let errors = {};

  try {
    await authenticator.authenticate('form', request, {
      successRedirect: '/dashboard',
      throwOnError: true,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    errors = { message: error.message };
    return { errors };
  }
};

export async function loader({ request }: LoaderFunctionArgs) {
  let user = await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
  return {};
}

export default function Entrar() {
  const actionData = useActionData();
  const navigation = useNavigation();

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  return (
    <main>
      <div className='header'>
        <h1>Entrar</h1>
        <p>Informe seus dados de login para entrar</p>
      </div>
      <Form method='POST' className='form-cadastro'>
        {actionData?.errors?.message && (
          <p className='mensagem-erro'>{actionData?.errors?.message}</p>
        )}
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
            {isSubmitting && 'Entrando'}
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
