import { LoaderArgs, json } from '@remix-run/node';
import { Link, useLoaderData, useLocation } from '@remix-run/react';
import { is } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { authenticator } from '~/secure/authentication.server';
import { canView } from '~/secure/authorization';

export async function loader({ request }: LoaderArgs) {
  let usuario = await authenticator.isAuthenticated(request);

  return json({ usuario });
}

export default function Sidebar() {
  const location = useLocation();
  const { usuario } = useLoaderData();
  let [showSidebar, setShowSidebar] = useState('on');

  function handleActivePage() {
    let elements = document.querySelectorAll('.link-page');

    elements.forEach((element) => {
      element.className = element.className.replace('active', '');
      if (
        location.pathname.includes(element.getAttribute('href')) ||
        element.getAttribute('href') == location.pathname
      ) {
        element.className = 'active ' + element.classList.toString();
      }
    });
  }

  function toggleSidebar() {
    setShowSidebar(showSidebar == 'on' ? 'off' : 'on');
  }

  //@ts-ignore
  function isSmallScreen(width) {
    if (width < 1300) {
      setShowSidebar('off');
      document.getElementById('nav-toggle').checked = false;
    }
  }

  useEffect(() => {
    window.addEventListener('resize', (e) => {
      isSmallScreen(e.target.innerWidth);
    });

    handleActivePage();
    isSmallScreen(window.innerWidth);
  }, [location]);

  return (
    <>
      <input
        type='checkbox'
        id='nav-toggle'
        defaultChecked={showSidebar == 'on' ? true : false}
        onChange={toggleSidebar}
      />
      <div className='sidebar'>
        <div className='sidebar-brand'>
          <h2>
            <span className='lab la-mixcloud'></span>
            <span>ChaveCloud</span>
          </h2>
        </div>

        {usuario && (
          <div className='sidebar-menu'>
            <ul>
              {canView('/dashboard', usuario?.papel) && (
                <li>
                  <Link to='/dashboard' className='link-page'>
                    <span className='las la-chart-area'></span>
                    <span>Dashboard</span>
                  </Link>
                </li>
              )}
              {canView('/calendario', usuario?.papel) && (
                <li>
                  <Link to='/calendario' className='link-page'>
                    <span className='las la-calendar'></span>
                    <span>Calendário</span>
                  </Link>
                </li>
              )}
              {canView('/financeiro', usuario?.papel) && (
                <li>
                  <Link to='/financeiro' className='link-page'>
                    <span className='las la-calculator'></span>
                    <span>Financeiro</span>
                  </Link>
                </li>
              )}
              {canView('/gente', usuario?.papel) && (
                <li>
                  <Link to='/gente' className='link-page'>
                    <span className='las la-people-carry'></span>
                    <span>Gente</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
