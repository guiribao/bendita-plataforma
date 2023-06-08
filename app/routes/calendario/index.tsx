import { LoaderArgs } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';


export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Calendário - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content:
        'Gerenciamento do calendário de eventos/trabalhos do Chave',
    },
  ];
};

export async function loader({ request }: LoaderArgs) {
  return {};
}

export default function CalendarioIndex() {
  return (
    <main>
      <h1>Calendário</h1>
    </main>
  );
}
