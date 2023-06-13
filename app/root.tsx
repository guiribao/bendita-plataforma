import { LinksFunction, LoaderArgs, V2_MetaFunction, json, redirect } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';

import stylesheet from '~/global.css';
import line_awesome from '~/assets/lib/line-awesome/css/line-awesome.min.css';
import Sidebar from './component/layout/Sidebar';
import Layout from './component/layout/Layout';
import Topbar from './component/layout/Topbar';
import { authenticator } from './secure/auth.server';
import { Perfil, Usuario } from '@prisma/client';
import pegarPerfilPeloIdUsuario from './domain/Perfil/perfil-pelo-id-usuario.server';

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: line_awesome },
    { rel: 'stylesheet', href: stylesheet },
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

  if(usuario?.id) {
    perfil = await pegarPerfilPeloIdUsuario(usuario.id);
  }

  if(usuario && !perfil?.id && !request.url.includes('/perfil')) return redirect('/perfil/editar')

  return json({ usuario, perfil });
}

export default function App() {
  let { usuario, perfil } = useLoaderData();
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
