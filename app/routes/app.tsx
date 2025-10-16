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

import appStyle from '~/assets/css/app.css';

import { verificarIdade } from '~/shared/DateTime.util';
import { useEffect, useRef, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Plataforma  - Associação Bendita Canábica' },
    {
      name: 'description',
      content:
        'Plataforma da Associação Bendita Canábica',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: appStyle }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return null;
}

export default function App() {
  return <Outlet />;
}
