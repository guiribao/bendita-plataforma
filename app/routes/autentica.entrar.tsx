import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction
} from '@remix-run/node';
import {
  Form,
  Link,
  useActionData,
  useNavigation
} from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import cadastroPageStyle from '~/assets/css/cadastro.css';
import loading from "~/assets/img/loading.gif"

export const meta: MetaFunction = () => {
  return [{ title: "Entrar - Bendita Associação Canábica" }, { name: 'description', content: 'A Plataforma da Bendita!' }];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroPageStyle }];
};

export const action: ActionFunction = async ({ request, context }) => {
  let errors = {};

  try {
    await authenticator.authenticate('form', request, {
      successRedirect: '/dashboard',
      throwOnError: true,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    errors = { message: error.message };
    return { errors };
  }
};

export async function loader({ request }: LoaderFunctionArgs) {
  let user = await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
  return {};
}

export default function Entrar() {
  const actionData = useActionData();
  const navigation = useNavigation();

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  return (
    <main className='entrar'>
      <div className='header'>
        <h1>Entrar</h1>
        <p>Informe seus dados de login para entrar</p>
      </div>
      <Form method='POST' className='form-entrar'>
        {actionData?.errors?.message && (
          <p className='mensagem-erro'>{actionData?.errors?.message}</p>
        )}
        <div className='form-group'>
          <label>E-mail</label>
          <input type='email' name='email' id='email' autoComplete='off' />
        </div>
        <div className='form-group'>
          <label>Senha</label>
          <input type='password' name='senha' id='senha' autoComplete='off' />
          <p style={{ textAlign: "center" }}>
            Esqueceu sua senha? <Link to='/autentica/senha'>Clique aqui</Link>
          </p>
        </div>
        <div className='submit-button'>
          {isSubmitting
            ? <img src={loading} alt="Salvando dados" className="loading" />
            : <button type="submit">Entrar</button>}
        </div>
      </Form>
      <div className='footer'>
        <p>
          Para ser sócio da bendita<br />
          <Link to='/autentica/cadastro-socio'>Solicite análise aqui</Link>
        </p>
      </div>
    </main>
  );
}
