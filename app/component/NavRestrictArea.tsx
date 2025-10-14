import { LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Col, Container, Nav, Navbar, Row } from 'react-bootstrap';
import pegarPerfilPeloIdUsuario from '~/domain/Perfil/perfil-pelo-id-usuario.server';

interface NavRestrictProps {
  role: string;
}

const NavRestrictArea: React.FC<NavRestrictProps> = ({ role }) => (
  <Container>
    <Row>
      <Navbar bg='light' data-bs-theme='light' className='mt-2 rounded-pill'>
        <Container>
          <Nav className='me-5'>
            <Nav.Link href='/app/dashboard'>Dashboard</Nav.Link>
            <Nav.Link href='/app/gente'>Gente</Nav.Link>
            <Nav.Link href='/app/documentos'>Documentos</Nav.Link>
            <Nav.Link href='/app/medicacao'>Medicação</Nav.Link>
            <Nav.Link href='/app/financeiro'>Financeiro</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </Row>
  </Container>
);

export default NavRestrictArea;
