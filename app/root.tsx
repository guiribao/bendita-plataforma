import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, json, redirect, useLoaderData, useLocation } from '@remix-run/react';

import stylesheet from '~/global.css';
import toastyStyle from 'toastify-js/src/toastify.css';
import line_awesome from '~/assets/lib/line-awesome/css/line-awesome.min.css';
import modalStyle from '~/assets/css/modal.css';
import responsiveStyle from '~/assets/css/responsive.css';
import footerStyle from '~/assets/css/footer.css';
import Layout from './component/layout/Layout';
import Topbar from './component/layout/Topbar';
import { authenticator } from './secure/authentication.server';
import { Papel, Perfil, Usuario } from '@prisma/client';
import pegarPerfilPeloIdUsuario from './domain/Perfil/perfil-pelo-id-usuario.server';
import { useEffect, useState } from 'react';
import { createHashHistory } from 'history';
import { canAccess, canView, handleElements, loadAditionalRoles, specificDynPages } from './secure/authorization';

import NotAuthorized from './routes/app.autorizacao';
import { getEnv } from './env.server';
import { contarMensagensNaoLidas } from './domain/Contatos/contar-mensagens-nao-lidas.server';
import { startEmailCron } from './services/email-cron.server';

import 'bootstrap/dist/css/bootstrap.min.css';
import Footer from './component/Footer';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: line_awesome },
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: toastyStyle },
  { rel: 'stylesheet', href: modalStyle },
  { rel: 'stylesheet', href: responsiveStyle },
  { rel: 'stylesheet', href: footerStyle },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => {
  return [
    { charset: 'utf-8', title: 'Associação Bendita Canábica', viewport: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Plataforma de sócios da Bendita Canabica' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Iniciar cron de emails na primeira requisição
  try {
    startEmailCron();
  } catch (error) {
    console.error('Erro ao iniciar cron de emails:', error);
  }

  //@ts-ignore
  let usuario: Usuario = await authenticator.isAuthenticated(request);
  let perfil: Perfil | null = null;
  let mensagensNaoLidas = 0;

  // Obter URL do request de forma compatível com v3_singleFetch
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (usuario?.id) {
    perfil = await pegarPerfilPeloIdUsuario(usuario.id);

    // Contar mensagens não lidas apenas para ADMIN e SECRETARIA
    if (usuario.papel === Papel.ADMIN || usuario.papel === Papel.SECRETARIA) {
      mensagensNaoLidas = await contarMensagensNaoLidas();
    }

    let canAccessSpecific = specificDynPages(pathname, usuario.papel);

    if (!canAccessSpecific && !request.url.includes('/app/autorizacao') && !canAccess(pathname, usuario.papel)) return redirect('/app/autorizacao');
  }

  return json({ ENV: getEnv(), usuario, perfil, mensagensNaoLidas });
}

export default function App() {
  let location = useLocation();
  let { ENV, usuario, perfil, mensagensNaoLidas } = useLoaderData<typeof loader>();
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

      usuario.papelAdicional = async () => await loadAditionalRoles(location.pathname, perfil.id);
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
          <Footer />
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
