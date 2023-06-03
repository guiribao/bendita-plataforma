export default function Sidebar() {
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
            <a href=''>
              <span className='las la-chart-area'></span>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a href=''>
              <span className='las la-calendar'></span>
              <span>Calendário</span>
            </a>
          </li>
          <li>
            <a href=''>
              <span className='las la-user-friends'></span>
              <span>Financeiro</span>
            </a>
          </li>
          <li>
            <a href=''>
              <span className='las la-igloo'></span>
              <span>Gente</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
