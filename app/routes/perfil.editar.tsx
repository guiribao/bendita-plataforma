import { LoaderArgs, json, redirect } from '@remix-run/node';
import type { ActionFunction, LinksFunction, V2_MetaFunction } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import loading from '~/assets/img/loading.gif';
import perfilEditarPageStyle from '~/assets/css/perfil-editar-page.css';
import userImage from '~/assets/img/user.png';
import { Escolaridade, EstadoCivil, Grupo, Perfil as PrismaPerfil } from '@prisma/client';
import Perfil from '~/model/Perfil.server';
import Usuario from '~/model/Usuario.server';
import editarPerfil from '~/domain/Perfil/editar-perfil.server';
import pegarPerfilPeloIdUsuario from '~/domain/Perfil/perfil-pelo-id-usuario.server';
import { ChangeEvent, useState } from 'react';

export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Editar perfil - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Editar perfil de usuário da núvem do Chave',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: perfilEditarPageStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const perfilId: number = Number(form.get('perfilId') as string);

  const nome: string = form.get('nome') as string;
  const sobrenome: string = form.get('sobrenome') as string;
  const nome_completo: string = form.get('nome_completo') as string;

  const email: string = form.get('email') as string;

  const data_nascimento: string = form.get('data_nascimento') as string;
  const hora_nascimento: string = form.get('hora_nascimento') as string;
  const cidade_nascimento: string = form.get('cidade_nascimento') as string;
  const estado_nascimento: string = form.get('estado_nascimento') as string;

  const registro_geral: string = form.get('rg') as string;
  const cpf: string = form.get('cpf') as string;

  const telefone_fixo: string = form.get('telefone_fixo') as string;
  const celular: string = form.get('celular') as string;

  const endereco_completo: string = form.get('endereco_completo') as string;

  const estado_civil: string = form.get('estado_civil') as string;
  const nome_conjuge: string = form.get('nome_conjuge') as string;

  // TO-DO: Filhos -> nome, data_nascimento, escolaridade
  let filhos: string = form.get('filhos') as string;
  let arrayFilhos: string[] = filhos?.split(',');

  const escolaridade: string = form.get('escolaridade') as string;
  const grupo: Grupo = form.get('grupo') as Grupo;
  const data_fardamento: string = form.get('data_fardamento') as string;
  const local_fardamento: string = form.get('local_fardamento') as string;
  const profissao: string = form.get('profissao') as string;
  const bio: string = form.get('bio') as string;

  const nome_referencia: string = form.get('nome_referencia') as string;
  const telefone_referencia: string = form.get('telefone_referencia') as string;
  const email_referencia: string = form.get('email_referencia') as string;
  const endereco_referencia: string = form.get('endereco_referencia') as string;
  const parentesco_referencia: string = form.get('parentesco_referencia') as string;

  const usuarioId: number = Number(form.get('usuarioId') as string);
  const membro: boolean = (form.get('membro') as string) === 'true';

  let errors = {};

  if (
    [!nome, !sobrenome, !nome_completo, !data_nascimento, !estado_civil, !endereco_completo].some(
      Boolean
    )
  ) {
    errors = Object.assign(errors, { data: 'Preencha todos os campos obrigatórios' });
    return json({ errors });
  }

  await editarPerfil({
    id: Number(perfilId),
    nome,
    sobrenome,
    nome_completo,
    data_nascimento,
    hora_nascimento,
    cidade_nascimento,
    estado_nascimento,
    registro_geral,
    cpf,
    foto: 'http://localhost:3000/user.png',
    grupo,
    email,
    telefone_fixo,
    celular,
    endereco_completo,
    estado_civil,
    nome_conjuge,
    escolaridade,
    data_fardamento,
    local_fardamento,
    membro,
    profissao,
    bio,
    nome_referencia,
    telefone_referencia,
    email_referencia,
    endereco_referencia,
    parentesco_referencia,
    usuarioId: Number(usuarioId),
  });

  return redirect('/perfil');
};

export async function loader({ request }: LoaderArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let perfil: PrismaPerfil | null = await pegarPerfilPeloIdUsuario(usuario.id);

  return json({ usuario, perfil });
}

