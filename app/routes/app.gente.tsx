//@ts-nocheck
import {
  FinalidadeOperacao,
  Papel,
  Perfil,
  TipoAssociado,
  Usuario,
} from '@prisma/client';
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Breadcrumb,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  Row,
  Table,
} from 'react-bootstrap';
import { CurrencyInput } from 'react-currency-mask';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import Minicards from '~/component/Minicards';
import pegarDadosEventosDashboard from '~/domain/Calendario/pegar-dados-eventos-dashboard.server';
import pegarDadosOperacoesDashboard from '~/domain/Financeiro/pegar-dados-operacoes-dashboard.server';
import pegarDadosPerfisDashboard from '~/domain/Perfil/pegar-dados-perfis-dashboard.server';
import pegarPerfis from '~/domain/Perfil/pegar-perfis.server';
import { authenticator } from '~/secure/authentication.server';
import { brDataFromIsoString, brDisplayDateTime } from '~/shared/DateTime.util';
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

  let listaDePerfis: Perfil[] | null = await pegarPerfis();

  return json({ usuario, listaDePerfis });
}

type UserLoaderDataType = {
  usuario: Usuario;
  listaDePerfis: Perfil[] | null;
};

const Gente = () => {
  const { usuario, listaDePerfis } = useLoaderData<UserLoaderDataType>();

  console.log(listaDePerfis);
  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      {/* Criar componente layout area logado */}
      {/* Criar componente menu com opões dinamicas pela user role */}
      <Container fluid className='app-content'>
        <Row className='align-items-center mt-1 mb-3'>
          <Col sm={1}>
            <h2>Gente</h2>
          </Col>
        </Row>

        <Row className='mb-4'>
          <Col sm={5} md={4}>
            <Form.Group controlId='filterNome'>
              <Form.Control type='text' placeholder='Buscar por nome' />
            </Form.Group>
          </Col>
          <Col sm={5} md={2}>
            <Form.Select aria-label='Tipo Gente'>
              <option defaultChecked>Todos perfis</option>
              <option value={Papel.ASSOCIADO}>Associado</option>
              <option value={Papel.ASSOCIADO_DEPENDENTE}>
                Associado Dependente
              </option>
              <option value={Papel.ADMIN}>Administrador</option>
              <option value={Papel.SECRETARIA}>Secretaria</option>
              <option value={Papel.SAUDE}>Saúde</option>
            </Form.Select>
          </Col>
          <Col sm={1}>
            <Dropdown>
              <Dropdown.Toggle
                variant='outline-dark'
                className='novo-cadastro-btn'
                id='dropdown-basic'
              >
                Novo cadastro
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item href='#/action-1'>Associado</Dropdown.Item>
                <Dropdown.Item href='#/action-2'>Bendita</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col>
            <Table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Data de nascimento</th>
                  <th>Sexo</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {!listaDePerfis && (
                  <tr>
                    <td style={{ textAlign: 'center' }} colSpan={7}>
                      <p>Nenhum registro encontrado</p>
                    </td>
                  </tr>
                )}
                {listaDePerfis &&
                  listaDePerfis.map((perfil) => {
                    return (
                      <tr key={perfil.id}>
                        <td>{perfil.usuario.papel}</td>
                        <td>{perfil.nome_completo}</td>
                        <td>{brDataFromIsoString(perfil.data_nascimento)}</td>
                        <td>{perfil.sexo}</td>
                        <td>{perfil.telefone}</td>
                        <td>{perfil.usuario.email}</td>
                        <td>{brDisplayDateTime(perfil.criado_em)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row className='mt-3'>
          <Col>
            <p>
              {listaDePerfis && (
                <p>
                  <strong>Resultado:</strong> {listaDePerfis.length}
                  {listaDePerfis.length === 1
                    ? ' perfil encontrado'
                    : ' perfis encontrado'}
                </p>
              )}
            </p>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
};

export default Gente;
