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
import { s3UploaderHandler } from '~/storage/s3.service.server';

import cadastroStyle from '~/assets/css/cadastro.css';
import loading from '~/assets/img/loading.gif';
import atualizarSaudeAssociado from '~/domain/Associado/atualizar-saude-associado.server';
import { TipoDocumento } from '@prisma/client';
import criarDocumento from '~/domain/Documentos/criar-documento.server';


export const meta: MetaFunction = () => {
  return [
    { title: 'Informações de saúde - Bendita Associação Canábica' },
    { name: 'description', content: 'Solicitação de análise associativa da Bendita Associação Canábica' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await unstable_parseMultipartFormData(request, s3UploaderHandler);

  const receitaUsoCanabis = form.get('receita_uso_canabis')
  const autorizacaoAnvisa = form.get('autorizacao_anvisa')

  const quadroGeral = form.get('quadro_geral')
  const usaMedicacao = (form.get('usa_medicacao') === 'true')
  const usaMedicacaoNome = form.get('medicacao_nome')

  const usoTerapeutico = (form.get('uso_terapeutico') === 'true')
  const usoTerapeuticoRelato = form.get('relato_uso_terapeutico')

  const acompanhadoPrescritor = (form.get('acompanhado_prescritor') === 'true')
  const acompanhadoPrescritorNome = form.get('nome_prescritor')
  const acompanhadoPrescritorCrm = form.get('crm_prescritor')

  const perfilId = form.get('perfilId')
  const associadoId = form.get('associadoId')

  console.log("associado id", associadoId)

  let objAtualizacao = {
    quadroGeral,
    usaMedicacao,
    usaMedicacaoNome,
    usoTerapeutico,
    usoTerapeuticoRelato,
    acompanhadoPrescritor,
    acompanhadoPrescritorNome,
    acompanhadoPrescritorCrm,
    perfilId,
    associadoId
  }

  await atualizarSaudeAssociado(objAtualizacao)

  if (receitaUsoCanabis) {
    let documentoObj = {
      tipo: TipoDocumento.RECEITA_MEDICA,
      nome_arquivo: receitaUsoCanabis,
      associadoId: associadoId,
      criadoPorId: perfilId
    }
    await criarDocumento(documentoObj)
  }

  if (autorizacaoAnvisa) {
    let documentoObj = {
      tipo: TipoDocumento.AUTORIZACAO_ANVISA,
      nome_arquivo: autorizacaoAnvisa,
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
    successRedirect: '/dashboard',
  });
}

export default function CadastroSaude() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [quadroGeral, setQuadroGeral] = useState("")
  const [usaMedicacao, setUsaMedicacao] = useState(false)
  const [usoTerapeutico, setUsoTerapeutico] = useState(false)
  const [relatoUsoTerapeutico, setRelatoUsoTerapeutico] = useState("")
  const [acompanhadoPrescritor, setAcompanhadoPrescritor] = useState(false)

  const [perfilId, setPerfilId] = useState("")
  const [associadoId, setAssociadoId] = useState("")

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  useEffect(() => {
    let storage = localStorage.getItem('basico');
    if (!storage) return navigate('/cadastro/basico')

    let basico = JSON.parse(storage);

    setPerfilId(basico.perfilId)
    setAssociadoId(basico.associadoId)
  }, [])

  useEffect(() => {
    if (actionData?.uploaded) navigate('/cadastro/responsavel')
  }, [actionData])

  function resizeTextarea(event) {
    if (event.target.scrollHeight > event.target.offsetHeight) event.target.rows += 1
  }

  return <Form method='post' className='step-group' name="saude" encType='multipart/form-data'>
    <div className='form-group'>
      <div className="instruct">
        <h2>Quadro geral de saúde *</h2>
      </div>
      <label htmlFor='quadro_geral'>Descreva os diagnósticos de patologias existentes.</label>
      <textarea name='quadro_geral' id='quadro_geral' required onInput={resizeTextarea} onChange={(event) => setQuadroGeral(event.target.value)} maxLength={2048} rows={1} />
      <span className='char-lenght-info'>{quadroGeral.length} de até 2048 caracteres</span>
    </div>

    <div className='form-group'>
      <div className="instruct">
        <h2>Usa alguma medicação? *</h2>
      </div>
      <div className="medicacao">
        <div className='form-field-response'>
          <input
            type='radio'
            name='usa_medicacao'
            id="usa_medicacao_nao"
            value={'false'}
            onChange={() => setUsaMedicacao(false)}
            required
          />
          <label htmlFor='usa_medicacao_nao'>Não</label>
        </div>
        <div className='form-field-response'>
          <input
            type='radio'
            name='usa_medicacao'
            id="usa_medicacao_sim"
            value={'true'}
            onChange={() => setUsaMedicacao(true)}
          />
          <label htmlFor='usa_medicacao_sim'>Sim</label>
        </div>
      </div>
      {usaMedicacao && <div className='form-group'>
        <label htmlFor='medicacao_nome'>Escreva os nomes das medicações que você faz uso.</label>
        <input name='medicacao_nome' id='medicacao_nome' required />
      </div>}
    </div>

    <div className='form-group'>
      <div className="instruct">
        <h2>Já fez uso terapêutico com a cannabis? *</h2>
      </div>
      <div className="medicacao">
        <div className='form-field-response'>
          <input
            type='radio'
            name='uso_terapeutico'
            id="uso_terapeutico_nao"
            value={'false'}
            onChange={() => setUsoTerapeutico(false)}
            required
          />
          <label htmlFor='uso_terapeutico_nao'>Não</label>
        </div>
        <div className='form-field-response'>
          <input
            type='radio'
            name='uso_terapeutico'
            id="uso_terapeutico_sim"
            value={'true'}
            onChange={() => setUsoTerapeutico(true)}
          />
          <label htmlFor='uso_terapeutico_sim'>Sim</label>
        </div>
      </div>
      {usoTerapeutico && <div className='form-group'>
        <label htmlFor='relato_uso_terapeutico'>Faça um breve relato da sua experiência com o uso terapêutico da cannabis. *</label>
        <textarea name='relato_uso_terapeutico' id='relato_uso_terapeutico'
          required onInput={resizeTextarea}
          onChange={(event) => setRelatoUsoTerapeutico(event.target.value)}
          maxLength={512} rows={1}
        />

        <span className='char-lenght-info'>{relatoUsoTerapeutico.length} de até 512 caracteres</span>
      </div>}
    </div>

    <div className='form-group'>
      <div className="instruct">
        <h2>É acompanhado por médico prescritor de cannabis? *</h2>
      </div>
      <div className="medicacao">
        <div className='form-field-response'>
          <input
            type='radio'
            name='acompanhado_prescritor'
            id="acompanhado_prescritor_nao"
            value={'false'}
            onChange={() => setAcompanhadoPrescritor(false)}
            required
          />
          <label htmlFor='acompanhado_prescritor_nao'>Não</label>
        </div>
        <div className='form-field-response'>
          <input
            type='radio'
            name='acompanhado_prescritor'
            id="acompanhado_prescritor_sim"
            value={'true'}
            onChange={() => setAcompanhadoPrescritor(true)}
          />
          <label htmlFor='acompanhado_prescritor_sim'>Sim</label>
        </div>
      </div>
      {acompanhadoPrescritor && <div className='form-group inline-group'>
        <div>
          <label htmlFor='nome_prescritor'>Nome do profissional *</label>
          <input name='nome_prescritor' id='nome_prescritor' required />
        </div>
        <div>
          <label htmlFor='crm_prescritor'>CRM *</label>
          <input name='crm_prescritor' id='crm_prescritor' required />
        </div>
      </div>}

      {acompanhadoPrescritor && <div className='form-group'>
        <div className="instruct">
          <h2><b style={{ fontWeight: '800' }}>Anexo:</b> Receita Média</h2>
          <p>Se você já tem receita médica para uso da cannabis medicinal anexe aqui.</p>
          <span>Formatos aceito: JPG, PNG, PDF</span>
        </div>
        <label htmlFor='receita_uso_canabis'>Imagem única *</label>
        <input
          type='file'
          name='receita_uso_canabis'
          id='receita_uso_canabis'
          defaultValue={''}
          required
        />

        <div className="instruct">
          <h2><b style={{ fontWeight: '800' }}>Anexo:</b> Autorização da ANVISA</h2>
          <p>Se você possui autorização da ANVISA para importação anexe aqui.</p>
          <span>Formatos aceito: JPG, PNG, PDF</span>
        </div>
        <label htmlFor='autorizacao_anvisa'>Imagem única *</label>
        <input
          type='file'
          name='autorizacao_anvisa'
          id='autorizacao_anvisa'
          defaultValue={''}
          required
        />
      </div>}

      <div className="submit-button">
        <input type="hidden" name="perfilId" value={perfilId} />
        <input type="hidden" name="associadoId" value={associadoId} />

        {isSubmitting
          ? <img src={loading} alt='Salvando dados' className='loading' />
          : <button type='submit'>Avançar</button>}
      </div>
    </div>
  </Form>
}
