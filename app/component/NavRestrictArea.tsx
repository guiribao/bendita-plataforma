import { Link, useLocation } from '@remix-run/react';
import { Container, Nav, Navbar, Badge } from 'react-bootstrap';
import { getMenuItemsForRole } from '~/secure/menu-config';

interface NavRestrictProps {
  role: string;
  mensagensNaoLidas?: number;
}

const NavRestrictArea: React.FC<NavRestrictProps> = ({ role, mensagensNaoLidas = 0 }) => {
  const location = useLocation();
  const menuItems = getMenuItemsForRole(role);

  return (
    <Navbar 
      bg='white' 
      className='navbar-restrict shadow-sm border-bottom mb-4' 
      style={{ padding: '0.5rem 0' }}
    >
      <Container fluid>
        <Nav className='gap-1 mx-auto' style={{ 
          overflowX: 'auto', 
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          flexWrap: 'nowrap',
          justifyContent: 'center',
        }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const isContatos = item.id === 'contatos';
            const showBadge = isContatos && mensagensNaoLidas > 0;
            
            return (
              <Nav.Link
                key={item.id}
                to={item.path}
                as={Link}
                className='px-3 px-md-4 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2'
                style={{
                  backgroundColor: isActive ? 'darkorchid' : 'transparent',
                  color: isActive ? 'white' : '#333',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <i className={`${item.icon} nav-restrict-icon`}></i>
                <span className='d-none d-lg-inline'>{item.label}</span>
                {showBadge && (
                  <Badge 
                    bg={isActive ? 'light' : 'danger'} 
                    text={isActive ? 'dark' : 'white'}
                    pill
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      fontWeight: '700',
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      transform: 'translate(25%, -25%)',
                    }}
                  >
                    {mensagensNaoLidas}
                  </Badge>
                )}
              </Nav.Link>
            );
          })}
        </Nav>
      </Container>
    </Navbar>
  );
};

export default NavRestrictArea;

