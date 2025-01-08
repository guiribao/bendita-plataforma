//@ts-nocheck
import { FinalidadeOperacao } from '@prisma/client';
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CurrencyInput } from 'react-currency-mask';
import Minicards from '~/component/Minicards';
import pegarDadosEventosDashboard from '~/domain/Calendario/pegar-dados-eventos-dashboard.server';
import pegarDadosOperacoesDashboard from '~/domain/Financeiro/pegar-dados-operacoes-dashboard.server';
import pegarDadosPerfisDashboard from '~/domain/Perfil/pegar-dados-perfis-dashboard.server';
import { authenticator } from '~/secure/authentication.server';
import { gerarDescricaoOperacaoFeira } from '~/shared/Operacao.util';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Dashboard - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content:
        'Dashboard para análise e geração de relatórios de usuários, de operações e de atividades da núvem do Chave',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return json({ });
}

export default function DashboardIndex() {

  return (
    <main>
        Dashboard
    </main>
  );
}
