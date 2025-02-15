import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { useEffect, useState } from 'react';
import { Form, useActionData, useNavigate, useNavigation } from '@remix-run/react';

import { AssociacaoStatus } from '@prisma/client';

import atualizarIndicacaoAssociado from '~/domain/Associado/atualizar-indicacao-associado.server';
import pegarAssociadoPorId from '~/domain/Associado/pegar-por-id.server';

import { authenticator } from '~/secure/authentication.server';

import successImg from '~/assets/img/undraw/happy_form_completed.svg'
import qrCodePix from '~/assets/img/qrcode-pix.png'

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

  useEffect(() => {
    let storage = localStorage.getItem('basico');
    //if (!storage) return navigate('/cadastro/basico')

    localStorage.removeItem("basico")
  }, [])

  return <div className='cadastro-sucesso'>
    <div className="disclaimer">
      <img src={successImg} alt="Cadastro enviado" />
      <div>
        <p><span>Perfil em análise.</span> Enquanto isso, faça o pagamento dos valores abaixo.</p>
        <p>Quando o acolhedor entrar em contato com você, envie o comprovante de pagamento.</p>
      </div>
    </div>
    <div className='pagamento'>
      <div className='valores'>
        <h2>VALORES PARA SE ASSOCIAR</h2>
        <ul>
          <li>Taxa de Adesão: R$ 50,00</li>
          <li>Valor Mensalidade:  R$ 20,00</li>
        </ul>
      </div>

      <div className='forma-pagamento'>
        <div>
          <h3>PIX</h3>
          <img src={qrCodePix} alt="QR Code Pix - Bendita Associação Canábica"  />
          <p><strong>Chave CNPJ:</strong> 55841491000195</p>
          <p>Bendita Associação Canábica</p>
        </div>
        <div>
          <h3>Transferência bancária</h3>
          <p>Banco Cora</p>
          <p>Agência 0001 Conta 5107933-6</p>
          <p>CNPJ : 55.841.491/0001-95</p>
        </div>
      </div>
    </div>
  </div>
}
