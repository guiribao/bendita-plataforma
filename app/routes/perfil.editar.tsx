import { LoaderArgs, json, redirect } from '@remix-run/node';
import type { ActionFunction, LinksFunction, V2_MetaFunction } from '@remix-run/node';
import { Form, useLoaderData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import loading from '~/assets/img/loading.gif';
import perfilEditarPageStyle from '~/assets/css/perfil-editar-page.css';
import userImage from '~/assets/img/user.png';
import { Perfil as PrismaPerfil } from '@prisma/client';
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
  const email: string = form.get('email') as string;
  const celular: string = form.get('celular') as string;
  const profissao: string = form.get('profissao') as string;
  const bio: string = form.get('bio') as string;
  const usuarioId: number = Number(form.get('usuarioId') as string);
  const membro: boolean = (form.get('membro') as string) === 'true';

  let perfil = new Perfil(
    nome,
    sobrenome,
    'http://localhost:3000/user.png',
    'FARDADO',
    email,
    celular,
    membro,
    profissao,
    bio,
    Number(usuarioId),
    Number(perfilId),
    undefined,
    undefined
  );

  await editarPerfil(perfil);

  return redirect('/perfil')
};

export async function loader({ request }: LoaderArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  let perfil: PrismaPerfil | null = await pegarPerfilPeloIdUsuario(usuario.id);

  return json({ usuario, perfil });
}

export default function PerfilEditar() {
  let { usuario, perfil } = useLoaderData();
  let [_email, _setEmail] = useState(perfil?.email||usuario?.email||"")
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  function handleEmail(e: ChangeEvent<HTMLInputElement>) {
    _setEmail(e.target.value)
  }

  return (
    <main>
      <div className='header'>
        <img src={userImage} alt='Imagem do usuário' />
        <h1>Editar perfil</h1>
      </div>
      <Form method='post' className='form-perfil'>
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
            <label htmlFor='nome'>Nome *</label>
            <input
              type='text'
              name='nome'
              id='nome'
              defaultValue={perfil?.nome ?? ''}
              autoComplete='off'
            />
          </div>
          <div className='form-field'>
            <label htmlFor='sobrenome'>Sobrenome *</label>
            <input
              type='text'
              name='sobrenome'
              id='sobrenome'
              defaultValue={perfil?.sobrenome ?? ''}
              autoComplete='off'
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
            />
          </div>
        </div>

        <div className='form-group'>
          <div className='form-group-header'>
            <h2>Social</h2>
          </div>
          <div className='form-field profissao'>
            <label htmlFor='profissao'>Profissão</label>
            <input
              type='text'
              name='profissao'
              id='profissao'
              defaultValue={perfil?.profissao ?? ''}
              autoComplete='off'
            />
          </div>
          <div className='form-field-membro'>
            <h3>És membro?</h3>
            <div>
              <div className='form-field-membro-response'>
                <label htmlFor='membro_sim'>Sim</label>
                <input
                  type='radio'
                  name='membro'
                  id='membro_sim'
                  value='true'
                  defaultChecked={perfil?.membro == true}
                />
              </div>
              <div className='form-field-membro-response'>
                <label htmlFor='membro_nao'>Não?</label>
                <input
                  type='radio'
                  name='membro'
                  id='membro_nao'
                  value='false'
                  defaultChecked={perfil?.membro == false}
                />
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
