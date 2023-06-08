import { LoaderArgs, V2_MetaFunction, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export async function loader({ request }: LoaderArgs) {
  return {};
}

export default function Index() {
  return (
    <main>
      <h1>Home</h1>
    </main>
  );
}
