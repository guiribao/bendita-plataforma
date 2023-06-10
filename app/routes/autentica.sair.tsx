import { LoaderArgs, V2_MetaFunction, json } from '@remix-run/node';
import { authenticator } from '~/secure/auth.server';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'Saindo...' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export async function loader({ request }: LoaderArgs) {
  await authenticator.logout(request, {redirectTo: '/autentica/entrar'})
  return {};
}

export default function Sair() {
  return null
}
