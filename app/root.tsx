import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  redirect,
  useLoaderData,
  useLocation
} from '@remix-run/react';

import stylesheet from '~/global.css';
import toastyStyle from 'toastify-js/src/toastify.css';
import line_awesome from '~/assets/lib/line-awesome/css/line-awesome.min.css';
import modalStyle from '~/assets/css/modal.css';
import Layout from './component/layout/Layout';
import Topbar from './component/layout/Topbar';
import { authenticator } from './secure/authentication.server';
import { Papel, Perfil, Usuario } from '@prisma/client';
import pegarPerfilPeloIdUsuario from './domain/Perfil/perfil-pelo-id-usuario.server';
import { useEffect, useState } from 'react';
import { createHashHistory } from 'history';
import {
  canAccess,
  canView,
  handleElements,
  loadAditionalRoles,
  specificDynPages,
} from './secure/authorization';

import NotAuthorized from './routes/autorizacao';
import { getEnv } from './env.server';

import 'bootstrap/dist/css/bootstrap.min.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: line_awesome },
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: toastyStyle },
  { rel: 'stylesheet', href: modalStyle },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => {
  return [
    { charset: 'utf-8', title: 'Associação Bendita Canábica', viewport: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Plataforma de sócios da Bendita Canabica' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  //@ts-ignore
  let usuario: Usuario = await authenticator.isAuthenticated(request);
  let perfil: Perfil | null = null;

  const symbol = Object.getOwnPropertySymbols(request)[1];
  const parsed_url = request[symbol].parsedURL;

  if (usuario?.id) {
    perfil = await pegarPerfilPeloIdUsuario(usuario.id);
    if (!perfil?.id && !request.url.includes('/app/perfil/editar')) return redirect('/app/perfil/editar');

    let canAccessSpecific = specificDynPages(parsed_url.pathname, usuario.papel);

    if (
      !canAccessSpecific &&
      !request.url.includes('/autorizacao') &&
      !canAccess(parsed_url.pathname, usuario.papel)
    )
      return redirect('/autorizacao');
  }

  return json({ ENV: getEnv(), usuario, perfil });
}

export default function App() {
  let location = useLocation();
  let { ENV, usuario, perfil } = useLoaderData();
  let isAuthorized = canView(location.pathname, usuario?.papel);
  let [loading, setLoading] = useState(true);

  // Redireciona pro preenchimento do perfil quando ainda estiver incompleto
  useEffect(() => {
    let history = createHashHistory();

    if (usuario) {
      isAuthorized = canView(location.pathname, usuario.papel);

      if (!perfil && location.pathname !== '/app/perfil/editar') {
        history.back();
      }

      usuario.papelAdicional = async () =>
        await loadAditionalRoles(location.pathname, perfil.id);
      handleElements(document, usuario.papel, usuario.papelAdicional, location.pathname);
    }

    setLoading(false);
  }, [location.key, isAuthorized]);

  return (
    <html lang='pt-BR' suppressHydrationWarning={true}>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout>
          <Topbar />
          {isAuthorized ? <Outlet /> : <NotAuthorized />}
        </Layout>

        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.CLOUD = ${JSON.stringify(ENV)}`,
          }}
        />

        <LiveReload />
      </body>
    </html>
  );
}
