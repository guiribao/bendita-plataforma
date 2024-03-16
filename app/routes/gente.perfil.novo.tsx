import { LoaderArgs, json } from '@remix-run/node';
import type { LinksFunction, V2_MetaFunction } from '@remix-run/node';
import { Form, useLoaderData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import novoPerfilPageStyle from '~/assets/css/novo-perfil-page.css';
import userImage from '~/assets/img/user.png';
import loading from '~/assets/img/loading.gif';

export const meta: V2_MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Gente - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content:
        'Gerenciamento de cadastro de pessoas da núvem do Chave',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: novoPerfilPageStyle }];
};

export async function loader({ request }: LoaderArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return json({ usuario });
}

export default function GenteIndex() {
  let { usuario, perfil } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  return (
    <main>
      <div className='header'>
        <h1>Novo perfil</h1>
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
              autoComplete='off'
            />
          </div>
          <div className='form-field'>
            <label htmlFor='sobrenome'>Sobrenome *</label>
            <input
              type='text'
              name='sobrenome'
              id='sobrenome'
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
              autoComplete='off'
            />
          </div>
          <div className='form-field'>
            <label htmlFor='celular'>Celular *</label>
            <input
              type='text'
              name='celular'
              id='celular'
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
                />
              </div>
              <div className='form-field-membro-response'>
                <label htmlFor='membro_nao'>Não?</label>
                <input
                  type='radio'
                  name='membro'
                  id='membro_nao'
                  value='false'
                  defaultChecked={true}
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
    </main>)
}
