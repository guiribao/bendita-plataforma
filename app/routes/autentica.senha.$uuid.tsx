import type {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction} from '@remix-run/node';
import {
  json,
  redirect,
} from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { compareAsc } from 'date-fns/compareAsc';

import { authenticator } from '~/secure/authentication.server';
import loading from '~/assets/img/loading.gif';
import pegarRequisicaoEsqueciSenha from '~/domain/Usuario/pegar-requisicao-esqueci-senha.server';
import pegarUsuarioPeloId from '~/domain/Usuario/pegar-usuario-pelo-id.server';
import type Usuario from '~/model/Usuario.server';
import desativarTokensEsqueciSenha from '~/domain/Usuario/desativar-tokens-esqueci-senha.server';
import { prisma } from '~/secure/db.server';
import { encrypt } from '~/shared/Password.util';
import Toastify from 'toastify-js';
import { useEffect } from 'react';
import cadastroPageStyle from '~/assets/css/cadastro.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'Nova senha - ChaveCloud' },
    { name: 'description', content: 'A Núvem do Chave!' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroPageStyle }];
};

export const action: ActionFunction = async ({ request, params }) => {
  const token = params.uuid;
  if (!token) {
    return redirect('/autentica/entrar');
  }

  const requisicao = await pegarRequisicaoEsqueciSenha(token);
  if (!requisicao?.ativo || compareAsc(new Date(), requisicao.valido_ate) !== -1) {
    return redirect('/autentica/entrar');
  }

  const form = await request.formData();
  const senha: string = form.get('senha') as string;
  const senhaRepetida: string = form.get('senha_repetida') as string;
  const usuarioId = requisicao.usuarioId;

  let errors = {
    senha: !senha,
  };

  let success = {};

  if (Object.values(errors).some(Boolean)) {
    console.log('erro');
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

  const update = await prisma.$transaction(async (tx) => {
    const tokenConsumido = await tx.usuario_Esqueci_Senha.updateMany({
      where: {
        token,
        ativo: true,
        valido_ate: { gt: new Date() },
      },
      data: { ativo: false },
    });

    if (tokenConsumido.count === 0) {
      return null;
    }

    return tx.usuario.update({
      where: { id: usuarioId },
      data: { senha: await encrypt(senha) },
    });
  });

  if (update) {
    await desativarTokensEsqueciSenha(usuarioId);
    return { success: true };
  }

  errors = Object.assign(errors, { data: 'Ops! Algo deu errado ao criar o usuário' });
  return json({ errors, success });
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  let usuario: Usuario | null = await authenticator.isAuthenticated(request, {
    successRedirect: '/app/dashboard',
  });
  //@ts-ignore
  let uuid: string = params.uuid;
  let requisicao = await pegarRequisicaoEsqueciSenha(uuid);

  if (!requisicao?.ativo || compareAsc(new Date(), requisicao.valido_ate) != -1) {
    return redirect('/autentica/entrar');
  }

  //@ts-ignore
  usuario = await pegarUsuarioPeloId(requisicao.usuarioId);

  return { usuario };
}

export default function NovaSenha() {
  const actionData = useActionData<typeof action>();
  const { usuario } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  useEffect(() => {
    if(actionData?.success === true) {
      Toastify({
        text: "Sua senha foi atualizada",
        className: "info",
        style: {
          background: window.CLOUD.NOTIFY_COLOR,
        }
      }).showToast();
    }
  }, [isSubmitting])

  return (
    <main>
      <div className='header'>
        <h1>Nova senha</h1>
        <p>Digite abaixo uma nova senha para sua conta.</p>
      </div>
      <Form method='POST' className='form-cadastro'>
        {actionData?.errors?.data && <p className='mensagem-erro'>{actionData?.errors?.data}</p>}
        {actionData?.success?.data && (
          <p className='mensagem-sucesso'>{actionData?.success?.data}</p>
        )}
        <input
          type='hidden'
          name='usuario_id'
          id='usuario_id'
          value={usuario?.id ?? ''}
          autoComplete='off'
        />
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
