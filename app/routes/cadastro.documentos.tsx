import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  unstable_parseMultipartFormData
} from '@remix-run/node';
import { Form, useActionData, useNavigate, useNavigation } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';

import { authenticator } from '~/secure/authentication.server';

import cadastroStyle from '~/assets/css/cadastro.css';

import loading from '~/assets/img/loading.gif';
import identificationImg from '~/assets/img/undraw/docs_inspection.svg';
import residencyImg from '~/assets/img/undraw/home_sweet_home.svg';
import { s3UploaderHandler } from '~/storage/s3.service.server';
import { TipoDocumento } from '@prisma/client';
import criarDocumento from '~/domain/Documentos/criar-documento.server';
import pegarAssociadoPorId from '~/domain/Associado/pegar-por-id.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Enviar documentos - Associação Bendita Canábica' },
    { name: 'description', content: 'Solicitação de análise associativa da Associação Bendita Canábica' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await unstable_parseMultipartFormData(request, s3UploaderHandler);

  const identificacao_1 = form.get('identificacao_1');
  const identificacao_2 = form.get('identificacao_2');
  const comprovante_residencia = form.get('comprovante_residencia');

  const perfilId = form.get('perfilId');
  const associadoId = form.get('associadoId');

  const associado = await pegarAssociadoPorId(associadoId)

  if (perfilId != associado?.perfilId) throw new Error("Algo de errado não está certo.");

  if (identificacao_1) {
    let documentoObj = {
      tipo: TipoDocumento.IDENTIFICACAO,
      nome_arquivo: identificacao_1,
      associadoId: associadoId,
      criadoPorId: perfilId
    }
    await criarDocumento(documentoObj)
  }

  if (identificacao_2) {
    let documentoObj = {
      tipo: TipoDocumento.IDENTIFICACAO,
      nome_arquivo: identificacao_2,
      associadoId: associadoId,
      criadoPorId: perfilId
    }
    await criarDocumento(documentoObj)
  }

  if (comprovante_residencia) {
    let documentoObj = {
      tipo: TipoDocumento.COMPROVANTE_RESIDENCIA,
      nome_arquivo: comprovante_residencia,
      associadoId: associadoId,
      criadoPorId: perfilId
    }
    await criarDocumento(documentoObj)
  }

  return { uploaded: true }
};

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/app/dashboard',
  });
}

export default function CadastroAnexos() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate()
  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  const [perfilId, setPerfilId] = useState("")
  const [associadoId, setAssociadoId] = useState("")

  useEffect(() => {
    let storage = localStorage.getItem('basico');
    if (!storage) return navigate('/cadastro/basico')

    let basico = JSON.parse(storage);
    //let basico = JSON.parse("{\"perfilId\": \"ca822a17-847c-4cc7-90b6-1481994a1dfe\", \"associadoId\": \"ff2217fc-d1ad-4722-a21a-6914aaeded26\"}")

    setPerfilId(basico.perfilId)
    setAssociadoId(basico.associadoId)
  }, [])

  useEffect(() => {
    if (actionData?.uploaded) navigate('/cadastro/saude')
  }, [actionData])

  return <Form method='post' className='step-group' name="documentos" encType='multipart/form-data'>
    <div className='form-group'>
      <div className="instruct anexos">
        <img src={identificationImg} width={256} alt="Inspeção de documentos" />
        <h2>Documento de identificação</h2>
        <p>Envie uma imagem única contendo frente e verso do documento, ou frente e verso em imagens separadas.</p>
        <span>Formatos aceito: JPG, PNG, PDF</span>
      </div>
      <label htmlFor='identificacao_1'>Imagem frente / Imagem única <span className='required-field'>*</span></label>
      <input
        type='file'
        name='identificacao_1'
        id='identificacao_1'
        defaultValue={''}
        required
      />
    </div>
    <div className="form-group">
      <label htmlFor='identificacao_2'>Imagem verso</label>
      <input
        type='file'
        name='identificacao_2'
        id='identificacao_2'
        defaultValue={''}
      />
    </div>

    <div className='form-group'>
      <div className="instruct anexos">
        <img src={residencyImg} width={256} alt="Inspeção de documentos" />
        <h2>Comprovante de residência</h2>
        <p>Envie uma imagem única.</p>
        <span>Formatos aceito: JPG, PNG, PDF</span>
      </div>
      <label htmlFor='comprovante_residencia'>Imagem única <span className='required-field'>*</span></label>
      <input
        type='file'
        name='comprovante_residencia'
        id='comprovante_residencia'
        defaultValue={''}
        required
      />
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
