import { ActionFunction, LinksFunction, LoaderArgs, V2_MetaFunction, json } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/auth.server';
import cadastroLoginPageStyle from '~/assets/css/cadastro-login-page.css';
import loading from '~/assets/img/loading.gif';

export const meta: V2_MetaFunction = () => {
  return [
    { title: 'Esqueci minha senha - ChaveCloud' },
    { name: 'description', content: 'A Núvem do Chave!' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroLoginPageStyle }];
};

export const action: ActionFunction = async ({ request }) => {};

export async function loader({ request }: LoaderArgs) {
  let user = await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });

  return {};
}

export default function Entrar() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <main>
      <div className='header'>
        <h1>Esqueci minha senha</h1>
        <p>
          Digite seu e-mail de cadastro no campo abaixo.
          <br />
          Enviaremos um link para este e-mail.
        </p>
      </div>
      <Form method='POST' className='form-cadastro'>
        {actionData?.errors?.email && (
          <p className='mensagem-erro'>Por favor, preencha o campo e-mail</p>
        )}
        <div className='form-group'>
          <label>E-mail</label>
          <input type='email' name='email' id='email' autoComplete='off' />
        </div>
        <div className='form-group form-button'>
          <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
            {!isSubmitting && 'Enviar'}
            {isSubmitting && <img src={loading} alt='Carregando' />}
          </button>
        </div>
      </Form>
      <div className='footer'>
        <p>
          Já tem uma conta? <br />
          <Link to='/autentica/entrar'>Entrar</Link>
        </p>
        <p>
          Não tem uma conta ainda? <br />
          <Link to='/autentica/cadastro'>Cadastre-se</Link>
        </p>
      </div>
    </main>
  );
}
