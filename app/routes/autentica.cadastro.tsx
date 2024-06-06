import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  json,
} from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';

import { authenticator } from '~/secure/authentication.server';
import criarNovoUsuario from '~/domain/Usuario/criar-novo-usuario.server';

import cadastroPageStyle from '~/assets/css/cadastro-page.css';
import loading from '~/assets/img/loading.gif';
import InputMask from 'react-input-mask';
import perfilPorEmailCpf from '~/domain/Perfil/perfil-por-email-cpf.server';
import atualizarUsuarioDoPerfil from '~/domain/Perfil/atualizar-usuario-do-perfil.server';
import { verificarIdade } from '~/shared/Date.util';

export const meta: MetaFunction = () => {
  return [
    { title: 'Cadastro de usuário - ChaveCloud' },
    { name: 'description', content: 'A Núvem do Chave!' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroPageStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email: string = form.get('email') as string;
  const senha: string = form.get('senha') as string;
  const cpf: string = form.get('cpf') as string;
  const senhaRepetida: string = form.get('senha_repetida') as string;
  const data_nascimento: string = form.get('data_nascimento') as string;

  let errors = {
    email: !email,
    senha: !senha,
    cpf: !cpf,
  };

  if (Object.values(errors).some(Boolean)) {
    const values = Object.fromEntries(form);
    return json({ errors, values });
  }

  if (senha != senhaRepetida) {
    errors = Object.assign(errors, { data: 'Hmmm! Parece que a verificação de senha não confere' });
    return json({ errors });
  }

  if (senha.length < 8) {
    errors = Object.assign(errors, { data: 'Sua senha deve ter no minimo 8 caracteres' });
    return json({ errors });
  }

  let perfilSeExistir = await perfilPorEmailCpf(email, cpf);

  if (email == perfilSeExistir?.email) {
    return json({
      errors: {
        data: 'Já existe uma conta associada a este e-mail, solicite recuperação de senha.',
      },
    });
  }

  if (verificarIdade(data_nascimento) < 18) {
    return json({
      errors: {
        data: 'Cadastro permitido apenas para maiores de 18 anos.',
      },
    });
  }
  
  if (perfilSeExistir?.cpf == cpf && perfilSeExistir?.usuarioId) {
    return json({
      errors: {
        data:
          perfilSeExistir?.usuario.email +
          ', é você? Caso sim, utilize o campo esqueci minha senha.',
      },
    });
  }

  let criarUsuario = await criarNovoUsuario(email, senha);

  if (perfilSeExistir)
    await atualizarUsuarioDoPerfil(Number(criarUsuario?.id), Number(perfilSeExistir.id));

  if (criarUsuario) {
    await authenticator.authenticate('form', request, {
      successRedirect: '/dashboard',
      failureRedirect: '/autentica/cadastro',
      context: { formData: form },
    });
  }

  // errors = Object.assign(errors, { data: 'Ops! Algo deu errado ao criar o usuário' });
  // return json({ errors });
};

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
}

export default function Cadastro() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

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
          <label htmlFor='cpf'>Seu CPF *</label>
          <InputMask
            type='text'
            name='cpf'
            id='cpf'
            autoComplete='off'
            mask='999.999.999-99'
            maskChar={' '}
            required
          />
        </div>
        <div className='form-group'>
          <label htmlFor='email'>Seu melhor e-mail *</label>
          <input type='email' name='email' id='email' autoComplete='off' />
        </div>
        <div className='form-group'>
          <label htmlFor='valida_data_nascimento'>Data de nascimento</label>
          <input
            type='date'
            name='data_nascimento'
            id='data_nascimento'
            defaultValue={''}
            autoComplete='off'
            required
          />
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
