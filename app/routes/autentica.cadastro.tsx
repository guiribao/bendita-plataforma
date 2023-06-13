import { ActionFunction, LinksFunction, LoaderArgs, V2_MetaFunction, json } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';

import { authenticator } from '~/secure/auth.server';
import criarNovoUsuario from '~/domain/User/criar-novo-usuario.server';

import cadastroLoginPageStyle from '~/assets/css/cadastro-login-page.css';
import loading from '~/assets/img/loading.gif';
import { Usuario } from '@prisma/client';

export const meta: V2_MetaFunction = () => {
  return [
    { title: 'Cadastro - ChaveCloud' },
    { name: 'description', content: 'A Núvem do Chave!' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroLoginPageStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email: string = form.get('email') as string;
  const senha: string = form.get('senha') as string;
  const senha_repetida: string = form.get('senha_repetida') as string;

  let errors = {
    email: !email,
    senha: !senha,
  };

  if (Object.values(errors).some(Boolean)) {
    const values = Object.fromEntries(form);
    return json({ errors, values });
  }

  if (senha != senha_repetida) {
    errors = Object.assign(errors, { data: 'Hmmm! Parece que a verificação de senha não confere' });
    return json({ errors });
  }

  let criarUsuario = await criarNovoUsuario(email, senha);

  if (criarUsuario) {
    await authenticator.authenticate('form', request, {
      successRedirect: '/dashboard',
      failureRedirect: '/autentica/cadastro',
      context: { formData: form },
    });
  }

  errors = Object.assign(errors, { data: 'Ops! Algo deu errado ao criar o usuário' });
  return json({ errors });
};

export async function loader({ request }: LoaderArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
}

export default function Cadastro() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <main>
      <div className='header'>
        <h1>Cadastrar-se</h1>
        <p>Crie sua conta para começar</p>
      </div>
      <Form method='post' className='form-cadastro'>
        {actionData?.errors?.data && <p className='mensagem-erro'>{actionData?.errors?.data}</p>}
        {actionData?.errors?.email && (
          <p className='mensagem-erro'>Por favor, preencha o campo e-mail</p>
        )}

        {actionData?.errors?.senha && (
          <p className='mensagem-erro'>Por favor, preencha o campo senha </p>
        )}
        <div className='form-group'>
          <label htmlFor='email'>E-mail</label>
          <input type='email' name='email' id='email' autoComplete='off' />
        </div>
        <div className='form-group'>
          <label htmlFor='senha'>Senha</label>
          <input type='password' name='senha' id='senha' autoComplete='off' />
        </div>
        <div className='form-group'>
          <label htmlFor='senha_repetida'>Repita a senha</label>
          <input type='password' name='senha_repetida' id='senha_repetida' autoComplete='off' />
        </div>
        <div className='form-group form-button'>
          <button type='submit' className='btn-cadastro' disabled={isSubmitting}>
            {!isSubmitting && 'Cadastre-se'}
            {isSubmitting && <img src={loading} alt='Carregando' />}
          </button>
        </div>
      </Form>
      <div className='footer'>
        <p>
          Já tem uma conta? <Link to='/autentica/entrar'>Entrar</Link>
        </p>
      </div>
    </main>
  );
}
