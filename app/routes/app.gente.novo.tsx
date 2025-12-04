//@ts-nocheck
import {
  Papel,
  TipoDocumento,
  Usuario,
} from '@prisma/client';
import { json, unstable_parseMultipartFormData } from '@remix-run/node';
import type { ActionFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
} from '@remix-run/react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { InputMaskClient } from '~/component/InputMaskClient';
import { authenticator } from '~/secure/authentication.server';
import { brStringToIsoString, verificarIdade } from '~/shared/DateTime.util';
import { buscarEnderecoViaCep } from '~/shared/Address.util';
import paises from '~/assets/paises.json';
import criarNovoUsuario from '~/domain/Usuario/criar-novo-usuario.server';
import criarPerfil from '~/domain/Perfil/criar-perfil.server';
import criarAssociado from '~/domain/Associado/criar-associado.server';
import atualizarSaudeAssociado from '~/domain/Associado/atualizar-saude-associado.server';
import criarDocumento from '~/domain/Documentos/criar-documento.server';
import { s3UploaderHandler } from '~/storage/s3.service.server';
import pegarUsuarioPeloEmail from '~/domain/Usuario/pegar-usuario-pelo-email.server';
import perfilPorCpf from '~/domain/Perfil/perfil-por-cpf.server';
import enviarEmailBoasVindas from '~/domain/Usuario/enviar-email-boas-vindas.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Novo Perfil - Associação Bendita Canábica' },
    {
      name: 'description',
      content:
        'Página de cadastro de novos perfis do app da Associação Bendita Canábica.',
    },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await unstable_parseMultipartFormData(request, s3UploaderHandler);

  const email = form.get('email') as string;
  const papel = form.get('papel') as Papel;
  const nomeCompleto = form.get('nome_completo') as string;
  const apelido = form.get('apelido') as string;
  const dataNascimento = form.get('data_nascimento') as string;
  const cpf = form.get('cpf') as string;
  const rg = form.get('rg') as string;
  const nacionalidade = form.get('nacionalidade') as string;
  const estadoCivil = form.get('estado_civil') as string;
  const sexo = form.get('sexo') as string;
  const telefone = form.get('telefone') as string;
  const cep = form.get('cep') as string;
  const enderecoRua = form.get('endereco_rua') as string;
  const enderecoNumero = form.get('endereco_numero') as string;
  const bairro = form.get('bairro') as string;
  const cidade = form.get('cidade') as string;
  const estado = form.get('estado') as string;
  const enderecoComplemento = form.get('endereco_complemento') as string;
  const instagram = form.get('instagram') as string;
  const linkedin = form.get('linkedin') as string;
  const elegivelTarifaSocial = form.get('elegivel_tarifa_social') === 'on';

  // Validações básicas - verificar se existem E não são strings vazias
  let errors = {
    email: !email || email.trim() === '',
    papel: !papel,
    nomeCompleto: !nomeCompleto || nomeCompleto.trim() === '',
    dataNascimento: papel === Papel.ASSOCIADO ? (!dataNascimento || dataNascimento.trim() === '') : false,
    cpf: papel === Papel.ASSOCIADO ? (!cpf || cpf.trim() === '') : false,
    telefone: !telefone || telefone.trim() === '',
  };

  console.log('Valores recebidos:', { email, papel, nomeCompleto, cpf, telefone });
  console.log('Erros:', errors);
  
  if (Object.values(errors).some(Boolean)) {
    return json({ errors, message: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  // Verificar se email ou CPF já existem
  let usuarioSeExistir = await pegarUsuarioPeloEmail(email);
  let perfilSeExistir = cpf && cpf.trim() !== '' ? await perfilPorCpf(cpf) : null;

  if (email == usuarioSeExistir?.email) {
    return json({
      errors: { data: 'Já existe uma conta associada a este e-mail.' },
    });
  }

  if (cpf && cpf.trim() !== '' && cpf == perfilSeExistir?.cpf) {
    return json({
      errors: { data: 'Já existe uma conta associada a este CPF.' },
    });
  }

  // Gerar senha temporária (você pode implementar envio por email)
  const senhaTemporaria = Math.random().toString(36).slice(-10);

  // Criar usuário
  const usuario = await criarNovoUsuario(email, senhaTemporaria, papel);

  if (!usuario) {
    return json({
      errors: { data: 'Erro ao criar usuário. Tente novamente.' },
    });
  }

  // Criar perfil
  const perfil = await criarPerfil({
    nomeCompleto,
    apelido,
    dataNascimento: dataNascimento ? brStringToIsoString(dataNascimento) : null,
    cpf,
    rg,
    nacionalidade,
    estadoCivil,
    sexo,
    telefone,
    cep,
    enderecoRua,
    enderecoNumero,
    bairro,
    cidade,
    estado,
    enderecoComplemento,
    usuarioId: usuario?.id,
    usuario: usuario,
    instagram,
    linkedin,
  });

  if (!perfil) {
    return json({
      errors: { data: 'Erro ao criar perfil. Tente novamente.' },
    });
  }

  // Se for associado, criar registro de associado e processar informações de saúde/documentos
  if (papel === Papel.ASSOCIADO || papel === Papel.ASSOCIADO_DEPENDENTE) {
    const associado = await criarAssociado(perfil?.id, undefined, elegivelTarifaSocial);

    if (!associado) {
      return json({
        errors: { data: 'Erro ao criar registro de associado. Tente novamente.' },
      });
    }

    // Processar informações de saúde
    const quadroGeral = form.get('quadro_geral');
    const usaMedicacao = form.get('usa_medicacao') === 'true';
    const usaMedicacaoNome = form.get('medicacao_nome');
    const usoTerapeutico = form.get('uso_terapeutico') === 'true';
    const usoTerapeuticoRelato = form.get('relato_uso_terapeutico');
    const acompanhadoPrescritor = form.get('acompanhado_prescritor') === 'true';
    const acompanhadoPrescritorNome = form.get('nome_prescritor');
    const acompanhadoPrescritorCrm = form.get('crm_prescritor');

    if (quadroGeral || usaMedicacao || usoTerapeutico || acompanhadoPrescritor) {
      await atualizarSaudeAssociado({
        quadroGeral,
        usaMedicacao,
        usaMedicacaoNome,
        usoTerapeutico,
        usoTerapeuticoRelato,
        acompanhadoPrescritor,
        acompanhadoPrescritorNome,
        acompanhadoPrescritorCrm,
        perfilId: perfil?.id,
        associadoId: associado?.id,
      });
    }

    // Processar uploads de documentos
    const identificacao1 = form.get('identificacao_1');
    const identificacao2 = form.get('identificacao_2');
    const comprovanteResidencia = form.get('comprovante_residencia');
    const receitaUsoCanabis = form.get('receita_uso_canabis');
    const autorizacaoAnvisa = form.get('autorizacao_anvisa');

    if (identificacao1) {
      await criarDocumento({
        tipo: TipoDocumento.IDENTIFICACAO,
        nome_arquivo: identificacao1,
        associadoId: associado?.id,
        criadoPorId: perfil?.id,
      });
    }

    if (identificacao2) {
      await criarDocumento({
        tipo: TipoDocumento.IDENTIFICACAO,
        nome_arquivo: identificacao2,
        associadoId: associado?.id,
        criadoPorId: perfil?.id,
      });
    }

    if (comprovanteResidencia) {
      await criarDocumento({
        tipo: TipoDocumento.COMPROVANTE_RESIDENCIA,
        nome_arquivo: comprovanteResidencia,
        associadoId: associado?.id,
        criadoPorId: perfil?.id,
      });
    }

    if (receitaUsoCanabis) {
      await criarDocumento({
        tipo: TipoDocumento.RECEITA_MEDICA,
        nome_arquivo: receitaUsoCanabis,
        associadoId: associado?.id,
        criadoPorId: perfil?.id,
      });
    }

    if (autorizacaoAnvisa) {
      await criarDocumento({
        tipo: TipoDocumento.AUTORIZACAO_ANVISA,
        nome_arquivo: autorizacaoAnvisa,
        associadoId: associado?.id,
        criadoPorId: perfil?.id,
      });
    }
  }

  // Enviar e-mail de boas-vindas com as credenciais
  const emailEnviado = await enviarEmailBoasVindas(email, nomeCompleto, senhaTemporaria);

  if (!emailEnviado) {
    console.warn(`Perfil criado mas e-mail de boas-vindas não foi enviado para ${email}`);
  }

  return json({ 
    success: true, 
    message: emailEnviado 
      ? 'Perfil criado com sucesso! As credenciais de acesso foram enviadas por e-mail.'
      : `Perfil criado com sucesso! Atenção: não foi possível enviar o e-mail. Senha temporária: ${senhaTemporaria}`,
    emailEnviado
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return json({ usuario });
}

type UserLoaderDataType = {
  usuario: Usuario;
};

const NovoAssociado = () => {
  const { usuario } = useLoaderData<UserLoaderDataType>();
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [papelSelecionado, setPapelSelecionado] = useState<Papel>(Papel.ASSOCIADO);
  const [endereco, setEndereco] = useState({});
  
  // Estados para campos condicionais de saúde
  const [quadroGeral, setQuadroGeral] = useState('');
  const [usaMedicacao, setUsaMedicacao] = useState(false);
  const [usoTerapeutico, setUsoTerapeutico] = useState(false);
  const [relatoUsoTerapeutico, setRelatoUsoTerapeutico] = useState('');
  const [acompanhadoPrescritor, setAcompanhadoPrescritor] = useState(false);

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);
  const isAssociado = [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE].includes(papelSelecionado);

  useEffect(() => {
    if (actionData?.success) {
      alert(actionData.message);
      navigate('/app/gente');
    }
  }, [actionData, navigate]);

  async function carregarEndereco(event) {
    let cep = event.target.value.replace(/\D/g, '');

    let { logradouro, bairro, cidade, estado } = await buscarEnderecoViaCep(cep);

    setEndereco({
      logradouro,
      bairro,
      cidade,
      estado,
    });

    if (!logradouro) {
      let endereco = document.getElementById('endereco_rua');
      endereco?.focus();
      return;
    }

    let numero = document.getElementById('endereco_numero');
    numero.value = '';
    numero?.focus();
  }

  function resizeTextarea(event) {
    if (event.target.scrollHeight > event.target.offsetHeight) event.target.rows += 1;
  }

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className='app-content'>
        <Row className='align-items-center mt-1 mb-4'>
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-user-plus la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>Cadastro de Novo Perfil</h2>
                <p className='text-muted mb-0'>
                  Preencha as informações solicitadas para realizar o cadastro no sistema
                </p>
              </div>
            </div>
          </Col>
          <Col xs='auto'>
            <Button 
              variant='outline-dark'
              onClick={() => navigate('/app/gente')}
              className='rounded-3 px-3'
            >
              <i className='las la-arrow-left me-2' /> Voltar
            </Button>
          </Col>
        </Row>

        <hr />
        
        <Row>
          <Col className='pt-3'>
            <Form method='post' encType='multipart/form-data'>
              {actionData?.errors?.data && (
                <Alert variant='danger' className='mb-4 shadow-sm'>
                  <i className='las la-exclamation-triangle me-2'></i>
                  <strong>Erro:</strong> {actionData?.errors?.data}
                </Alert>
              )}
              {actionData?.message && !actionData?.success && (
                <Alert variant='warning' className='mb-4 shadow-sm'>
                  <i className='las la-exclamation-circle me-2'></i>
                  <strong>Atenção:</strong> {actionData?.message}
                </Alert>
              )}

              {/* Seletor de Papel */}
              <Card className='mb-4 shadow-sm border-0 rounded-3'>
                <Card.Header className='bg-light border-bottom'>
                  <h5 className='mb-0 text-dark fw-semibold'>
                    <i className='las la-user-tag me-2 text-secondary'></i>
                    Tipo de Perfil
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <Form.Group controlId='papel'>
                        <Form.Label>
                          Selecione o tipo de perfil <span className='text-danger'>*</span>
                        </Form.Label>
                        <Form.Select
                          name='papel'
                          value={papelSelecionado}
                          onChange={(e) => setPapelSelecionado(e.target.value as Papel)}
                          required
                          className='rounded-3'
                        >
                          <option value={Papel.ASSOCIADO}>Associado</option>
                          <option value={Papel.ASSOCIADO_DEPENDENTE}>Associado Dependente</option>
                          <option value={Papel.ADMIN}>Administrador</option>
                          <option value={Papel.SECRETARIA}>Secretaria</option>
                          <option value={Papel.SAUDE}>Saúde</option>
                        </Form.Select>
                        <Form.Text className='text-muted'>
                          O tipo de perfil determina as permissões e funcionalidades disponíveis
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Checkbox de elegibilidade para tarifa social */}
                  {papelSelecionado === Papel.ASSOCIADO && (
                    <Row className='mt-3'>
                      <Col md={12}>
                        <Form.Group controlId='elegivel_tarifa_social'>
                          <div className='border rounded-3 p-3 bg-light'>
                            <Form.Check
                              type='checkbox'
                              name='elegivel_tarifa_social'
                              id='elegivel_tarifa_social'
                              label='Elegível para Tarifa Social'
                            />
                            <Form.Text className='text-muted d-block mt-2'>
                              <i className='las la-info-circle me-1'></i>
                              Marque se o associado tem direito à mensalidade social (tarifa reduzida)
                            </Form.Text>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              {/* Informações Básicas - Sempre visível */}
              <Card className='mb-4 shadow-sm border-0 rounded-3'>
                <Card.Header className='bg-light border-bottom'>
                  <h5 className='mb-0 text-dark fw-semibold'>
                    <i className='las la-envelope me-2 text-secondary'></i>
                    Dados de Acesso
                  </h5>
                </Card.Header>
                <Card.Body>

              <Row>
                <Col md={12}>
                  <Form.Group controlId='email'>
                    <Form.Label className='fw-medium'>
                      <i className='las la-envelope text-secondary me-1'></i>
                      E-mail <span className='text-danger'>*</span>
                    </Form.Label>
                    <Form.Control
                      type='email'
                      name='email'
                      placeholder='exemplo@email.com'
                      required
                    />
                    <Form.Text className='text-muted'>
                      <i className='las la-info-circle me-1'></i>
                      Uma conta será criada e as credenciais serão enviadas para este e-mail
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
                </Card.Body>
              </Card>

              {/* Informações Pessoais */}
              <Card className='mb-4 shadow-sm border-0 rounded-3'>
                <Card.Header className='bg-light border-bottom'>
                  <h5 className='mb-0 text-dark fw-semibold'>
                    <i className='las la-id-card me-2 text-secondary'></i>
                    Informações Pessoais
                  </h5>
                </Card.Header>
                <Card.Body>
              <Row className='mb-3'>
                <Col md={6}>
                  <Form.Group controlId='nome_completo'>
                    <Form.Label className='fw-medium'>
                      <i className='las la-user text-secondary me-1'></i>
                      Nome Completo <span className='text-danger'>*</span>
                    </Form.Label>
                    <Form.Control
                      type='text'
                      name='nome_completo'
                      placeholder='Ex: João da Silva Santos'
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId='apelido'>
                    <Form.Label className='fw-medium'>Nome Preferido</Form.Label>
                    <Form.Control
                      type='text'
                      name='apelido'
                      placeholder='Como prefere ser chamado(a)'
                    />
                    <Form.Text className='text-muted'>Opcional - usado em comunicações informais</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row className='mb-3'>
                <Col md={4}>
                  <Form.Group controlId='data_nascimento'>
                    <Form.Label className='fw-medium'>
                      <i className='las la-calendar text-secondary me-1'></i>
                      Data de Nascimento {papelSelecionado === Papel.ASSOCIADO && <span className='text-danger'>*</span>}
                    </Form.Label>
                    <InputMaskClient
                      type='text'
                      name='data_nascimento'
                      id='data_nascimento'
                      autoComplete='off'
                      mask='99/99/9999'
                      maskPlaceholder={'_'}
                      placeholder='DD/MM/AAAA'
                      required={papelSelecionado === Papel.ASSOCIADO}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId='cpf'>
                    <Form.Label className='fw-medium'>
                      <i className='las la-id-card-alt text-secondary me-1'></i>
                      CPF {papelSelecionado === Papel.ASSOCIADO && <span className='text-danger'>*</span>}
                    </Form.Label>
                    <InputMaskClient
                      type='text'
                      name='cpf'
                      id='cpf'
                      autoComplete='off'
                      mask='999.999.999-99'
                      maskPlaceholder={'_'}
                      required={papelSelecionado === Papel.ASSOCIADO}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId='rg'>
                    <Form.Label className='fw-medium'>RG</Form.Label>
                    <Form.Control
                      type='text'
                      name='rg'
                      autoComplete='off'
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className='mb-3'>
                <Col md={6}>
                  <Form.Group controlId='nacionalidade'>
                    <Form.Label className='fw-medium'>Nacionalidade</Form.Label>
                    <Form.Select name='nacionalidade'>
                      {paises.map((pais) => (
                        <option key={pais.sigla} value={pais.gentilico}>
                          {pais.nome_pais} - {pais.gentilico}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId='estado_civil'>
                    <Form.Label className='fw-medium'>Estado Civil</Form.Label>
                    <Form.Select name='estado_civil'>
                      <option value='Solteiro (a)'>Solteiro (a)</option>
                      <option value='Casado (a)'>Casado (a)</option>
                      <option value='Divorciado (a)'>Divorciado (a)</option>
                      <option value='Viúvo (a)'>Viúvo (a)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className='mb-3'>
                <Col md={6}>
                  <Form.Group controlId='sexo'>
                    <Form.Label className='fw-medium'>Sexo</Form.Label>
                    <Form.Select name='sexo'>
                      <option value='Feminino'>Feminino</option>
                      <option value='Masculino'>Masculino</option>
                      <option value='Não binário'>Não binário</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId='telefone'>
                    <Form.Label className='fw-medium'>
                      <i className='las la-phone text-secondary me-1'></i>
                      Telefone / WhatsApp <span className='text-danger'>*</span>
                    </Form.Label>
                    <InputMaskClient
                      type='text'
                      name='telefone'
                      id='telefone'
                      autoComplete='off'
                      mask='+55 (99) 9 9999-9999'
                      maskPlaceholder={'_'}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className='mb-3'>
                <Col md={4}>
                  <Form.Group controlId='cep'>
                    <Form.Label className='fw-medium'>CEP</Form.Label>
                    <InputMaskClient
                      type='text'
                      name='cep'
                      id='cep'
                      autoComplete='off'
                      mask='99999-999'
                      maskPlaceholder={'_'}
                      onChange={carregarEndereco}
                    />
                  </Form.Group>
                </Col>

                <Col md={8}>
                  <Form.Group controlId='endereco_rua'>
                    <Form.Label className='fw-medium'>Endereço</Form.Label>
                    <Form.Control
                      type='text'
                      name='endereco_rua'
                      autoComplete='off'
                      defaultValue={endereco?.logradouro ?? ''}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className='mb-3'>
                <Col md={4}>
                  <Form.Group controlId='endereco_numero'>
                    <Form.Label className='fw-medium'>Número</Form.Label>
                    <Form.Control
                      type='text'
                      name='endereco_numero'
                      autoComplete='off'
                    />
                  </Form.Group>
                </Col>

                <Col md={8}>
                  <Form.Group controlId='bairro'>
                    <Form.Label className='fw-medium'>Bairro</Form.Label>
                    <Form.Control
                      type='text'
                      name='bairro'
                      autoComplete='off'
                      defaultValue={endereco.bairro ?? ''}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className='mb-3'>
                <Col md={6}>
                  <Form.Group controlId='cidade'>
                    <Form.Label className='fw-medium'>Cidade</Form.Label>
                    <Form.Control
                      type='text'
                      name='cidade'
                      autoComplete='off'
                      defaultValue={endereco.cidade ?? ''}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId='estado'>
                    <Form.Label className='fw-medium'>Estado</Form.Label>
                    <Form.Control
                      type='text'
                      name='estado'
                      autoComplete='off'
                      defaultValue={endereco.estado ?? ''}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group controlId='endereco_complemento' className='mb-3'>
                <Form.Label className='fw-medium'>Complemento</Form.Label>
                <Form.Control
                  type='text'
                  name='endereco_complemento'
                  autoComplete='off'
                />
              </Form.Group>

              <Row className='mb-3'>
                <Col md={6}>
                  <Form.Group controlId='instagram'>
                    <Form.Label className='fw-medium'>Instagram</Form.Label>
                    <Form.Control
                      type='text'
                      name='instagram'
                      autoComplete='off'
                      placeholder='Link ou @'
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId='linkedin'>
                    <Form.Label className='fw-medium'>LinkedIn</Form.Label>
                    <Form.Control
                      type='text'
                      name='linkedin'
                      autoComplete='off'
                      placeholder='Link do perfil'
                    />
                  </Form.Group>
                </Col>
              </Row>
                </Card.Body>
              </Card>

              {/* Seção de Documentos - Apenas para Associados */}
              {isAssociado && (
                <>
                  <Card className='mb-4 shadow-sm border-0 rounded-3'>
                    <Card.Header className='bg-light border-bottom'>
                      <h5 className='mb-0 text-dark fw-semibold'>
                        <i className='las la-file-upload me-2 text-secondary'></i>
                        Documentos
                      </h5>
                    </Card.Header>
                    <Card.Body>

                  <Row className='mb-3'>
                    <Col md={12}>
                      <Alert variant='info'>
                        <strong>Documento de identificação:</strong> Envie uma imagem única contendo frente e verso do documento, ou frente e verso em imagens separadas.
                        <br />
                        <small>Formatos aceitos: JPG, PNG, PDF</small>
                      </Alert>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={6}>
                      <Form.Group controlId='identificacao_1'>
                        <Form.Label>Imagem frente / Imagem única</Form.Label>
                        <Form.Control
                          type='file'
                          name='identificacao_1'
                          accept='image/*,.pdf'
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId='identificacao_2'>
                        <Form.Label>Imagem verso</Form.Label>
                        <Form.Control
                          type='file'
                          name='identificacao_2'
                          accept='image/*,.pdf'
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={12}>
                      <Form.Group controlId='comprovante_residencia'>
                        <Form.Label>Comprovante de residência</Form.Label>
                        <Form.Control
                          type='file'
                          name='comprovante_residencia'
                          accept='image/*,.pdf'
                        />
                        <Form.Text className='text-muted'>
                          Formatos aceitos: JPG, PNG, PDF
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                    </Card.Body>
                  </Card>

                  {/* Seção de Saúde - Apenas para Associados */}
                  <Card className='mb-4 shadow-sm border-0 rounded-3'>
                    <Card.Header className='bg-light border-bottom'>
                      <h5 className='mb-0 text-dark fw-semibold'>
                        <i className='las la-heartbeat me-2 text-secondary'></i>
                        Informações de Saúde
                      </h5>
                    </Card.Header>
                    <Card.Body>
                  <Form.Group controlId='quadro_geral' className='mb-3'>
                    <Form.Label>Quadro geral de saúde</Form.Label>
                    <Form.Control
                      as='textarea'
                      name='quadro_geral'
                      rows={3}
                      maxLength={2048}
                      placeholder='Descreva os diagnósticos de patologias existentes'
                      onInput={resizeTextarea}
                      onChange={(e) => setQuadroGeral(e.target.value)}
                    />
                    <Form.Text className='text-muted'>
                      {quadroGeral.length} de até 2048 caracteres
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Label>Usa alguma medicação?</Form.Label>
                    <div>
                      <Form.Check
                        inline
                        type='radio'
                        label='Não'
                        name='usa_medicacao'
                        id='usa_medicacao_nao'
                        value='false'
                        onChange={() => setUsaMedicacao(false)}
                      />
                      <Form.Check
                        inline
                        type='radio'
                        label='Sim'
                        name='usa_medicacao'
                        id='usa_medicacao_sim'
                        value='true'
                        onChange={() => setUsaMedicacao(true)}
                      />
                    </div>
                  </Form.Group>

                  {usaMedicacao && (
                    <Form.Group controlId='medicacao_nome' className='mb-3'>
                      <Form.Label>Nome das medicações</Form.Label>
                      <Form.Control
                        type='text'
                        name='medicacao_nome'
                        placeholder='Escreva os nomes das medicações que você faz uso'
                      />
                    </Form.Group>
                  )}

                  <Form.Group className='mb-3'>
                    <Form.Label>Já fez uso terapêutico com a cannabis?</Form.Label>
                    <div>
                      <Form.Check
                        inline
                        type='radio'
                        label='Não'
                        name='uso_terapeutico'
                        id='uso_terapeutico_nao'
                        value='false'
                        onChange={() => setUsoTerapeutico(false)}
                      />
                      <Form.Check
                        inline
                        type='radio'
                        label='Sim'
                        name='uso_terapeutico'
                        id='uso_terapeutico_sim'
                        value='true'
                        onChange={() => setUsoTerapeutico(true)}
                      />
                    </div>
                  </Form.Group>

                  {usoTerapeutico && (
                    <Form.Group controlId='relato_uso_terapeutico' className='mb-3'>
                      <Form.Label>Relato da experiência</Form.Label>
                      <Form.Control
                        as='textarea'
                        name='relato_uso_terapeutico'
                        rows={2}
                        maxLength={512}
                        placeholder='Faça um breve relato da sua experiência com o uso terapêutico da cannabis'
                        onInput={resizeTextarea}
                        onChange={(e) => setRelatoUsoTerapeutico(e.target.value)}
                      />
                      <Form.Text className='text-muted'>
                        {relatoUsoTerapeutico.length} de até 512 caracteres
                      </Form.Text>
                    </Form.Group>
                  )}

                  <Form.Group className='mb-3'>
                    <Form.Label>É acompanhado por médico prescritor de cannabis?</Form.Label>
                    <div>
                      <Form.Check
                        inline
                        type='radio'
                        label='Não'
                        name='acompanhado_prescritor'
                        id='acompanhado_prescritor_nao'
                        value='false'
                        onChange={() => setAcompanhadoPrescritor(false)}
                      />
                      <Form.Check
                        inline
                        type='radio'
                        label='Sim'
                        name='acompanhado_prescritor'
                        id='acompanhado_prescritor_sim'
                        value='true'
                        onChange={() => setAcompanhadoPrescritor(true)}
                      />
                    </div>
                  </Form.Group>

                  {acompanhadoPrescritor && (
                    <>
                      <Row className='mb-3'>
                        <Col md={6}>
                          <Form.Group controlId='nome_prescritor'>
                            <Form.Label>Nome do profissional</Form.Label>
                            <Form.Control
                              type='text'
                              name='nome_prescritor'
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group controlId='crm_prescritor'>
                            <Form.Label>CRM</Form.Label>
                            <Form.Control
                              type='text'
                              name='crm_prescritor'
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className='mb-3'>
                        <Col md={6}>
                          <Form.Group controlId='receita_uso_canabis'>
                            <Form.Label>Receita Médica</Form.Label>
                            <Form.Control
                              type='file'
                              name='receita_uso_canabis'
                              accept='image/*,.pdf'
                            />
                            <Form.Text className='text-muted'>
                              Se você já tem receita médica para uso da cannabis medicinal
                            </Form.Text>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group controlId='autorizacao_anvisa'>
                            <Form.Label>Autorização da ANVISA</Form.Label>
                            <Form.Control
                              type='file'
                              name='autorizacao_anvisa'
                              accept='image/*,.pdf'
                            />
                            <Form.Text className='text-muted'>
                              Se você possui autorização da ANVISA para importação
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}
                    </Card.Body>
                  </Card>
                </>
              )}

              <hr className='my-4' />

              <Row className='mb-3'>
                <Col className='d-flex justify-content-between align-items-center gap-2'>
                  <div className='text-muted'>
                    <small><i className='las la-info-circle me-1'></i>Campos marcados com * são obrigatórios</small>
                  </div>
                  <div className='d-flex gap-2'>
                    <Button 
                      variant='outline-dark' 
                      onClick={() => navigate('/app/gente')}
                      disabled={isSubmitting}
                      className='rounded-3 px-4'
                    >
                      <i className='las la-times me-2'></i>
                      Cancelar
                    </Button>
                    <Button 
                      type='submit'
                      disabled={isSubmitting}
                      className='rounded-3 px-4'
                      style={{ backgroundColor: 'darkorchid', borderColor: 'darkorchid', color: 'white' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as='span'
                            animation='border'
                            size='sm'
                            role='status'
                            aria-hidden='true'
                            className='me-2'
                          />
                          Processando...
                        </>
                      ) : (
                        <>
                          <i className='las la-check me-2'></i>
                          Cadastrar Perfil
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
};

export default NovoAssociado;
