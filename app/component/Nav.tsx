import { LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import pegarPerfilPeloIdUsuario from '~/domain/Perfil/perfil-pelo-id-usuario.server';
import { Papel } from '@prisma/client';

import { authenticator } from '~/secure/authentication.server';

import userImage from '~/assets/img/user.png';

// Função para obter avatar baseado no nome
const obterAvatar = (nome?: string | null, papel?: Papel | string, sexo?: string | null) => {
  const seed = nome?.toLowerCase().replace(/\s/g, '') || 'user';
  const style = 'thumbs'; // estilo formal e profissional
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let usuario = await authenticator.isAuthenticated(request);
  let perfil = null;

  if (usuario) {
    perfil = await pegarPerfilPeloIdUsuario(usuario.id);
  }

  return json({ usuario, perfil });
};

interface NavProps {
  mobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

export default function Nav({ mobileMenuOpen, closeMobileMenu }: NavProps) {
  const { perfil, usuario } = useLoaderData<typeof loader>();

  return (
    <>
      <nav className='menu-nav'>
        <ul className='menu-list'>
          <li>
            <Link to='/sobre'>Sobre</Link>
          </li>
          <li>
            <Link to='/servicos'>Serviços</Link>
          </li>
          <li>
            <Link to='/conhecimento'>Conhecimento</Link>
          </li>
          <li>
            <Link to='/contato'>Contato</Link>
          </li>
        </ul>

        <div className='menu-right'>
          {!usuario && (
            <div className='menu-actions'>
              <Link to='/cadastro/basico' className='btn-primary-gradient'>
                Associe-se
              </Link>
              <Link to='/autentica/entrar' className='btn-text'>
                Entrar
              </Link>
            </div>
          )}

          {usuario && (
            <>
              <Link to='/app/dashboard' className='btn-app'>
                <i className='las la-tachometer-alt'></i>
                <span className='btn-app-text'>App</span>
              </Link>

              {perfil && (
                <div className='user-wrapper'>
                  <img src={obterAvatar(perfil?.nome_completo, usuario?.papel, perfil?.sexo)} alt='user' />
                  <div className='user-info'>
                    <h6>{perfil?.apelido || usuario?.email}</h6>
                    <div className='user-links'>
                      <Link to='/app/perfil'>Perfil</Link>
                      <span>|</span>
                      <Link to='/autentica/sair'>Sair</Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Mobile Menu Drawer */}
      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'active' : ''}`}>
        <div className='mobile-menu-header'>
          <h5 style={{ margin: 0 }}>Menu</h5>
          <button className='mobile-menu-close' onClick={closeMobileMenu}>
            <i className='las la-times'></i>
          </button>
        </div>

        <div className='mobile-menu-content'>
          {usuario && perfil && (
            <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={obterAvatar(perfil?.nome_completo, usuario?.papel, perfil?.sexo)} alt='user' width='40px' height='40px' style={{ borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{perfil?.apelido || usuario?.email}</div>
                  <Link to='/app/perfil' onClick={closeMobileMenu} style={{ fontSize: '0.8rem', color: 'darkorchid' }}>
                    Ver perfil
                  </Link>
                </div>
              </div>
            </div>
          )}

          <Link to='/sobre' className='mobile-menu-item' onClick={closeMobileMenu}>
            <i className='las la-info-circle'></i>
            Sobre
          </Link>
          <Link to='/servicos' className='mobile-menu-item' onClick={closeMobileMenu}>
            <i className='las la-concierge-bell'></i>
            Serviços
          </Link>
          <Link to='/conhecimento' className='mobile-menu-item' onClick={closeMobileMenu}>
            <i className='las la-book'></i>
            Conhecimento
          </Link>
          <Link to='/contato' className='mobile-menu-item' onClick={closeMobileMenu}>
            <i className='las la-envelope'></i>
            Contato
          </Link>

          {usuario && (
            <Link to='/app/dashboard' className='mobile-menu-item' onClick={closeMobileMenu}>
              <i className='las la-tachometer-alt'></i>
              Dashboard
            </Link>
          )}

          <div className='mobile-menu-actions'>
            {!usuario ? (
              <>
                <Link to='/cadastro/basico' className='btn-primary' onClick={closeMobileMenu}>
                  Associe-se
                </Link>
                <Link to='/autentica/entrar' className='btn-secondary' onClick={closeMobileMenu}>
                  Entrar
                </Link>
              </>
            ) : (
              <Link to='/autentica/sair' className='btn-secondary' onClick={closeMobileMenu}>
                <i className='las la-sign-out-alt'></i>
                Sair
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
