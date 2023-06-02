import { LoaderArgs, V2_MetaFunction, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export async function loader({ request }: LoaderArgs) {
  return json({ ok: true });
}

export default function Index() {
  let data = useLoaderData<typeof loader>();
  console.log(data);
  return <h1 className='text-3xl font-bold underline'>Hello world!</h1>;
}
