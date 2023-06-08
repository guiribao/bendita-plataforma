import { useLocation } from 'react-router-dom'
import {getPageInfo} from '~/shared/PageInfo'

import userImage from '~/assets/img/user.png';

export default function Topbar() {
  const location = useLocation();
  const info = getPageInfo(location.pathname)


  return (
      <header>
        <h2>
          <label>
            <span className='las la-bars'></span>
          </label>
          {info?.title}
        </h2>

        <div className='user-wrapper'>
          <img src={userImage} alt='some random user image' width={'40px'} height={'40px'} />
          <div>
            <h4>Mestre Irineu</h4>
            <small>General</small>
          </div>
        </div>
      </header>
  );
}
