import { LoaderArgs } from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/node';


export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Financeiro - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content:
        'Gerenciamento de operações financeiras de entrada e saída do Chave',
    },
  ];
};

export async function loader({ request }: LoaderArgs) {
  return {};
}

export default function FinanceiroIndex() {
  return (
    <main>
      <h1>Financeiro</h1>
    </main>
  );
}
