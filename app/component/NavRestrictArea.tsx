import { useLocation } from '@remix-run/react';
import { Container, Nav, Navbar, Row } from 'react-bootstrap';

interface NavRestrictProps {
  role: string;
}

const NavRestrictArea: React.FC<NavRestrictProps> = ({ role }) => {
  const location = useLocation();

  return (
    <Container fluid>
      <Row>
        <Navbar bg='light' data-bs-theme='light' className='my-3 menu-bar'>
          <Container>
            <Nav className='mx-auto'>
              <Nav.Link href='/app/dashboard'>
                <i className='las la-chart-line'></i>Dashboard
              </Nav.Link>
              <Nav.Link href='/app/gente'>
                <i className='las la-people-carry'></i>Gente
              </Nav.Link>
              <Nav.Link href='/app/documentos'>
                <i className='las la-file-alt'></i>Documentos
              </Nav.Link>
              <Nav.Link href='/app/medicacao'>
                <i className='las la-notes-medical'></i>Medicação
              </Nav.Link>
              <Nav.Link href='/app/financeiro'>
                <i className='las la-hand-holding-usd'></i>Financeiro
              </Nav.Link>
            </Nav>
          </Container>
        </Navbar>
      </Row>
    </Container>
  );
};

export default NavRestrictArea;
