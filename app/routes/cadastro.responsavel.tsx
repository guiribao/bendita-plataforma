import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  unstable_parseMultipartFormData,
} from '@remix-run/node';
import { Form, Link, useActionData, useNavigate, useNavigation } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import InputMask from 'react-input-mask';

import { authenticator } from '~/secure/authentication.server';

import cadastroStyle from '~/assets/css/cadastro.css';
import loading from '~/assets/img/loading.gif'
import { s3UploaderHandler } from '~/storage/s3.service.server';
import criarNovoUsuario from '~/domain/Usuario/criar-novo-usuario.server';
import { Papel, TipoDocumento } from '@prisma/client';
import pegarAssociadoPorId from '~/domain/Associado/pegar-por-id.server';
import { createRandom } from '~/shared/Text.util';
import criarPerfil from '~/domain/Perfil/criar-perfil.server';
import criarDocumento from '~/domain/Documentos/criar-documento.server';
import { brStringToIsoString } from '~/shared/DateTime.util';

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
  const form = await unstable_parseMultipartFormData(request, s3UploaderHandler);

  const id_responsavel_1 = form.get('identificacao_responsavel_1');
  const id_responsavel_2 = form.get('identificacao_responsavel_2');

  const perfilId = form.get('perfilId');
  const associadoId = form.get('associadoId');

  const associado = await pegarAssociadoPorId(associadoId)

  if (perfilId != associado?.perfilId) throw new Error("Algo de errado não está certo.");

  const temResponsavel = (form.get('tem_responsavel') === "true");

  if (temResponsavel) {
    const nomeCompleto = form.get('nome_responsavel')
    const cpf = form.get('cpf_responsavel')
    const rg = form.get('rg_responsavel')
    const sexo = form.get('sexo_responsavel')
    const dataNascimento = brStringToIsoString(form.get('data_nascimento'))
    const telefone = form.get('telefone_responsavel')
    const endereco = form.get('endereco_responsavel')

    const emailResponsavel = form.get('email_responsavel')
    const senha = createRandom()
    let papel: Papel = Papel.ASSOCIADO

    const usuario = await criarNovoUsuario(emailResponsavel, senha, papel)

    const perfil = await criarPerfil({
      nomeCompleto,
      dataNascimento,
      cpf,
      rg,
      sexo,
      telefone,
      endereco,
      usuarioId: usuario?.id
    })

    if (id_responsavel_1) {
      let documentoObj = {
        tipo: TipoDocumento.IDENTIFICACAO_RESPONSAVEL,
        nome_arquivo: id_responsavel_1,
        associadoId: associadoId,
        criadoPorId: perfilId
      }
      await criarDocumento(documentoObj)
    }

    if (id_responsavel_2) {
      let documentoObj = {
        tipo: TipoDocumento.IDENTIFICACAO_RESPONSAVEL,
        nome_arquivo: id_responsavel_2,
        associadoId: associadoId,
        criadoPorId: perfilId
      }
      await criarDocumento(documentoObj)
    }
  }

  return { uploaded: true }
};

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
}

