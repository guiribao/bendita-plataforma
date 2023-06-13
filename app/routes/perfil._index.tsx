//@ts-ignore
import { LoaderArgs, json, redirect } from '@remix-run/node';
import type { LinksFunction, V2_MetaFunction } from '@remix-run/node';
import { Link, useLoaderData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/auth.server';
import perfilPageStyle from '~/assets/css/perfil-page.css';
import userImage from '~/assets/img/user.png';
import { Perfil as PrismaPerfil } from '@prisma/client';
import Perfil from '~/model/Perfil.server';
import pegarPerfilPeloIdUsuario from '~/domain/Perfil/perfil-pelo-id-usuario.server';

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
  return [{ rel: 'stylesheet', href: perfilPageStyle }];
};

export async function loader({ request }: LoaderArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  if (usuario?.id) {
    let p: PrismaPerfil | null = await pegarPerfilPeloIdUsuario(usuario.id);

    if (!p || p.id == null){
      console.log(p)
      return redirect('/perfil/editar');
    } 

    //@ts-ignore
    let perfil = new Perfil(
      p.nome,
      p.sobrenome,
      p.foto,
      p.grupo,
      p.email,
      p.celular,
      p.membro,
      p.profissao,
      p.bio,
      p.usuarioId,
      p?.id,
      p?.criado_em,
      p?.atualizado_em
    );
    return json({ perfil });
  }
  return json({ });
}

export default function DashboardIndex() {
  let { usuario, perfil } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <main>
      <div className='header'>
        <img src={userImage} alt='Imagem do usuário' />
        <h1>Meu perfil</h1>
        <Link to='/perfil/editar'>Editar perfil</Link>
      </div>
      <div className='meu-perfil'>
        <div className='group'>
          <div className='group-header'>
            <h2>Informações básicas</h2>
          </div>
          <div className='field'>
            <label htmlFor='nome'>Nome</label>
            <p>{perfil?.nome}</p>
          </div>
          <div className='field'>
            <label htmlFor='sobrenome'>Sobrenome</label>
            <p id='sobrenome'>{perfil?.sobrenome}</p>
          </div>
        </div>
        <div className='group'>
          <div className='group-header'>
            <h2>Informações de contato</h2>
          </div>
          <div className='field'>
            <label htmlFor='email'>E-mail</label>
            <p id='email'>{perfil?.email}</p>
          </div>
          <div className='field'>
            <label htmlFor='celular'>Celular</label>
            <p id='celular'>{perfil?.celular}</p>
          </div>
        </div>

        <div className='group'>
          <div className='group-header'>
            <h2>Social</h2>
          </div>
          <div className='field profissao'>
            <label htmlFor='profissao'>Profissão</label>
            <p id='profissao'>{perfil?.profissao}</p>
          </div>
          <div className='field'>
            <label htmlFor='membro'>Membro</label>
            <p id='membro'>{perfil?.membro ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        <div className='group'>
          <div className='group-header'>
            <h2>Bio</h2>
          </div>
          <div className='field-bio'>
            <p id='bio'>{perfil?.bio}</p>
          </div>
        </div>
      </div>
      <div className='footer'></div>
    </main>
  );
}
