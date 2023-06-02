import type { LinksFunction, V2_MetaFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

import stylesheet from '~/tailwind.css';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }];

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
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <script src={`${process.env.APP_URL}/init-alpine.js`}></script>
        <LiveReload />
      </body>
    </html>
  );
}
