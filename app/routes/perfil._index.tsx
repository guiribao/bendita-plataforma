//@ts-ignore
import { LoaderArgs, json, redirect } from '@remix-run/node';
import type { LinksFunction, V2_MetaFunction } from '@remix-run/node';
import { Link, useLoaderData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import perfilPageStyle from '~/assets/css/perfil-page.css';
import userImage from '~/assets/img/user.png';
import pegarPerfilPeloIdUsuario from '~/domain/Perfil/perfil-pelo-id-usuario.server';
import { Escolaridade, Perfil } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseTime } from '~/shared/Date.util';

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
    let perfil: Perfil | null = await pegarPerfilPeloIdUsuario(usuario.id);

    if (!perfil || perfil.id == null) {
      return redirect('/perfil/editar');
    }

    return json({ perfil });
  }
  return json({});
}

export default function PerfilIndex() {
  let { usuario, perfil } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const ESCOLARIDADE_ENUM = {
    FUNDAMENTAL_INCOMPLETO: 'Fundamental incompleto',
    FUNDAMENTAL_COMPLETO: 'Fundamental completo',
    MEDIO_INCOMPLETO: 'Médio incompleto',
    MEDIO_COMPLETO: 'Médio completo',
    SUPERIOR_INCOMPLETO: 'Superior incompleto',
    SUPERIOR_COMPLETO: 'Superior completo',
  };

  return (
    <main>
      <div className='header'>
        <img src={userImage} alt='Imagem do usuário' />
        <h1>
          {perfil?.nome} {perfil?.sobrenome}
        </h1>

        <Link to='/perfil/editar'>Editar perfil</Link>
      </div>
      <div className='meu-perfil cards'>
        <div className='group view basicas'>
          <div className='group-header'>
            <h1>Informações básicas</h1>
          </div>

          <div className='field-group'>
            <div className='field'>
              <label htmlFor='data_nascimento'>Data de nascimento</label>
              <p id='data_nascimento'>
                {format(perfil?.data_hora_nascimento, "d 'de' LLLL 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>

            {perfil?.data_hora_nascimento && (
              <div className='field'>
                <label htmlFor='hora_nascimento'>Hora de nascimento</label>
                <p id='hora_nascimento'>
                  {format(perfil?.data_hora_nascimento, 'HH:mm', {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
          </div>

          <div className='field-group'>
            {perfil?.cidade_nascimento && (
              <div className='field'>
                <label htmlFor='cidade_nascimento'>Cidade de nascimento</label>
                <p id='cidade_nascimento'>{perfil?.cidade_nascimento}</p>
              </div>
            )}

            {perfil?.estado_nascimento && (
              <div className='field'>
                <label htmlFor='estado_nascimento'>Estado de nascimento</label>
                <p id='estado_nascimento'>{perfil?.estado_nascimento}</p>
              </div>
            )}
          </div>

          <div className='field-group'>
            {perfil?.estado_civil && (
              <div className='field'>
                <label htmlFor='estado_civil'>Estado civíl</label>
                <p id='estado_civil'>{perfil?.estado_civil}</p>
              </div>
            )}

            {perfil?.nome_conjuge && (
              <div className='field'>
                <label htmlFor='nome_conjuge'>Nome conjuge</label>
                <p id='nome_conjuge'>{perfil?.nome_conjuge}</p>
              </div>
            )}
          </div>
        </div>
        <div className='group view contato'>
          <div className='group-header'>
            <h1>Contato </h1>
          </div>
          <div className='field'>
            <label htmlFor='email'>E-mail</label>
            <p id='email'>{perfil?.email}</p>
          </div>
          <div className='field'>
            <label htmlFor='celular'>Celular</label>
            <p id='celular'>{perfil?.celular}</p>
          </div>

          {perfil?.telefone_fixo && (
            <div className='field'>
              <label htmlFor='telefone_fixo'>Telefone fixo</label>
              <p id='telefone_fixo'>{perfil?.telefone_fixo}</p>
            </div>
          )}
        </div>
        <div className='group view endereco'>
          <div className='group-header'>
            <h1>Endereço</h1>
          </div>

          {!perfil?.cep &&
            !perfil?.endereco &&
            !perfil?.numero &&
            !perfil?.bairro &&
            !perfil?.cidade &&
            !perfil?.estado && (
              <div className='field'>
                <p>Nenhum dado de endereço cadastrado</p>
              </div>
            )}

          {perfil?.cep && (
            <div className='field'>
              <label htmlFor='cep'>CEP</label>
              <p id='cep'>{perfil?.cep}</p>
            </div>
          )}

          {perfil?.endereco && !perfil?.numero && (
            <div className='field'>
              <label htmlFor='endereco'>Endereço</label>
              <p id='endereco'>{perfil?.endereco}</p>
            </div>
          )}

          {perfil?.cep &&
            perfil?.endereco &&
            perfil?.numero &&
            perfil?.bairro &&
            perfil?.cidade &&
            perfil?.estado && (
              <div className='field'>
                <label htmlFor='endereco'>Endereço completo</label>
                <p id='endereco'>
                  {perfil?.endereco + (perfil?.numero ? ', ' + perfil?.numero : '')}
                  {', ' + perfil?.bairro}
                  {', ' + perfil?.cidade}
                  {', ' + perfil?.estado}
                </p>
              </div>
            )}
        </div>
        <div className='group view bio'>
          <div className='group-header'>
            <h1>Bio</h1>
          </div>
          <div className='field-bio'>
            <p id='bio'>{perfil?.bio}</p>
          </div>
        </div>
      </div>
      <div className='meu-perfil cards'>
        <div className='group view documentos'>
          <div className='group-header'>
            <h1>Documentos</h1>
          </div>
          <div className='field'>
            <label htmlFor='rg'>RG</label>
            <p id='rg'>{perfil?.rg}</p>
          </div>
          <div className='field'>
            <label htmlFor='cpf'>CPF</label>
            <p id='cpf'>{perfil?.cpf}</p>
          </div>
        </div>
        <div className='group view referencia'>
          <div className='group-header'>
            <h1>Contato referencia</h1>
          </div>

          {perfil?.nome_referencia && (
            <div className='field'>
              <label htmlFor='nome_referencia'>Nome</label>
              <p id='nome_referencia'>{perfil?.nome_referencia}</p>
            </div>
          )}

          {perfil?.email_referencia && (
            <div className='field'>
              <label htmlFor='email_referencia'>E-mail</label>
              <p id='email_referencia'>{perfil?.email_referencia}</p>
            </div>
          )}

          {perfil?.telefone_referencia && (
            <div className='field'>
              <label htmlFor='telefone_referencia'>Celular</label>
              <p id='telefone_referencia'>{perfil?.telefone_referencia}</p>
            </div>
          )}

          {perfil?.endereco_referencia && (
            <div className='field'>
              <label htmlFor='endereco_referencia'>Endereço</label>
              <p id='endereco_referencia'>{perfil?.endereco_referencia}</p>
            </div>
          )}

          {perfil?.parentesco_referencia && (
            <div className='field'>
              <label htmlFor='parentesco_referencia'>Parentesco</label>
              <p id='parentesco_referencia'>{perfil?.parentesco_referencia}</p>
            </div>
          )}
        </div>
        <div className='group view social'>
          <div className='group-header'>
            <h1>Social</h1>
          </div>
          <div className='field profissao'>
            <label htmlFor='profissao'>Profissão</label>
            <p id='profissao'>{perfil?.profissao}</p>
          </div>

          {perfil.escolaridade !== Escolaridade.NAO_APLICA && (
            <div className='field'>
              <label htmlFor='escolaridade'>Escolaridade</label>
              <p id='escolaridade'>{ESCOLARIDADE_ENUM[perfil?.escolaridade]}</p>
            </div>
          )}

          <div className='field'>
            <label htmlFor='grupo'>Grupo</label>
            <p id='grupo'>{perfil?.grupo}</p>
          </div>

          {perfil?.data_fardamento && (
            <div className='field'>
              <label htmlFor='data_fardamento'>Data de fardamento</label>
              <p id='data_fardamento'>
                {format(
                  perfil?.data_fardamento.replaceAll('-', '/').slice(0, 10),
                  "d 'de' LLLL 'de' yyyy",
                  {
                    locale: ptBR,
                  }
                )}
              </p>
            </div>
          )}

          {perfil?.local_fardamento && (
            <div className='field'>
              <label htmlFor='local_fardamento'>Local de fardamento</label>
              <p id='local_fardamento'>{perfil?.local_fardamento}</p>
            </div>
          )}

          <div className='field'>
            <label htmlFor='membro'>Membro</label>
            <p id='membro'>{perfil?.membro ? 'Sim' : 'Não'}</p>
          </div>
        </div>
      </div>

      <div className='footer'></div>
    </main>
  );
}
