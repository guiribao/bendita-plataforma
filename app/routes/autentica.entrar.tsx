import { ActionFunction, LinksFunction, LoaderArgs, V2_MetaFunction, json } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/auth.server';
import cadastroLoginPageStyle from '~/assets/css/cadastro-login-page.css';
import loading from '~/assets/img/loading.gif';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroLoginPageStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email: string = form.get('email') as string;
  const senha: string = form.get('senha') as string;

  try {
    const errors = {
      email: !email,
      senha: !senha,
    };

    if (Object.values(errors).some(Boolean)) {
      const values = Object.fromEntries(form);
      return json({ errors, values });
    }
    await authenticator.authenticate('form', request, {
      successRedirect: '/dashboard',
      failureRedirect: '/autentica/entrar',
    });
  } catch (e) {
    console.warn(e);
  }
};

export async function loader({ request }: LoaderArgs) {
  let user = await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });

  return json({ user });
}

export default function Entrar() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

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
        {actionData?.errors?.email && (
          <p className='mensagem-erro'>Por favor, preencha o campo e-mail</p>
        )}
        {actionData?.errors?.senha && (
          <p className='mensagem-erro'>Por favor, preencha o campo senha</p>
        )}
        <div className='form-group'>
          <label>E-mail</label>
          <input type='email' name='email' id='email' autoComplete='off' />
        </div>
        <div className='form-group'>
          <label>Senha</label>
          <input type='password' name='senha' id='senha' autoComplete='off' />
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
