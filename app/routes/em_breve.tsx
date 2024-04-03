import { json } from '@remix-run/node';
import type {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import loading from '~/assets/img/loading.gif';
import perfilEditarPageStyle from '~/assets/css/perfil-editar-page.css';
import { Escolaridade, EstadoCivil, Grupo } from '@prisma/client';
import { ChangeEvent, useEffect, useState } from 'react';
import { parseDateTimeTZ, verificarIdade } from '~/shared/Date.util';
import InputMask from 'react-input-mask';

import Usuario from '~/model/Usuario.server';
import novoPerfil from '~/domain/Perfil/novo-perfil.server';
import successfullyRegistered from '~/assets/img/undraw/successfully-registered.svg';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Em breve - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'A super núvem do Chave',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: perfilEditarPageStyle }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario: Usuario | null = await authenticator.isAuthenticated(request);

  if (usuario) {
    return await authenticator.logout(request, { redirectTo: '/em_breve' });
  }

  return {};
}

export default function EmBreve() {
  return (
    <main>
      <div className='header cadastro'></div>
      <div className='form-perfil' id='cadastrado'>
        <img src={successfullyRegistered} alt='Cadastro realizado' width='320' />
        <p style={{ textAlign: 'center' }}>
          <h1>Oba!</h1>
          Já pensou em fazer compras na lojinha do CHAVE de forma fácil?{' '}
          <strong>Nós pensamos.</strong>
          <br />
          Estamos preparando uma experiência incrível para você.
        </p>
      </div>

      <div className='footer'></div>
    </main>
  );
}
