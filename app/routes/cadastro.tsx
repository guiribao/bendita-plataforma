import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  json,
  redirect,
} from '@remix-run/node';
import { Link, Outlet, useActionData, useLocation, useNavigate, useSubmit } from '@remix-run/react';

import { authenticator } from '~/secure/authentication.server';



import criarNovoUsuario from '~/domain/Usuario/criar-novo-usuario.server';
import perfilPorEmailCpf from '~/domain/Perfil/perfil-por-cpf.server';

import cadastroStyle from '~/assets/css/cadastro.css';

import InputMask from 'react-input-mask';

import { verificarIdade } from '~/shared/DateTime.util';
import { useEffect, useRef, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Cadastro  - Bendita Associação Canábica' },
    { name: 'description', content: 'Solicitação de análise associativa da Bendita Associação Canábica' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email: string = form.get('email') as string;
  const senha: string = form.get('senha') as string;
  const cpf: string = form.get('cpf') as string;
  const senhaRepetida: string = form.get('senha_repetida') as string;
  const data_nascimento: string = form.get('data_nascimento') as string;

  let errors = {
    email: !email,
    senha: !senha,
    cpf: !cpf,
  };

  if (Object.values(errors).some(Boolean)) {
    const values = Object.fromEntries(form);
    return json({ errors, values });
  }

  if (senha != senhaRepetida) {
    errors = Object.assign(errors, { data: 'Hmmm! Parece que a verificação de senha não confere' });
    return json({ errors });
  }

  if (senha.length < 8) {
    errors = Object.assign(errors, { data: 'Sua senha deve ter no minimo 8 caracteres' });
    return json({ errors });
  }

  let perfilSeExistir = await perfilPorEmailCpf(email, cpf);

  if (email == perfilSeExistir?.email) {
    return json({
      errors: {
        data: 'Já existe uma conta associada a este e-mail, solicite recuperação de senha.',
      },
    });
  }

  if (verificarIdade(data_nascimento) < 18) {
    return json({
      errors: {
        data: 'Cadastro permitido apenas para maiores de 18 anos.',
      },
    });
  }

  if (perfilSeExistir?.cpf == cpf && perfilSeExistir?.usuarioId) {
    return json({
      errors: {
        data:
          perfilSeExistir?.usuario.email +
          ', é você? Caso sim, utilize o campo esqueci minha senha.',
      },
    });
  }

  let criarUsuario = await criarNovoUsuario(email, senha);

  if (perfilSeExistir)
    await atualizarUsuarioDoPerfil(Number(criarUsuario?.id), Number(perfilSeExistir.id));

  if (criarUsuario) {
    await authenticator.authenticate('form', request, {
      successRedirect: '/dashboard',
      failureRedirect: '/autentica/cadastro',
      context: { formData: form },
    });
  }

  // errors = Object.assign(errors, { data: 'Ops! Algo deu errado ao criar o usuário' });
  // return json({ errors });
};

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });

  const symbol = Object.getOwnPropertySymbols(request)[1];
  const parsed_url = request[symbol].parsedURL;

  if (parsed_url.pathname == '/cadastro') return redirect('/cadastro/basico')

  return null;
}

export default function Cadastro() {
  const [stepAtiva, setStepAtiva] = useState(1)
  const stepLineRef = useRef(null)
  const stepGroupsRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const submit = useSubmit()

  const [pageTitle, setPageTitle ] = useState("Cadastro de associado")

  const steps = {
    1: { titulo: "Informações básicas", id: "basico" },
    2: { titulo: "Documentos", id: "documentos" },
    3: { titulo: "Informaçoes de saúde", id: "saude" },
    4: { titulo: "Informações do responsável", id: "responsavel" },
    5: { titulo: "Termos e Tipo associado", id: "termos" },
  }

  useEffect(() => {
    activeStepOnLoad()
    toggleStepLine()
  }, [location])

  useEffect(() => {
    for (let node of stepLineRef.current.childNodes) {
      node.classList.remove("ativo", "feito")
      node.childNodes[0].innerHTML = node.id

      if (node.id == stepAtiva) node.classList.add("ativo");

      if (node.id < stepAtiva) {
        node.classList.add("feito")
        node.childNodes[0].innerHTML = '✔️'
      }
    }
  }, [stepAtiva])

  function toggleStepLine() {
    if (location.pathname.includes("concluido")) {
      setPageTitle("Cadastrado enviado")
      stepLineRef.current.style.display = "none"
    }
  }

  function activeStepOnLoad() {
    let step_id = Object.keys(steps).find(step_id => location.pathname.includes(steps[step_id].id))
    if (step_id == undefined) return
    setStepAtiva(step_id)
  }

  async function handleStepAtiva(stepId) {
    if (stepId < stepAtiva) return
    setStepAtiva(stepId);
    navigate(steps[stepId].id)
  }

  return (
    <main>
      <div className='header'>
        <h1>{pageTitle}</h1>
      </div>

      <div className='cadastro-associado'>
        <ul className='step-line' ref={stepLineRef}>
          {
            Object.keys(steps).map(step_id => {
              return (<li className='step-line-item' id={step_id} key={step_id} onClick={() => handleStepAtiva(step_id)}>
                <div className='step-id'>{step_id}</div>
                <div className='step-titulo'>{steps[step_id].titulo}</div>
              </li>)
            })
          }
        </ul>


        <div className='step-groups' ref={stepGroupsRef}>
          <Outlet />
        </div>
      </div>

      <div className='footer'>
        <p>Para acompanhar seu cadastro</p>
        <Link to='/autentica/entrar'>Faça login</Link>
      </div>
    </main>
  );
}
