import { Perfil } from '@prisma/client';
import { useLocation } from '@remix-run/react';
import { ReactElement, useEffect } from 'react';

interface MinicardsProps {
  data: object;
}

export default function Minicards({ data }: MinicardsProps) {
  let location = useLocation();

  // Minicards deve ser um componente universal
  // Criar objeto data em dashboard com os seguintes campos
  // quantidade, label, icon

  return (
    <div className='minicards'>
      <div className='card-single'>
        <div>
          <h1>{1}</h1>
          <span>Fardados</span>
        </div>
        <div>
          <span className='las la-star'></span>
        </div>
      </div>
      <div className='card-single'>
        <div>
          <h1>{1}</h1>
          <span>Visitantes</span>
        </div>
        <div>
          <span className='las la-users'></span>
        </div>
      </div>
      <div className='card-single'>
        <div>
          <h1>123</h1>
          <span>Operações saída</span>
        </div>
        <div>
          <span className='las la-file-export'></span>
        </div>
      </div>
      <div className='card-single'>
        <div>
          <h1>642</h1>
          <span>Operações entrada</span>
        </div>
        <div>
          <span className='las la-file-import'></span>
        </div>
      </div>
    </div>
  );
}
