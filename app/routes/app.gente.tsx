//@ts-nocheck
import { FinalidadeOperacao, TipoAssociado, Usuario } from '@prisma/client';
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Breadcrumb, Col, Container, Form, Row } from 'react-bootstrap';
import { CurrencyInput } from 'react-currency-mask';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import Minicards from '~/component/Minicards';
import pegarDadosEventosDashboard from '~/domain/Calendario/pegar-dados-eventos-dashboard.server';
import pegarDadosOperacoesDashboard from '~/domain/Financeiro/pegar-dados-operacoes-dashboard.server';
import pegarDadosPerfisDashboard from '~/domain/Perfil/pegar-dados-perfis-dashboard.server';
import { authenticator } from '~/secure/authentication.server';
import { gerarDescricaoOperacaoFeira } from '~/shared/Operacao.util';

export const meta: MetaFunction = () => {
  return [
    { title: 'Gente  - Associação Bendita Canábica' },
    {
      name: 'description',
      content:
        'Página de gerenciamento de Gente do app da Associação Bendita Canábica.',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return json({ usuario });
}

type UserLoaderDataType = {
  usuario: Usuario;
};

const Gente = () => {
  const { usuario } = useLoaderData<UserLoaderDataType>();

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      {/* Criar componente layout area logado */}
      {/* Criar componente menu com opões dinamicas pela user role */}
      <Container className='py-5 app-container'>
        <Row>
          <Col>
            <h2>Gente</h2>
            <p>Busque e visualize dados de pessoas</p>
          </Col>
          <Col>Busca por perfil Filtros Select tipo de visão tabela/cards</Col>
        </Row>

        <Row>
          <Col sm={6} md={3}>
            <Form.Group className='mb-3' controlId='filterNome'>
              <Form.Control
                type='text'
                placeholder='Buscar por nome'
                size='sm'
              />
            </Form.Group>
          </Col>
          <Col sm={6} md={2}>
            <Form.Select aria-label='Tipo de associado' size='sm'>
              <option>Filtrar por tipo associação</option>
              <option value={TipoAssociado.APOIADOR}>APOIADOR</option>
              <option value={TipoAssociado.MEDICINAL}>MEDICINAL</option>
            </Form.Select>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
};

export default Gente;
