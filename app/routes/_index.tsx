import { LinksFunction, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { useEffect, useRef } from 'react';

import { authenticator } from '~/secure/authentication.server';

import siteStyle from '~/assets/css/site.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: siteStyle },
];

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request);

  return { usuario };
}

export default function Index() {
  return <main className='inicial'>
    <div className='overlay'></div>
    <section className='disclaimer'>
      <h2> Nulla bibendum</h2>
      <p> Donec imperdiet ultrices elit, a porttitor nulla lacinia quis. Nam quis hendrerit velit. Maecenas quis faucibus massa. Suspendisse vel bibendum libero. Quisque leo nibh, tempus et lectus non, sollicitudin porta augue.</p>
    </section>
    <section className='call-to-action'>
      <Link to={'/cadastro'}>
        <i className="las la-arrow-right"></i>
        Associe-se
      </Link>
    </section>
  </main>;
}
