import { Container, Nav, Navbar, Row } from 'react-bootstrap';

interface NavRestrictProps {
  role: string;
}

const NavRestrictArea: React.FC<NavRestrictProps> = ({ role }) => (
  <Container>
    <Row>
      <Navbar bg='light' data-bs-theme='light' className='my-3 rounded-pill menu-bar'>
        <Container>
          <Nav className='mx-auto'>
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
