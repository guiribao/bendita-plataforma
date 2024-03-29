import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import successfullyRegistered from '~/assets/img/undraw/successfully-registered.svg'

export const meta: MetaFunction = () => {
  return [{ title: 'ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};


export async function loader({ request }: LoaderFunctionArgs) {
  return {};
}

export default function NotAuthorized() {
  return (
    <main className='cadastrado-sucesso'>
      <div className='header'>
        <img src={successfullyRegistered} alt='Cadastro realizado' width='380' />
        <h1>Hey!</h1>
        <p>Deu tudo certo com seu cadastro.</p>
      </div>
    </main>
  );
}
