import { ReactElement } from 'react';
import type { LinksFunction } from '@remix-run/node';

import { Usuario } from '@prisma/client';
import NavRestrictArea from '../NavRestrictArea';
import templateStyle from '~/assets/css/template.css';

interface LayoutProps {
  children: ReactElement | ReactElement[];
  usuarioSistema: Usuario;
}

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: templateStyle }];
};

const LayoutRestrictArea = ({ children, usuarioSistema }: LayoutProps) => (
  <div className='plat-container'>
    <NavRestrictArea role={usuarioSistema.papel} />
    {children}
  </div>
);

export default LayoutRestrictArea;
