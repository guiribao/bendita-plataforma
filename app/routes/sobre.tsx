import { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { authenticator } from '~/secure/authentication.server';

import scrollImg from '~/assets/img/scroll.gif'
import siteStyle from '~/assets/css/site.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: siteStyle },
];

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request);

  return { usuario };
}

export default function Index() {
  let data = useLoaderData()

  return <main className='sobre'>
    <div className='overlay'></div>
    <section className='disclaimer'>
      <h2> Sobre</h2>
      <p> Donec imperdiet ultrices elit, a porttitor nulla lacinia quis. Nam quis hendrerit velit. Maecenas quis faucibus massa. Suspendisse vel bibendum libero. Quisque leo nibh, tempus et lectus non, sollicitudin porta augue.</p>
      <img src={scrollImg} />
    </section>

    <section className='missao'>
      Missão e visão
    </section>

  </main>;
}
