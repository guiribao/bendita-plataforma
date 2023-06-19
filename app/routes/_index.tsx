import { LoaderArgs, V2_MetaFunction } from '@remix-run/node';
import { authenticator } from '~/secure/authentication.server';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'ChaveCloud' }, { name: 'description', content: 'A Núvem do Chave!' }];
};

export async function loader({ request }: LoaderArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
    failureRedirect: '/autentica/entrar',
  });

  return {};
}

export default function Index() {
  return <main>Redirecionando...</main>;
}
