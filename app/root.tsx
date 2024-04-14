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
  useLocation,
  useNavigation,
} from '@remix-run/react';

import stylesheet from '~/global.css';
import toastyStyle from 'toastify-js/src/toastify.css';
import line_awesome from '~/assets/lib/line-awesome/css/line-awesome.min.css';
import modalStyle from '~/assets/css/modal.css';
import Sidebar from './component/layout/Sidebar';
import Layout from './component/layout/Layout';
import Topbar from './component/layout/Topbar';
import { authenticator } from './secure/authentication.server';
import { Papel, Perfil, Usuario } from '@prisma/client';
import pegarPerfilPeloIdUsuario from './domain/Perfil/perfil-pelo-id-usuario.server';
import { useEffect } from 'react';
import { createHashHistory } from 'history';
import { canAccess, canView, handleElements, loadAditionalRoles, specificDynPages } from './secure/authorization';
import NotAuthorized from './routes/autorizacao';
import { getEnv } from './env.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: line_awesome },
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: toastyStyle },
  { rel: 'stylesheet', href: modalStyle },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => {
  return [
    { charset: 'utf-8', title: 'ChaveCloud', viewport: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'A Núvem do Chave!' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  //@ts-ignore
  let usuario: Usuario = await authenticator.isAuthenticated(request);
  let perfil: Perfil | null = null;

  if (usuario?.id) {
    const symbol = Object.getOwnPropertySymbols(request)[1];
    const parsed_url = request[symbol].parsedURL;

    if (usuario?.papel == Papel.USUARIO && parsed_url.pathname != 'em_breve') {
      return redirect('/em_breve');
    }

    perfil = await pegarPerfilPeloIdUsuario(usuario.id);
    if (!perfil?.id && !request.url.includes('/perfil/editar')) return redirect('/perfil/editar');

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

  // Redireciona pro preenchimento do perfil quando ainda estiver incompleto
  useEffect(() => {
    let history = createHashHistory();

    if (usuario) {
      isAuthorized = canView(location.pathname, usuario.papel);

      if (!perfil && location.pathname !== '/perfil/editar') {
        history.back();
      }
      
      usuario.papelAdicional = async () => await loadAditionalRoles(location.pathname, usuario, perfil);
      handleElements(document, usuario.papel, usuario.papelAdicional, location.pathname);
    }
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
          <Sidebar />
          <div className='content'>
            <Topbar />
            {isAuthorized ? <Outlet /> : <NotAuthorized />}
          </div>
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
