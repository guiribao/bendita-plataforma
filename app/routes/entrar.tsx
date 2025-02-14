import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  json,
} from '@remix-run/node';
import { useEffect, useState } from 'react';
import { Form, Outlet, useActionData, useNavigate, useNavigation } from '@remix-run/react';

import { AssociacaoStatus, TipoAssociado } from '@prisma/client';

import atualizarIndicacaoAssociado from '~/domain/Associado/atualizar-indicacao-associado.server';
import pegarAssociadoPorId from '~/domain/Associado/pegar-por-id.server';

import { authenticator } from '~/secure/authentication.server';

import cadastroStyle from '~/assets/css/cadastro.css';
import atualizarTipoAssociado from '~/domain/Associado/atualizar-tipo-associado.server';
import atualizarStatusAssociado from '~/domain/Associado/atualizar-status-associado.server';



export const meta: MetaFunction = () => {
  return [
    { title: 'Cadastro  - Bendita Associação Canábica' },
    { name: 'description', content: 'Solicitação de análise associativa da Bendita Associação Canábica' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()

  return null

};

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
}

export default function CadastroTermos() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const actionData = useActionData();

  const [perfilId, setPerfilId] = useState("")
  const [associadoId, setAssociadoId] = useState("")

  useEffect(() => {
    let storage = localStorage.getItem('basico');
    //if (!storage) return navigate('/cadastro/basico')

    let basico = JSON.parse(storage);

    setPerfilId(basico.perfilId)
    setAssociadoId(basico.associadoId)

  }, [])

  return <div>
    <Outlet />
    Entrar
  </div>
}
