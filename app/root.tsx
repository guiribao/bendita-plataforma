import { LinksFunction, LoaderArgs, V2_MetaFunction, json, redirect } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigation,
} from '@remix-run/react';

import stylesheet from '~/global.css';
import toastyStyle from 'toastify-js/src/toastify.css';
import line_awesome from '~/assets/lib/line-awesome/css/line-awesome.min.css';
import Sidebar from './component/layout/Sidebar';
import Layout from './component/layout/Layout';
import Topbar from './component/layout/Topbar';
import { authenticator } from './secure/authentication.server';
import { Perfil, Usuario } from '@prisma/client';
import pegarPerfilPeloIdUsuario from './domain/Perfil/perfil-pelo-id-usuario.server';
import { useEffect } from 'react';
import { createHashHistory } from 'history';

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: line_awesome },
    { rel: 'stylesheet', href: stylesheet },
    { rel: 'stylesheet', href: toastyStyle },
  ];
};

export const meta: V2_MetaFunction = () => {
  return [
    { charset: 'utf-8', title: 'ChaveCloud', viewport: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'A Núvem do Chave!' },
  ];
};

export async function loader({ request }: LoaderArgs) {
  //@ts-ignore
  let usuario: Usuario = await authenticator.isAuthenticated(request);
  let perfil: Perfil | null = null;

  if (usuario?.id) {
    perfil = await pegarPerfilPeloIdUsuario(usuario.id);
    if (!perfil?.id && !request.url.includes('/perfil/editar')) return redirect('/perfil/editar');
  }

  return json({ usuario, perfil });
}

export default function App() {
  let location = useLocation();
  let navigation = useNavigation();
  let { usuario, perfil } = useLoaderData();

  // Redireciona pro preenchimento do perfil quando ainda estiver incompleto
  useEffect(() => {
    let history = createHashHistory();

    if (usuario) {
      if (!perfil && location.pathname !== '/perfil/editar') {
        history.back();
      }
    }
  }, [location.pathname]);

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
            <Outlet />
          </div>
        </Layout>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
