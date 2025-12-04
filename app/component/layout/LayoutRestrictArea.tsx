import { ReactElement } from 'react';
import type { LinksFunction } from '@remix-run/node';

import { Usuario, Papel } from '@prisma/client';
import NavRestrictArea from '../NavRestrictArea';
import templateStyle from '~/assets/css/template.css';

interface LayoutProps {
  children: ReactElement | ReactElement[];
  usuarioSistema: Usuario | { papel: Papel; [key: string]: any };
  mensagensNaoLidas?: number;
}


const LayoutRestrictArea = ({ children, usuarioSistema, mensagensNaoLidas = 0 }: LayoutProps) => (
  <div className='plat-container' style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
    <NavRestrictArea role={usuarioSistema.papel} mensagensNaoLidas={mensagensNaoLidas} />
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
);

export default LayoutRestrictArea;
