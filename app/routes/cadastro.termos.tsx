import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  json,
} from '@remix-run/node';
import { useEffect, useState } from 'react';
import { Form, useActionData, useNavigate, useNavigation } from '@remix-run/react';

import { AssociacaoStatus, TipoAssociado } from '@prisma/client';

import atualizarIndicacaoAssociado from '~/domain/Associado/atualizar-indicacao-associado.server';
import pegarAssociadoPorId from '~/domain/Associado/pegar-por-id.server';

import { authenticator } from '~/secure/authentication.server';

import loading from '~/assets/img/loading.gif'
import cadastroStyle from '~/assets/css/cadastro.css';
import atualizarTipoAssociado from '~/domain/Associado/atualizar-tipo-associado.server';
import atualizarStatusAssociado from '~/domain/Associado/atualizar-status-associado.server';



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
  const form = await request.formData()

  const perfilId = form.get('perfilId');
  const associadoId = form.get('associadoId');

  const associado = await pegarAssociadoPorId(associadoId);

  if (perfilId != associado?.perfilId) throw new Error("Algo de errado não está certo.");

  const temIndicacao = (form.get('tem_indicacao') === "true");
  const tipoAssociacao = form.get('tipo_associacao')

  await atualizarTipoAssociado(tipoAssociacao, associadoId)

  if (temIndicacao) {
    const nome_indicador = form.get('nome_indicador')
    await atualizarIndicacaoAssociado(nome_indicador, associadoId)
  }

  await atualizarStatusAssociado(AssociacaoStatus.AGUARDANDO_PAGAMENTO, associadoId)

  return { concluido: true }

};

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });
}

export default function CadastroTermos() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const actionData = useActionData();

  const [perfilId, setPerfilId] = useState("")
  const [associadoId, setAssociadoId] = useState("")

  const [temIndicacao, setTemIndicacao] = useState(false)

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  useEffect(() => {
    let storage = localStorage.getItem('basico');
    if (!storage) return navigate('/cadastro/basico')

    let basico = JSON.parse(storage);

    setPerfilId(basico.perfilId)
    setAssociadoId(basico.associadoId)

  }, [])

  useEffect(() => {
    if (actionData?.concluido) {
      navigate('/cadastro/concluido')
    }
  }, [actionData])

  return <Form method='post' className='step-group' name="termos">
    <div className='form-group'>
      <label htmlFor='tipo_associacao'>Tipo de associado *</label>
      <select name="tipo_associacao" id="tipo_associacao">
        <option value={TipoAssociado.APOIADOR}>Associado Apoiador</option>
        <option value={TipoAssociado.MEDICINAL}>Associado Medicinal</option>
      </select>
    </div>
    <div className='form-group'>
      <div className="instruct">
        <h2>Você foi indicado por alguem?</h2>
        <p></p>
      </div>
      <div className="medicacao">
        <div className='form-field-response'>
          <input
            type='radio'
            name='tem_indicacao'
            id="tem_indicacao_nao"
            value={'false'}
            onChange={() => setTemIndicacao(false)}
            required
            defaultChecked
          />
          <label htmlFor='tem_indicacao_nao'>Não</label>
        </div>
        <div className='form-field-response'>
          <input
            type='radio'
            name='tem_indicacao'
            id="tem_indicacao_sim"
            value={'true'}
            onChange={() => setTemIndicacao(true)}
            defaultChecked={temIndicacao}
          />
          <label htmlFor='tem_indicacao_sim'>Sim</label>
        </div>
      </div>

      {temIndicacao && <div className='informacao-responsavel'>
        <div className='form-group'>
          <label htmlFor='nome_indicador'>Nome *</label>
          <input name='nome_indicador' id='nome_indicador' required />
        </div>
      </div>}

      <div className="submit-button">
        <input type="hidden" name="perfilId" value={perfilId} />
        <input type="hidden" name="associadoId" value={associadoId} />

        {isSubmitting
          ? <img src={loading} alt='Salvando dados' className='loading' />
          : <button type='submit'>Concluir</button>}
      </div>
    </div>






  </Form>
}
