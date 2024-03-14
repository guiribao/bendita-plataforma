import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { authenticator } from '~/secure/authentication.server';

export const meta: MetaFunction = () => {
  return [{ title: 'Saindo...' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.logout(request, { redirectTo: '/autentica/entrar' });
  return {};
}

export default function Sair() {
  return null;
}