export default function PerfilEditar() {
  const actionData = useActionData();
  let { usuario, perfil } = useLoaderData();
  let [_email, _setEmail] = useState(perfil?.email || usuario?.email || '');
  let [estadoCivil, setEstadoCivil] = useState(perfil?.estado_civil);
  let [grupo, setGrupo] = useState(perfil?.grupo || Grupo.VISITANTE);
  let [escolaridade, setEscolaridade] = useState(
    perfil?.escolaridade || Escolaridade.FUNDAMENTAL_COMPLETO
  );

  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  function handleEmail(e: ChangeEvent<HTMLInputElement>) {
    _setEmail(e.target.value);
  }

  return (
    <main>
      <div className='header'>
        <img src={userImage} alt='Imagem do usuário' />
        <h1>Editar perfil</h1>
      </div>
      <Form method='post' className='form-perfil'>
        {actionData?.errors?.data && <p className='mensagem-erro'>{actionData?.errors?.data}</p>}
        <input
          type='hidden'
          value={usuario.id}
          name='usuarioId'
          id='usuarioId'
          autoComplete='off'
        />
        <input type='hidden' value={perfil?.id} name='perfilId' id='perfilId' autoComplete='off' />
        <div className='form-group'>
          <div className='form-group-header'>
            <h2>Informações básicas</h2>
          </div>
          <div className='form-field'>
            <label htmlFor='nome'>Primeiro nome *</label>
            <input
              type='text'
              name='nome'
              id='nome'
              defaultValue={perfil?.nome ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field'>
            <label htmlFor='sobrenome'>Último nome *</label>
            <input
              type='text'
              name='sobrenome'
              id='sobrenome'
              defaultValue={perfil?.sobrenome ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field form-field-full'>
            <label htmlFor='nome_completo'>Nome completo *</label>
            <input
              type='text'
              name='nome_completo'
              id='nome_completo'
              defaultValue={perfil?.nome_completo ?? ''}
              autoComplete='off'
            />
          </div>
          <div className='form-field'>
            <label htmlFor='data_nascimento'>Data de nascimento *</label>
            <input
              type='date'
              name='data_nascimento'
              id='data_nascimento'
              defaultValue={perfil?.data_nascimento.slice(0, 10) ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field'>
            <label htmlFor='hora_nascimento'>Hora de nascimento</label>
            <input
              type='time'
              name='hora_nascimento'
              id='hora_nascimento'
              defaultValue={
                new Date(perfil?.hora_nascimento).toLocaleTimeString().slice(0, 5) ?? ''
              }
              autoComplete='off'
            />
          </div>
          <div className='form-field'>
            <label htmlFor='cidade_nascimento'>Cidade de nascimento</label>
            <input
              type='text'
              name='cidade_nascimento'
              id='cidade_nascimento'
              defaultValue={perfil?.cidade_nascimento ?? ''}
              autoComplete='off'
            />
          </div>
          <div className='form-field'>
            <label htmlFor='estado_nascimento'>Estado de nascimento</label>
            <input
              type='text'
              name='estado_nascimento'
              id='estado_nascimento'
              defaultValue={perfil?.estado_nascimento ?? ''}
              autoComplete='off'
            />
          </div>

          <div className='form-field'>
            <label htmlFor='endereco_completo'>Endereço residencial *</label>
            <input
              type='text'
              name='endereco_completo'
              id='endereco_completo'
              defaultValue={perfil?.endereco ?? ''}
              autoComplete='off'
              required
            />
          </div>

          <div className='form-field'>
            <label htmlFor='estado_civil'>Estado civíl *</label>
            <select
              name='estado_civil'
              id='estado_civil'
              onChange={(e) => setEstadoCivil(e.target.value)}
              required
            >
              <option
                selected={perfil?.estado_civil == EstadoCivil.SOLTEIRO}
                value={EstadoCivil.SOLTEIRO}
              >
                Solteiro(a)
              </option>
              <option
                selected={perfil?.estado_civil == EstadoCivil.CONCUBINADO}
                value={EstadoCivil.CONCUBINADO}
              >
                Concubinado
              </option>
              <option
                selected={perfil?.estado_civil == EstadoCivil.CASADO}
                value={EstadoCivil.CASADO}
              >
                Casado(a)
              </option>
              <option
                selected={perfil?.estado_civil == EstadoCivil.VIUVO}
                value={EstadoCivil.VIUVO}
              >
                Viúvo(a)
              </option>
              <option
                selected={perfil?.estado_civil == EstadoCivil.DIVORCIADO}
                value={EstadoCivil.DIVORCIADO}
              >
                Divorciado(a)
              </option>
            </select>
          </div>

          {(estadoCivil == EstadoCivil.CASADO || estadoCivil == EstadoCivil.CONCUBINADO) && (
            <div className='form-field form-field-full'>
              <label htmlFor='nome_conjuge'>Nome conjuge</label>
              <input
                type='text'
                name='nome_conjuge'
                id='nome_conjuge'
                defaultValue={perfil?.nome_conjuge ?? ''}
                autoComplete='off'
              />
            </div>
          )}
        </div>

        <div className='form-group'>
          <div className='form-group-header'>
            <h2>Documentos</h2>
          </div>
          <div className='form-field'>
            <label htmlFor='rg'>RG *</label>
            <input
              type='number'
              name='rg'
              id='rg'
              defaultValue={perfil?.rg ?? ''}
              autoComplete='off'
              required
              readOnly={!!perfil.rg}
            />
          </div>

          <div className='form-field'>
            <label htmlFor='cpf'>CPF *</label>
            <input
              type='number'
              name='cpf'
              id='cpf'
              defaultValue={perfil?.cpf ?? ''}
              autoComplete='off'
              required
              readOnly={!!perfil.cpf}
            />
          </div>
        </div>

        <div className='form-group'>
          <div className='form-group-header'>
            <h2>Informações de contato</h2>
          </div>
          <div className='form-field'>
            <label htmlFor='email'>E-mail *</label>
            <input
              type='email'
              name='email'
              id='email'
              className='input-email'
              value={_email}
              onChange={handleEmail}
              autoComplete='off'
              readOnly
            />
          </div>
          <div className='form-field'>
            <label htmlFor='celular'>Celular *</label>
            <input
              type='text'
              name='celular'
              id='celular'
              defaultValue={perfil?.celular ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field'>
            <label htmlFor='telefone_fixo'>Telefone fixo</label>
            <input
              type='text'
              name='telefone_fixo'
              id='telefone_fixo'
              defaultValue={perfil?.telefone_fixo ?? ''}
              autoComplete='off'
            />
          </div>

          <div className='form-group-header'>
            <h2>Contato de referencia</h2>
          </div>

          <div className='form-field'>
            <label htmlFor='nome_referencia'>Nome da referencia *</label>
            <input
              type='text'
              name='nome_referencia'
              id='nome_referencia'
              defaultValue={perfil?.nome_referencia ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field'>
            <label htmlFor='email_referencia'>E-mail da referencia *</label>
            <input
              type='text'
              name='email_referencia'
              id='email_referencia'
              defaultValue={perfil?.email_referencia ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field'>
            <label htmlFor='telefone_referencia'>Celular da referencia *</label>
            <input
              type='text'
              name='telefone_referencia'
              id='telefone_referencia'
              defaultValue={perfil?.telefone_referencia ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field'>
            <label htmlFor='endereco_referencia'>Endereço da referencia *</label>
            <input
              type='text'
              name='endereco_referencia'
              id='endereco_referencia'
              defaultValue={perfil?.endereco_referencia ?? ''}
              autoComplete='off'
              required
            />
          </div>
          <div className='form-field'>
            <label htmlFor='parentesco_referencia'>Parentesco *</label>
            <input
              type='text'
              name='parentesco_referencia'
              id='parentesco_referencia'
              defaultValue={perfil?.parentesco_referencia ?? ''}
              autoComplete='off'
              required
            />
          </div>
        </div>

        <div className='form-group'>
          <div className='form-group-header'>
            <h2>Social</h2>
          </div>
          <div className='form-field profissao'>
            <label htmlFor='profissao'>Profissão / Atividade</label>
            <input
              type='text'
              name='profissao'
              id='profissao'
              defaultValue={perfil?.profissao ?? ''}
              autoComplete='off'
            />
          </div>

          <div className='form-field'>
            <label htmlFor='escolaridade'>Escolaridade</label>
            <select
              name='escolaridade'
              id='escolaridade'
              onChange={(e) => setEscolaridade(e.target.value)}
            >
              <option
                selected={perfil?.escolaridade == Escolaridade.NAO_APLICA}
                value={Escolaridade.NAO_APLICA}
              >
                Prefiro não informar
              </option>
              <option
                selected={perfil?.escolaridade == Escolaridade.FUNDAMENTAL_COMPLETO}
                value={Escolaridade.FUNDAMENTAL_COMPLETO}
              >
                Fundamental completo{' '}
              </option>
              <option
                selected={perfil?.escolaridade == Escolaridade.FUNDAMENTAL_INCOMPLETO}
                value={Escolaridade.FUNDAMENTAL_INCOMPLETO}
              >
                Fundamental incompleto{' '}
              </option>

              <option
                selected={perfil?.escolaridade == Escolaridade.MEDIO_COMPLETO}
                value={Escolaridade.MEDIO_COMPLETO}
              >
                Médio completo{' '}
              </option>
              <option
                selected={perfil?.escolaridade == Escolaridade.MEDIO_INCOMPLETO}
                value={Escolaridade.MEDIO_INCOMPLETO}
              >
                Médio incompleto{' '}
              </option>

              <option
                selected={perfil?.escolaridade == Escolaridade.SUPERIOR_COMPLETO}
                value={Escolaridade.SUPERIOR_COMPLETO}
              >
                Superior completo{' '}
              </option>
              <option
                selected={perfil?.escolaridade == Escolaridade.SUPERIOR_INCOMPLETO}
                value={Escolaridade.SUPERIOR_INCOMPLETO}
              >
                Superior incompleto{' '}
              </option>
            </select>
          </div>

          <div className='form-field'>
            <label htmlFor='grupo'>Grupo *</label>
            <select name='grupo' id='grupo' onChange={(e) => setGrupo(e.target.value)}>
              <option selected={perfil?.grupo == Grupo.VISITANTE} value={Grupo.VISITANTE}>
                Visitante{' '}
              </option>
              <option selected={perfil?.grupo == Grupo.FARDADO} value={Grupo.FARDADO}>
                Fardado{' '}
              </option>
            </select>
          </div>

          {grupo === Grupo.FARDADO && (
            <div className='form-field-full'>
              <div className='form-field'>
                <label htmlFor='data_fardamento'>Data de fardamento</label>
                <input
                  type='date'
                  name='data_fardamento'
                  id='data_fardamento'
                  defaultValue={perfil?.data_fardamento ? perfil?.data_fardamento.slice(0, 10) : ''}
                  autoComplete='off'
                />
              </div>

              <div className='form-field profissao'>
                <label htmlFor='profissao'>Local de fardamento</label>
                <input
                  type='text'
                  name='local_fardamento'
                  id='local_fardamento'
                  defaultValue={perfil?.local_fardamento ?? ''}
                  autoComplete='off'
                />
              </div>
            </div>
          )}

          <div className='form-field-membro'>
            <h3>Você é membro?</h3>
            <div>
              <div className='form-field-membro-response'>
                <input
                  type='radio'
                  name='membro'
                  id='membro_sim'
                  value='true'
                  defaultChecked={perfil?.membro == true}
                />
                <label htmlFor='membro_sim'>Sim</label>
              </div>

              <div className='form-field-membro-response'>
                <input
                  type='radio'
                  name='membro'
                  id='membro_nao'
                  value='false'
                  defaultChecked={perfil?.membro == false}
                />
                <label htmlFor='membro_nao'>Não?</label>
              </div>
            </div>
          </div>
        </div>
        <div className='form-group'>
          <div className='form-group-header'>
            <h2>Bio</h2>
          </div>
          <div className='form-field-bio'>
            <label htmlFor='bio'>Escreva um pouco sobre você</label>
            <textarea name='bio' id='bio' defaultValue={perfil?.bio ?? ''}></textarea>
          </div>
        </div>
        <div className='form-group'>
          <div className='form-field form-button'>
            <button type='submit' className='btn-salvar' disabled={isSubmitting}>
              {!isSubmitting && 'Salvar'}
              {isSubmitting && <img src={loading} alt='Carregando' />}
            </button>
          </div>
        </div>
      </Form>
      <div className='footer'></div>
    </main>
  );
}
