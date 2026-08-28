import type {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction} from '@remix-run/node';
import {
  json,
  redirect,
} from '@remix-run/node';
import { Link, Outlet, useActionData, useLocation, useNavigate, useSubmit } from '@remix-run/react';

import { authenticator } from '~/secure/authentication.server';



import criarNovoUsuario from '~/domain/Usuario/criar-novo-usuario.server';
import perfilPorEmailCpf from '~/domain/Perfil/perfil-por-cpf.server';
import atualizarUsuarioDoPerfil from '~/domain/Perfil/atualizar-usuario-do-perfil.server';

import cadastroStyle from '~/assets/css/cadastro.css';


import { verificarIdade } from '~/shared/DateTime.util';
import { useEffect, useRef, useState } from 'react';
import { Papel } from '@prisma/client';

export const meta: MetaFunction = () => {
  return [
    { title: 'Cadastro  - Associação Bendita Canábica' },
    { name: 'description', content: 'Solicitação de análise associativa da Associação Bendita Canábica' },
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

  let perfilSeExistir = await perfilPorEmailCpf(cpf);

  if (email == perfilSeExistir?.usuario?.email) {
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

  let criarUsuario = await criarNovoUsuario(email, senha, Papel.ASSOCIADO);

  if (perfilSeExistir)
    await atualizarUsuarioDoPerfil(Number(criarUsuario?.id), perfilSeExistir.id);

  if (criarUsuario) {
    await authenticator.authenticate('form', request, {
      successRedirect: '/app/dashboard',
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
    successRedirect: '/app/dashboard',
  });

  const url = new URL(request.url);

  if (url.pathname === '/cadastro') return redirect('/cadastro/basico')

  return null;
}

export default function Cadastro() {
  const [stepAtiva, setStepAtiva] = useState(1)
  const stepLineRef = useRef<HTMLUListElement>(null)
  const stepGroupsRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const submit = useSubmit()

  const [pageTitle, setPageTitle ] = useState("Cadastro de associado")

  const steps: Record<number, { titulo: string; id: string }> = {
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
    if (!stepLineRef.current) return;
    for (let node of stepLineRef.current.childNodes) {
      const element = node as HTMLElement;
      element.classList.remove("ativo", "feito")
      element.childNodes[0].textContent = element.id

      if (element.id == String(stepAtiva)) element.classList.add("ativo");

      if (Number(element.id) < stepAtiva) {
        element.classList.add("feito")
        element.childNodes[0].textContent = '✔️'
      }
    }
  }, [stepAtiva])

  function toggleStepLine() {
    if (location.pathname.includes("concluido")) {
      setPageTitle("Cadastrado enviado")
      if (stepLineRef.current) stepLineRef.current.style.display = "none"
    } else {
      setPageTitle("Cadastro de associado")
      if (stepLineRef.current) stepLineRef.current.style.display = "flex"
    }
  }

  function activeStepOnLoad() {
    let step_id = Object.keys(steps).find(step_id => location.pathname.includes(steps[Number(step_id)].id))
    if (step_id == undefined) return
    setStepAtiva(Number(step_id))
  }

  async function handleStepAtiva(stepId: number) {
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
              const stepNumber = Number(step_id);
              return (<li className='step-line-item' id={step_id} key={step_id} onClick={() => handleStepAtiva(stepNumber)}>
                <div className='step-id'>{step_id}</div>
                <div className='step-titulo'>{steps[stepNumber].titulo}</div>
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
