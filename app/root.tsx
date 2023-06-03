import type { LinksFunction, V2_MetaFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

import stylesheet from '~/global.css';
import line_awesome from '~/assets/lib/line-awesome/css/line-awesome.min.css';
import Sidebar from './components/layout/Sidebar';
import Layout from './components/layout/Layout';
import Topbar from './components/layout/Topbar';

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

export default function App() {
  return (
    <html lang='pt-BR'>
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
        <script src={`${process.env.APP_URL}/init-alpine.js`}></script>
        <LiveReload />
      </body>
    </html>
  );
}
