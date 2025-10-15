import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  json,
  redirect,
} from '@remix-run/node';
import {
  Link,
  Outlet,
  useActionData,
  useLocation,
  useNavigate,
  useSubmit,
} from '@remix-run/react';

import { authenticator } from '~/secure/authentication.server';

import criarNovoUsuario from '~/domain/Usuario/criar-novo-usuario.server';
import perfilPorEmailCpf from '~/domain/Perfil/perfil-por-cpf.server';

import cadastroStyle from '~/assets/css/cadastro.css';

import { verificarIdade } from '~/shared/DateTime.util';
import { useEffect, useRef, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Cadastro  - Associação Bendita Canábica' },
    {
      name: 'description',
      content:
        'Solicitação de análise associativa da Associação Bendita Canábica',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroStyle }];
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
    errors = Object.assign(errors, {
      data: 'Hmmm! Parece que a verificação de senha não confere',
    });
    return json({ errors });
  }

  if (senha.length < 8) {
    errors = Object.assign(errors, {
      data: 'Sua senha deve ter no minimo 8 caracteres',
    });
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
    await atualizarUsuarioDoPerfil(
      Number(criarUsuario?.id),
      Number(perfilSeExistir.id)
    );

  if (criarUsuario) {
    await authenticator.authenticate('form', request, {
      successRedirect: '/app/dashboard',
      failureRedirect: '/autentica/cadastro',
      context: { formData: form },
    });
  }

  // errors = Object.assign(errors, { data: 'Ops! Algo deu errado ao criar o usuário' });
  // return json({ errors });
};

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  await authenticator.isAuthenticated(request, {
    successRedirect: '/app/dashboard',
  });

  const symbol = Object.getOwnPropertySymbols(request)[1];
  const parsed_url = request[symbol].parsedURL;

  if (parsed_url.pathname == '/cadastro') return redirect('/cadastro/basico');

  return null;
}

export default function App() {


  return <Outlet />;
}
