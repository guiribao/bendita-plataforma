import { Link, useLocation } from '@remix-run/react';
import { Container, Nav, Navbar, Row } from 'react-bootstrap';

interface NavRestrictProps {
  role: string;
}

const NavRestrictArea: React.FC<NavRestrictProps> = ({ role }) => {
  const location = useLocation();
  console.log()
  return (
    <Container fluid>
      <Row>
        <Navbar bg='light' data-bs-theme='light' className='my-3 menu-bar'>
          <Container>
            <Nav className='ml-5'>
              <Nav.Link to='/app/dashboard' as={Link} active={location.pathname === '/app/dashboard'}>
                <i className='las la-chart-line'></i>Dashboard
              </Nav.Link>
              <Nav.Link to='/app/gente' as={Link} active={location.pathname === '/app/gente'}>
                <i className='las la-people-carry'></i>Gente
              </Nav.Link>
              <Nav.Link to='/app/documentos' as={Link} active={location.pathname === '/app/documentos'}>
                <i className='las la-file-alt'></i>Documentos
              </Nav.Link>
              <Nav.Link to='/app/medicacao' as={Link} active={location.pathname === '/app/medicacao'}>
                <i className='las la-notes-medical'></i>Medicação
              </Nav.Link>
              <Nav.Link to='/app/financeiro' as={Link} active={location.pathname === '/app/financeiro'}>
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
