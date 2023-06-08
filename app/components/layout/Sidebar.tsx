import { Link, useLocation } from '@remix-run/react';
import { useEffect } from 'react';

export default function Sidebar() {
  let location = useLocation();

  function handleActivePage() {
    let elements = document.querySelectorAll('.link-page');

    elements.forEach(element => {
      element.className = element.className.replace('active', '');
      console.log(location.pathname);
      if(element.getAttribute('href') == location.pathname) {
        element.className = "active " + element.classList.toString()
      }
    })
    console.log(elements)
  }

  useEffect(() => {
    handleActivePage();
  }, [location]);

  return (
    <div className='sidebar'>
      <div className='sidebar-brand'>
        <h2>
          <span className='lab la-mixcloud'></span>ChaveCloud
        </h2>
      </div>

      <div className='sidebar-menu'>
        <ul>
          <li>
            <Link to='/dashboard' className='link-page'>
              <span className='las la-chart-area'></span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to='/calendario' className='link-page'>
              <span className='las la-calendar'></span>
              <span>Calendário</span>
            </Link>
          </li>
          <li>
            <Link to='/financeiro' className='link-page'>
              <span className='las la-user-friends'></span>
              <span>Financeiro</span>
            </Link>
          </li>
          <li>
            <Link to='/gente' className='link-page'>
              <span className='las la-igloo'></span>
              <span>Gente</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
