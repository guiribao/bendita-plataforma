import { Perfil } from '@prisma/client';
import { useLocation } from '@remix-run/react';
import { ReactElement, useEffect } from 'react';

interface MinicardsProps {
  data: object;
  role: string;
}

export default function Minicards({ cards, role }: MinicardsProps) {
  let location = useLocation();

  // Minicards deve ser um componente universal
  // Criar objeto data em dashboard com os seguintes campos
  // quantidade, label, icon

  return (
    <div className='minicards' data-role={role}>
      {cards.map((card) => (
        <div className={`card-single ${card.classes}`} key={card.label} onClick={card.callback}>
          <div>
            <h1>{card.quantidade || 0}</h1>
            <span>{card.label}</span>
          </div>
          <div>
            <span className={`${card.icon}`}></span>
          </div>
        </div>
      ))}
    </div>
  );
}