export default function CadastroResponsavel() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [perfilId, setPerfilId] = useState("")
  const [associadoId, setAssociadoId] = useState("")

  const [temResponsavel, setTemResponsavel] = useState(false)

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  useEffect(() => {
    let storage = localStorage.getItem('basico');
    if (!storage) return navigate('/cadastro/basico')

    let basico = JSON.parse(storage);

    setTemResponsavel(basico.necessarioResponsavel)
    setPerfilId(basico.perfilId)
    setAssociadoId(basico.associadoId)

  }, [])

  useEffect(() => {
    if (actionData?.uploaded) navigate('/cadastro/termos')
  }, [actionData])

  return <Form method='post' className='step-group' name="responsavel" encType='multipart/form-data'>
    <div className='form-group'>
      <div className="instruct">
        <h2>Cadastrar um responsável?</h2>
        <p>Aplicável para o caso de pacientes menores de idade e com doenças neurodegenerativas.</p>
      </div>
      <div className="medicacao">
        <div className='form-field-response'>
          <input
            type='radio'
            name='tem_responsavel'
            id="tem_responsavel_nao"
            value={'false'}
            onChange={() => setTemResponsavel(false)}
            disabled={temResponsavel}
            required
          />
          <label htmlFor='tem_responsavel_nao'>Não</label>
        </div>
        <div className='form-field-response'>
          <input
            type='radio'
            name='tem_responsavel'
            id="tem_responsavel_sim"
            value={'true'}
            onChange={() => setTemResponsavel(true)}
            defaultChecked={temResponsavel}
          />
          <label htmlFor='tem_responsavel_sim'>Sim</label>
        </div>
      </div>

      {temResponsavel && <div className='informacao-responsavel'>
        <div className='form-group'>
          <label htmlFor='nome_responsavel'>Noma do responsável *</label>
          <input name='nome_responsavel' id='nome_responsavel' required />
        </div>

        <div className='form-group inline-group'>
          <div>
            <label htmlFor='data_nascimento'>Data de nascimento *</label>
            <InputMask
              type='text'
              name='data_nascimento'
              id='data_nascimento'
              autoComplete='off'
              mask='99/99/9999'
              maskChar={' '}
              required
            />
          </div>
          <div>
            <label htmlFor='sexo_responsavel'>Sexo *</label>
            <select name="sexo_responsavel" id="sexo_responsavel" required>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Não binário">Não binário</option>
            </select>
          </div>
        </div>

        <div className="form-group inline-group">
          <div>
            <label htmlFor='cpf_responsavel'>CPF *</label>
            <InputMask
              type='text'
              name='cpf_responsavel'
              id='cpf_responsavel'
              autoComplete='off'
              mask='999.999.999-99'
              maskChar={' '}
              required
            />
          </div>
          <div>
            <label htmlFor='rg_responsavel'>RG</label>
            <input type="text" name='rg_responsavel' id='rg_responsavel' />
          </div>
        </div>

        <div className='form-group anexo'>
          <div className="instruct">
            <h2><b style={{ fontWeight: '800' }}>Anexo:</b> RG do responsável *</h2>
            <p>Anexe o documento em uma foto única, ou em dois arquivos separados.</p>
            <span>Formatos aceito: JPG, PNG, PDF</span>
          </div>
          <label htmlFor='identificacao_responsavel_1'>Imagem frente / Imagem única *</label>
          <input
            type='file'
            name='identificacao_responsavel_1'
            id='identificacao_responsavel_1'
            defaultValue={''}
            required
          />
          <label htmlFor='identificacao_responsavel_2'>Imagem verso</label>
          <input
            type='file'
            name='identificacao_responsavel_2'
            id='identificacao_responsavel_2'
            defaultValue={''}
          />
        </div>



        <div className='form-group inline-group contato-responsavel'>
          <div>
            <label htmlFor='email_responsavel'>E-mail do responsável </label>
            <input type="email" name="email_responsavel" id="email_responsavel" required />
            <span>O responsável deve ter acesso a este e-mail.</span>
          </div>
          <div>
            <label htmlFor='telefone_responsavel'>Telefone / Whatsapp *</label>
            <InputMask
              type='text'
              name='telefone_responsavel'
              id='telefone_responsavel'
              autoComplete='off'
              mask='\+55 \(99\) 9 9999-9999'
              maskChar={' '}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor='endereco_responsavel'>Endereço do responsável *</label>
          <input
            type='text'
            name='endereco_responsavel'
            id='endereco_responsavel'
            defaultValue={''}
            required
          />
        </div>
      </div>}
    </div>
    <div className="submit-button">
      <input type="hidden" name="perfilId" value={perfilId} />
      <input type="hidden" name="associadoId" value={associadoId} />

      {isSubmitting
        ? <img src={loading} alt='Salvando dados' className='loading' />
        : <button type='submit'>Avançar</button>}
    </div>
  </Form>
}
