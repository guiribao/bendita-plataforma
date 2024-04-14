//@ts-nocheck
import { json } from '@remix-run/node';

import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import { useRef, useState } from 'react';

import novoEventoPageStyle from '~/assets/css/novo-evento-page.css';
import novoEvento from '~/domain/Calendario/novo-evento.server';
import { authenticator } from '~/secure/authentication.server';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Feira - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Feirinha de empreendedorismo do Chave',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: novoEventoPageStyle }];
};

export async function action({ request }: ActionFunctionArgs) {
  return {};
}

export async function loader({ request }: LoaderFunctionArgs) {
  let APP_URL = process.env.APP_URL;
  
  return json({ APP_URL });
}

export default function FeiraIndex() {
  const { APP_URL } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <main>
      <div className='view_container'>
        <div className='view'>
          <div className='view-header'>
            <h1>Feira </h1>
            <Link to={'/calendario'}>Voltar</Link>
          </div>
          <div className='view-body'>
            <div data-role='CARDS_FEIRANTE'>Apenas feirantes verão isso!</div>
          </div>
          <div className='view-footer'></div>
        </div>
      </div>
    </main>
  );
}
