import { ActionFunction, LinksFunction, LoaderArgs, V2_MetaFunction, json } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import cadastroLoginPageStyle from '~/assets/css/cadastro-login-page.css';
import loading from '~/assets/img/loading.gif';
import pegarUsuarioPeloEmail from '~/domain/User/pegar-usuario-pelo-email.server';
import criarTokenEsqueciSenha from '~/domain/User/criar-token-esqueci-senha.server';
import enviarEmailEsqueciSenha from '~/domain/User/enviar-email-esqueci-senha.server';
import desativarTokensEsqueciSenha from '~/domain/User/desativar-tokens-esqueci-senha.server';
import { useEffect } from 'react';
import Toastify from 'toastify-js';
import Constraints from '~/shared/Constraints';

export const meta: V2_MetaFunction = () => {
  return [
    { title: 'Esqueci minha senha - ChaveCloud' },
    { name: 'description', content: 'A Núvem do Chave!' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroLoginPageStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email: string = form.get('email') as string;

  let errors = {
    email: !email,
  };

  let success = {};

  if (Object.values(errors).some(Boolean)) {
    const values = Object.fromEntries(form);
    return json({ errors, values });
  }

  let usuario = await pegarUsuarioPeloEmail(email);

  if (!usuario) {
    errors = Object.assign(errors, { data: 'Usuário não encontrado, tente outro e-mail.' });
    return json({ errors });
  }

  await desativarTokensEsqueciSenha(usuario.id);
  
  let tokenEsqueciSenha = await criarTokenEsqueciSenha(usuario.id);

  if (!tokenEsqueciSenha) {
    errors = Object.assign(errors, { data: 'Erro ao gerar token envio.' });
    return json({ errors });
  }

  await enviarEmailEsqueciSenha(email, tokenEsqueciSenha.token);

  return json({ errors, success: true });
};

export async function loader({ request }: LoaderArgs) {
  let user = await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
  
  return {};
}

export default function EsqueciSenha() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  useEffect(() => {
    if(actionData?.success === true) {
      Toastify({
        text: "Enviamos uma mensagem para você. Verifique seu e-mail",
        className: "info",
        style: {
          background: Constraints.NOTIFY_COLOR,
        }
      }).showToast();
    }
  }, [isSubmitting])
  
  return (
    <main>
      <div className='header'>
        <h1>Esqueci minha senha</h1>
        <p>
          Digite abaixo o seu e-mail de cadastro.
        </p>
      </div>
      <Form method='POST' className='form-cadastro'>
        {actionData?.errors?.email && (
          <p className='mensagem-erro'>Por favor, preencha o campo e-mail</p>
        )}
        {actionData?.errors?.data && <p className='mensagem-erro'>{actionData?.errors?.data}</p>}
        {actionData?.success?.data && (
          <p className='mensagem-sucesso'>{actionData?.success?.data}</p>
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
