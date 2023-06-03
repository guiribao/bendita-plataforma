import { LoaderArgs } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';


export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Dashboard - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content:
        'Dashboard para análise e geração de relatórios de usuários, de operações e de atividades da núvem do Chave.',
    },
  ];
};

export async function loader({ request }: LoaderArgs) {
  return {};
}

export default function DashboardIndex() {
  return (
    <div>
      <div className="cards">
        <div className="card-single">
          <div>
            <h1>640</h1>
            <span>Membros</span>
          </div>
          <div>
            <span className="las la-users"></span>
          </div>
        </div>
        <div className="card-single">
          <div>
            <h1>35.000</h1>
            <span>Visitantes</span>
          </div>
          <div>
            <span className="las la-user-friends"></span>
          </div>
        </div>
        <div className="card-single">
          <div>
            <h1>409</h1>
            <span>Fardados</span>
          </div>
          <div>
            <span className="las la-star"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
