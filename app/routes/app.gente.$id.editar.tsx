//@ts-nocheck
import {
  Papel,
  TipoDocumento,
  Usuario,
  Perfil,
  Associado,
  Documentos,
} from '@prisma/client';
import { json, redirect, unstable_parseMultipartFormData } from '@remix-run/node';
import type { ActionFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import {
  Form,
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
  Form as BootstrapForm,
  Row,
  Spinner,
} from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { InputMaskClient } from '~/component/InputMaskClient';
import { authenticator } from '~/secure/authentication.server';
import { brStringToIsoString, brDataFromIsoString } from '~/shared/DateTime.util';
import { buscarEnderecoViaCep } from '~/shared/Address.util';
import paises from '~/assets/paises.json';
import atualizarUsuario from '~/domain/Usuario/atualizar-usuario.server';
import atualizarPerfil from '~/domain/Perfil/atualizar-perfil.server';
import criarAssociado from '~/domain/Associado/criar-associado.server';
import atualizarSaudeAssociado from '~/domain/Associado/atualizar-saude-associado.server';
import atualizarIndicacaoAssociado from '~/domain/Associado/atualizar-indicacao-associado.server';
import criarDocumento from '~/domain/Documentos/criar-documento.server';
import { s3UploaderHandler } from '~/storage/s3.service.server';
import pegarUsuarioPeloEmail from '~/domain/Usuario/pegar-usuario-pelo-email.server';
import perfilPorCpf from '~/domain/Perfil/perfil-por-cpf.server';
import { prisma } from '~/secure/db.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Editar Perfil - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Página de edição de perfis do app da Associação Bendita Canábica.',
    },
  ];
};

export const action: ActionFunction = async ({ request, params }) => {
  const perfilId = params.id;

  if (!perfilId) {
    return redirect('/app/gente');
  }

  const form = await unstable_parseMultipartFormData(request, s3UploaderHandler);

  const email = form.get('email');
  const papel = form.get('papel') as Papel;
  const nomeCompleto = form.get('nome_completo');
  const apelido = form.get('apelido');
  const dataNascimento = form.get('data_nascimento');
  const cpf = form.get('cpf');
  const rg = form.get('rg');
  const nacionalidade = form.get('nacionalidade');
  const estadoCivil = form.get('estado_civil');
  const sexo = form.get('sexo');
  const telefone = form.get('telefone');
  const cep = form.get('cep');
  const enderecoRua = form.get('endereco_rua');
  const enderecoNumero = form.get('endereco_numero');
  const bairro = form.get('bairro');
  const cidade = form.get('cidade');
  const estado = form.get('estado');
  const enderecoComplemento = form.get('endereco_complemento');
  const instagram = form.get('instagram');
  const linkedin = form.get('linkedin');
  const indicadoPor = form.get('indicado_por');
  const elegivelTarifaSocial = form.get('elegivel_tarifa_social') === 'on';

  console.log('=== Valores do formulário ===');
  console.log('elegivel_tarifa_social raw:', form.get('elegivel_tarifa_social'));
  console.log('elegivelTarifaSocial processado:', elegivelTarifaSocial);
  console.log('papel:', papel);

  // Validações básicas
  let errors = {
    email: !email,
    papel: !papel,
    nomeCompleto: !nomeCompleto,
    cpf: !cpf,
    telefone: !telefone,
  };

  if (Object.values(errors).some(Boolean)) {
    return json({ errors, message: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  // Buscar perfil existente
  const perfilExistente = await prisma.perfil.findUnique({
    where: { id: perfilId },
    include: {
      usuario: true,
      Associacao: true,
    },
  });

  if (!perfilExistente) {
    return json({
      errors: { data: 'Perfil não encontrado.' },
    });
  }

  // Verificar se email mudou e se já existe
  if (email !== perfilExistente.usuario.email) {
    let usuarioSeExistir = await pegarUsuarioPeloEmail(email);
    if (usuarioSeExistir) {
      return json({
        errors: { data: 'Já existe uma conta associada a este e-mail.' },
      });
    }
  }

  // Verificar se CPF mudou e se já existe
  if (cpf !== perfilExistente.cpf) {
    let perfilSeExistir = await perfilPorCpf(cpf);
    if (perfilSeExistir) {
      return json({
        errors: { data: 'Já existe uma conta associada a este CPF.' },
      });
    }
  }

  // Atualizar usuário
  const usuario = await atualizarUsuario(perfilExistente.usuarioId, email, papel);

  if (!usuario) {
    return json({
      errors: { data: 'Erro ao atualizar usuário. Tente novamente.' },
    });
  }

  // Atualizar perfil
  const perfil = await atualizarPerfil(perfilId, {
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
    instagram,
    linkedin,
  });

  if (!perfil) {
    return json({
      errors: { data: 'Erro ao atualizar perfil. Tente novamente.' },
    });
  }

  // Se for associado, criar ou atualizar registro de associado
  if (papel === Papel.ASSOCIADO || papel === Papel.ASSOCIADO_DEPENDENTE) {
    let associado = perfilExistente.Associacao;

    console.log('=== Processando Associado ===');
    console.log('associado existente:', associado);
    console.log('perfilId:', perfilId);
    console.log('elegivelTarifaSocial:', elegivelTarifaSocial);
    console.log('indicadoPor:', indicadoPor);

    // Se não existe associado, criar
    if (!associado) {
      associado = await criarAssociado(perfilId, undefined, elegivelTarifaSocial);
      if (!associado) {
        return json({
          errors: { data: 'Erro ao criar registro de associado. Tente novamente.' },
        });
      }
    } else {
      // Se já existe, atualizar indicação e elegibilidade usando perfilId
      await atualizarIndicacaoAssociado(perfilId, indicadoPor, elegivelTarifaSocial);
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

    await atualizarSaudeAssociado({
      quadroGeral,
      usaMedicacao,
      usaMedicacaoNome,
      usoTerapeutico,
      usoTerapeuticoRelato,
      acompanhadoPrescritor,
      acompanhadoPrescritorNome,
      acompanhadoPrescritorCrm,
      perfilId,
      associadoId: associado.id,
    });

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
        associadoId: associado.id,
        criadoPorId: perfilId,
      });
    }

    if (identificacao2) {
      await criarDocumento({
        tipo: TipoDocumento.IDENTIFICACAO,
        nome_arquivo: identificacao2,
        associadoId: associado.id,
        criadoPorId: perfilId,
      });
    }

    if (comprovanteResidencia) {
      await criarDocumento({
        tipo: TipoDocumento.COMPROVANTE_RESIDENCIA,
        nome_arquivo: comprovanteResidencia,
        associadoId: associado.id,
        criadoPorId: perfilId,
      });
    }

    if (receitaUsoCanabis) {
      await criarDocumento({
        tipo: TipoDocumento.RECEITA_MEDICA,
        nome_arquivo: receitaUsoCanabis,
        associadoId: associado.id,
        criadoPorId: perfilId,
      });
    }

    if (autorizacaoAnvisa) {
      await criarDocumento({
        tipo: TipoDocumento.AUTORIZACAO_ANVISA,
        nome_arquivo: autorizacaoAnvisa,
        associadoId: associado.id,
        criadoPorId: perfilId,
      });
    }
  }

  return json({ 
    success: true, 
    message: 'Perfil atualizado com sucesso!' 
  });
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  const perfilId = params.id;

  if (!perfilId) {
    return redirect('/app/gente');
  }

  // Buscar perfil com todas as relações
  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    include: {
      usuario: true,
      Associacao: {
        include: {
          Documentos: true,
        },
      },
    },
  });

  if (!perfil) {
    return redirect('/app/gente');
  }

  return json({ usuario, perfil });
}

type LoaderDataType = {
  usuario: Usuario;
  perfil: Perfil & {
    usuario: Usuario;
    Associacao?: Associado & {
      Documentos: Documentos[];
    };
  };
};

const EditarPerfil = () => {
  const { usuario, perfil } = useLoaderData<LoaderDataType>();
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [papelSelecionado, setPapelSelecionado] = useState<Papel>(perfil.usuario.papel);
  const [endereco, setEndereco] = useState({});
  const [formAlterado, setFormAlterado] = useState(false);
  
  // Estados para campos condicionais de saúde
  const [quadroGeral, setQuadroGeral] = useState(perfil.Associacao?.saude_quadro_geral || '');
  const [usaMedicacao, setUsaMedicacao] = useState(perfil.Associacao?.saude_uso_medicacao || false);
  const [medicacaoNome, setMedicacaoNome] = useState(perfil.Associacao?.saude_uso_medicacao_nome || '');
  const [usoTerapeutico, setUsoTerapeutico] = useState(perfil.Associacao?.saude_uso_terapeutico_canabis || false);
  const [relatoUsoTerapeutico, setRelatoUsoTerapeutico] = useState(perfil.Associacao?.saude_uso_terapeutico_canabis_experiencia || '');
  const [acompanhadoPrescritor, setAcompanhadoPrescritor] = useState(perfil.Associacao?.saude_medico_prescritor || false);

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);
  const isAssociado = [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE].includes(papelSelecionado);

  useEffect(() => {
    if (actionData?.success) {
      alert(actionData.message);
      navigate(`/app/gente/${perfil.id}`);
    }
  }, [actionData, navigate, perfil.id]);

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
                <i className='las la-user-edit la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>Edição de Perfil</h2>
                <p className='text-muted mb-0'>
                  {perfil.nome_completo}
                </p>
              </div>
            </div>
          </Col>
          <Col xs='auto' className='d-flex gap-2'>
            <Button 
              variant='outline-dark'
              onClick={() => navigate(`/app/gente/${perfil.id}`)}
              className='rounded-3 px-3'
            >
              <i className='las la-arrow-left me-2' /> Voltar
            </Button>
            
            {/* Mostrar botão de salvar se houver alterações, senão mostrar botão de excluir */}
            {formAlterado ? (
              <Button 
                type='submit'
                form='formEdicaoPerfil'
                disabled={isSubmitting}
                className='rounded-3 px-3'
                style={{ backgroundColor: 'darkorchid', borderColor: 'darkorchid', color: 'white' }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Processando...
                  </>
                ) : (
                  <>
                    <i className='las la-save me-2'></i>
                    Salvar Alterações
                  </>
                )}
              </Button>
            ) : (
              <Form 
                method='post' 
                action={`/app/gente/${perfil.id}/deletar`}
                onSubmit={(e) => {
                  if (!confirm(`Tem certeza que deseja deletar o perfil de ${perfil.nome_completo}? Esta ação não pode ser desfeita e todos os dados, documentos e arquivos serão permanentemente removidos.`)) {
                    e.preventDefault();
                  }
                }}
              >
                <Button variant='danger' type='submit' className='rounded-3 px-3'>
                  <i className='las la-trash me-2' /> Excluir Perfil
                </Button>
              </Form>
            )}
          </Col>
        </Row>

        <hr />
        
        <Row>
          <Col className='pt-3'>
            <BootstrapForm 
              method='post' 
              encType='multipart/form-data' 
              id='formEdicaoPerfil'
              onChange={() => setFormAlterado(true)}
            >
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
                      <BootstrapForm.Group controlId='papel'>
                        <BootstrapForm.Label className='fw-medium'>
                          Selecione o tipo de perfil <span className='text-danger'>*</span>
                        </BootstrapForm.Label>
                        <BootstrapForm.Select
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
                        </BootstrapForm.Select>
                        <BootstrapForm.Text className='text-muted'>
                          O tipo de perfil determina as permissões e funcionalidades disponíveis
                        </BootstrapForm.Text>
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  {/* Elegibilidade para tarifa social - apenas para ASSOCIADO */}
                  {papelSelecionado === Papel.ASSOCIADO && (
                    <Row className='mt-3'>
                      <Col md={12}>
                        <BootstrapForm.Group controlId='elegivel_tarifa_social'>
                          <div className='border rounded-3 p-3 bg-light'>
                            <BootstrapForm.Check
                              type='checkbox'
                              name='elegivel_tarifa_social'
                              id='elegivel_tarifa_social'
                              label='Elegível para Tarifa Social'
                              defaultChecked={perfil.Associacao?.elegivel_tarifa_social || false}
                            />
                            <BootstrapForm.Text className='text-muted d-block mt-2'>
                              <i className='las la-info-circle me-1'></i>
                              Marque se o associado tem direito à mensalidade social (tarifa reduzida)
                            </BootstrapForm.Text>
                          </div>
                        </BootstrapForm.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              {/* Informações Básicas */}
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
                      <BootstrapForm.Group controlId='email'>
                        <BootstrapForm.Label className='fw-medium'>
                          <i className='las la-envelope text-secondary me-1'></i>
                          E-mail <span className='text-danger'>*</span>
                        </BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='email'
                          name='email'
                          placeholder='exemplo@email.com'
                          defaultValue={perfil.usuario.email}
                          required
                        />
                        <BootstrapForm.Text className='text-muted'>
                          <i className='las la-info-circle me-1'></i>
                          E-mail utilizado para acesso ao sistema
                        </BootstrapForm.Text>
                      </BootstrapForm.Group>
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
                      <BootstrapForm.Group controlId='nome_completo'>
                        <BootstrapForm.Label className='fw-medium'>
                          <i className='las la-user text-secondary me-1'></i>
                          Nome Completo <span className='text-danger'>*</span>
                        </BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='nome_completo'
                          placeholder='Ex: João da Silva Santos'
                          defaultValue={perfil.nome_completo}
                          required
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={6}>
                      <BootstrapForm.Group controlId='apelido'>
                        <BootstrapForm.Label className='fw-medium'>Nome Preferido</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='apelido'
                          placeholder='Como prefere ser chamado(a)'
                          defaultValue={perfil.apelido || ''}
                        />
                        <BootstrapForm.Text className='text-muted'>Opcional - usado em comunicações informais</BootstrapForm.Text>
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={4}>
                      <BootstrapForm.Group controlId='data_nascimento'>
                        <BootstrapForm.Label className='fw-medium'>
                          <i className='las la-calendar text-secondary me-1'></i>
                          Data de Nascimento <span className='text-danger'>*</span>
                        </BootstrapForm.Label>
                        <InputMaskClient
                          type='text'
                          name='data_nascimento'
                          id='data_nascimento'
                          autoComplete='off'
                          mask='99/99/9999'
                          maskPlaceholder={'_'}
                          placeholder='DD/MM/AAAA'
                          defaultValue={perfil.data_nascimento ? brDataFromIsoString(perfil.data_nascimento) : ''}
                          required
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={4}>
                      <BootstrapForm.Group controlId='cpf'>
                        <BootstrapForm.Label className='fw-medium'>
                          <i className='las la-id-card-alt text-secondary me-1'></i>
                          CPF <span className='text-danger'>*</span>
                        </BootstrapForm.Label>
                        <InputMaskClient
                          type='text'
                          name='cpf'
                          id='cpf'
                          autoComplete='off'
                          mask='999.999.999-99'
                          maskPlaceholder={'_'}
                          defaultValue={perfil.cpf}
                          required
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={4}>
                      <BootstrapForm.Group controlId='rg'>
                        <BootstrapForm.Label className='fw-medium'>RG</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='rg'
                          autoComplete='off'
                          defaultValue={perfil.rg || ''}
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={6}>
                      <BootstrapForm.Group controlId='nacionalidade'>
                        <BootstrapForm.Label className='fw-medium'>Nacionalidade</BootstrapForm.Label>
                        <BootstrapForm.Select name='nacionalidade' defaultValue={perfil.nacionalidade || ''}>
                          {paises.map((pais) => (
                            <option key={pais.sigla} value={pais.gentilico}>
                              {pais.nome_pais} - {pais.gentilico}
                            </option>
                          ))}
                        </BootstrapForm.Select>
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={6}>
                      <BootstrapForm.Group controlId='estado_civil'>
                        <BootstrapForm.Label className='fw-medium'>Estado Civil</BootstrapForm.Label>
                        <BootstrapForm.Select name='estado_civil' defaultValue={perfil.estado_civil || ''}>
                          <option value='Solteiro (a)'>Solteiro (a)</option>
                          <option value='Casado (a)'>Casado (a)</option>
                          <option value='Divorciado (a)'>Divorciado (a)</option>
                          <option value='Viúvo (a)'>Viúvo (a)</option>
                        </BootstrapForm.Select>
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={6}>
                      <BootstrapForm.Group controlId='sexo'>
                        <BootstrapForm.Label className='fw-medium'>Sexo</BootstrapForm.Label>
                        <BootstrapForm.Select name='sexo' defaultValue={perfil.sexo || ''}>
                          <option value='Feminino'>Feminino</option>
                          <option value='Masculino'>Masculino</option>
                          <option value='Não binário'>Não binário</option>
                        </BootstrapForm.Select>
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={6}>
                      <BootstrapForm.Group controlId='telefone'>
                        <BootstrapForm.Label className='fw-medium'>
                          <i className='las la-phone text-secondary me-1'></i>
                          Telefone / WhatsApp <span className='text-danger'>*</span>
                        </BootstrapForm.Label>
                        <InputMaskClient
                          type='text'
                          name='telefone'
                          id='telefone'
                          autoComplete='off'
                          mask='+55 (99) 9 9999-9999'
                          maskPlaceholder={'_'}
                          defaultValue={perfil.telefone}
                          required
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={4}>
                      <BootstrapForm.Group controlId='cep'>
                        <BootstrapForm.Label className='fw-medium'>CEP</BootstrapForm.Label>
                        <InputMaskClient
                          type='text'
                          name='cep'
                          id='cep'
                          autoComplete='off'
                          mask='99999-999'
                          maskPlaceholder={'_'}
                          onChange={carregarEndereco}
                          defaultValue={perfil.cep || ''}
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={8}>
                      <BootstrapForm.Group controlId='endereco_rua'>
                        <BootstrapForm.Label className='fw-medium'>Endereço</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='endereco_rua'
                          autoComplete='off'
                          defaultValue={endereco?.logradouro ?? perfil.endereco_rua ?? ''}
                          key={endereco?.logradouro ?? perfil.endereco_rua}
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={4}>
                      <BootstrapForm.Group controlId='endereco_numero'>
                        <BootstrapForm.Label className='fw-medium'>Número</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='endereco_numero'
                          autoComplete='off'
                          defaultValue={perfil.endereco_numero || ''}
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={8}>
                      <BootstrapForm.Group controlId='bairro'>
                        <BootstrapForm.Label className='fw-medium'>Bairro</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='bairro'
                          autoComplete='off'
                          defaultValue={endereco.bairro ?? perfil.endereco_bairro ?? ''}
                          key={endereco.bairro ?? perfil.endereco_bairro}
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={6}>
                      <BootstrapForm.Group controlId='cidade'>
                        <BootstrapForm.Label className='fw-medium'>Cidade</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='cidade'
                          autoComplete='off'
                          defaultValue={endereco.cidade ?? perfil.endereco_cidade ?? ''}
                          key={endereco.cidade ?? perfil.endereco_cidade}
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={6}>
                      <BootstrapForm.Group controlId='estado'>
                        <BootstrapForm.Label className='fw-medium'>Estado</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='estado'
                          autoComplete='off'
                          defaultValue={endereco.estado ?? perfil.endereco_estado ?? ''}
                          key={endereco.estado ?? perfil.endereco_estado}
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <BootstrapForm.Group controlId='endereco_complemento' className='mb-3'>
                    <BootstrapForm.Label className='fw-medium'>Complemento</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type='text'
                      name='endereco_complemento'
                      autoComplete='off'
                      defaultValue={perfil.endereco_complemento || ''}
                    />
                  </BootstrapForm.Group>

                  <Row className='mb-3'>
                    <Col md={6}>
                      <BootstrapForm.Group controlId='instagram'>
                        <BootstrapForm.Label className='fw-medium'>Instagram</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='instagram'
                          autoComplete='off'
                          placeholder='Link ou @'
                          defaultValue={perfil.redes_instagram || ''}
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={6}>
                      <BootstrapForm.Group controlId='linkedin'>
                        <BootstrapForm.Label className='fw-medium'>LinkedIn</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='linkedin'
                          autoComplete='off'
                          placeholder='Link do perfil'
                          defaultValue={perfil.redes_linkedin || ''}
                        />
                      </BootstrapForm.Group>
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
                        <strong>Adicionar novos documentos:</strong> Selecione arquivos para adicionar novos documentos ao perfil.
                        <br />
                        <small>Formatos aceitos: JPG, PNG, PDF. Documentos existentes não serão substituídos.</small>
                      </Alert>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={6}>
                      <BootstrapForm.Group controlId='identificacao_1'>
                        <BootstrapForm.Label>Documento de identificação (frente)</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='file'
                          name='identificacao_1'
                          accept='image/*,.pdf'
                        />
                      </BootstrapForm.Group>
                    </Col>

                    <Col md={6}>
                      <BootstrapForm.Group controlId='identificacao_2'>
                        <BootstrapForm.Label>Documento de identificação (verso)</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='file'
                          name='identificacao_2'
                          accept='image/*,.pdf'
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col md={12}>
                      <BootstrapForm.Group controlId='comprovante_residencia'>
                        <BootstrapForm.Label>Comprovante de residência</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='file'
                          name='comprovante_residencia'
                          accept='image/*,.pdf'
                        />
                      </BootstrapForm.Group>
                    </Col>
                  </Row>

                  {/* Informação sobre indicação */}
                  <Row className='mb-3'>
                    <Col md={6}>
                      <BootstrapForm.Group controlId='indicado_por'>
                        <BootstrapForm.Label>Indicado por</BootstrapForm.Label>
                        <BootstrapForm.Control
                          type='text'
                          name='indicado_por'
                          placeholder='Nome de quem indicou'
                          defaultValue={perfil.Associacao?.indicado_por || ''}
                        />
                      </BootstrapForm.Group>
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
                  <BootstrapForm.Group controlId='quadro_geral' className='mb-3'>
                    <BootstrapForm.Label>Quadro geral de saúde</BootstrapForm.Label>
                    <BootstrapForm.Control
                      as='textarea'
                      name='quadro_geral'
                      rows={3}
                      maxLength={2048}
                      placeholder='Descreva os diagnósticos de patologias existentes'
                      onInput={resizeTextarea}
                      onChange={(e) => setQuadroGeral(e.target.value)}
                      defaultValue={quadroGeral}
                    />
                    <BootstrapForm.Text className='text-muted'>
                      {quadroGeral.length} de até 2048 caracteres
                    </BootstrapForm.Text>
                  </BootstrapForm.Group>

                  <BootstrapForm.Group className='mb-3'>
                    <BootstrapForm.Label>Usa alguma medicação?</BootstrapForm.Label>
                    <div>
                      <BootstrapForm.Check
                        inline
                        type='radio'
                        label='Não'
                        name='usa_medicacao'
                        id='usa_medicacao_nao'
                        value='false'
                        onChange={() => setUsaMedicacao(false)}
                        defaultChecked={!usaMedicacao}
                      />
                      <BootstrapForm.Check
                        inline
                        type='radio'
                        label='Sim'
                        name='usa_medicacao'
                        id='usa_medicacao_sim'
                        value='true'
                        onChange={() => setUsaMedicacao(true)}
                        defaultChecked={usaMedicacao}
                      />
                    </div>
                  </BootstrapForm.Group>

                  {usaMedicacao && (
                    <BootstrapForm.Group controlId='medicacao_nome' className='mb-3'>
                      <BootstrapForm.Label>Nome das medicações</BootstrapForm.Label>
                      <BootstrapForm.Control
                        type='text'
                        name='medicacao_nome'
                        placeholder='Escreva os nomes das medicações que você faz uso'
                        defaultValue={medicacaoNome}
                        onChange={(e) => setMedicacaoNome(e.target.value)}
                      />
                    </BootstrapForm.Group>
                  )}

                  <BootstrapForm.Group className='mb-3'>
                    <BootstrapForm.Label>Já fez uso terapêutico com a cannabis?</BootstrapForm.Label>
                    <div>
                      <BootstrapForm.Check
                        inline
                        type='radio'
                        label='Não'
                        name='uso_terapeutico'
                        id='uso_terapeutico_nao'
                        value='false'
                        onChange={() => setUsoTerapeutico(false)}
                        defaultChecked={!usoTerapeutico}
                      />
                      <BootstrapForm.Check
                        inline
                        type='radio'
                        label='Sim'
                        name='uso_terapeutico'
                        id='uso_terapeutico_sim'
                        value='true'
                        onChange={() => setUsoTerapeutico(true)}
                        defaultChecked={usoTerapeutico}
                      />
                    </div>
                  </BootstrapForm.Group>

                  {usoTerapeutico && (
                    <BootstrapForm.Group controlId='relato_uso_terapeutico' className='mb-3'>
                      <BootstrapForm.Label>Relato da experiência</BootstrapForm.Label>
                      <BootstrapForm.Control
                        as='textarea'
                        name='relato_uso_terapeutico'
                        rows={2}
                        maxLength={512}
                        placeholder='Faça um breve relato da sua experiência com o uso terapêutico da cannabis'
                        onInput={resizeTextarea}
                        onChange={(e) => setRelatoUsoTerapeutico(e.target.value)}
                        defaultValue={relatoUsoTerapeutico}
                      />
                      <BootstrapForm.Text className='text-muted'>
                        {relatoUsoTerapeutico.length} de até 512 caracteres
                      </BootstrapForm.Text>
                    </BootstrapForm.Group>
                  )}

                  <BootstrapForm.Group className='mb-3'>
                    <BootstrapForm.Label>É acompanhado por médico prescritor de cannabis?</BootstrapForm.Label>
                    <div>
                      <BootstrapForm.Check
                        inline
                        type='radio'
                        label='Não'
                        name='acompanhado_prescritor'
                        id='acompanhado_prescritor_nao'
                        value='false'
                        onChange={() => setAcompanhadoPrescritor(false)}
                        defaultChecked={!acompanhadoPrescritor}
                      />
                      <BootstrapForm.Check
                        inline
                        type='radio'
                        label='Sim'
                        name='acompanhado_prescritor'
                        id='acompanhado_prescritor_sim'
                        value='true'
                        onChange={() => setAcompanhadoPrescritor(true)}
                        defaultChecked={acompanhadoPrescritor}
                      />
                    </div>
                  </BootstrapForm.Group>

                  {acompanhadoPrescritor && (
                    <>
                      <Row className='mb-3'>
                        <Col md={6}>
                          <BootstrapForm.Group controlId='nome_prescritor'>
                            <BootstrapForm.Label>Nome do profissional</BootstrapForm.Label>
                            <BootstrapForm.Control
                              type='text'
                              name='nome_prescritor'
                              defaultValue={perfil.Associacao?.saude_medico_prescritor_nome || ''}
                            />
                          </BootstrapForm.Group>
                        </Col>

                        <Col md={6}>
                          <BootstrapForm.Group controlId='crm_prescritor'>
                            <BootstrapForm.Label>CRM</BootstrapForm.Label>
                            <BootstrapForm.Control
                              type='text'
                              name='crm_prescritor'
                              defaultValue={perfil.Associacao?.saude_medico_prescritor_crm || ''}
                            />
                          </BootstrapForm.Group>
                        </Col>
                      </Row>

                      <Row className='mb-3'>
                        <Col md={6}>
                          <BootstrapForm.Group controlId='receita_uso_canabis'>
                            <BootstrapForm.Label>Receita Médica</BootstrapForm.Label>
                            <BootstrapForm.Control
                              type='file'
                              name='receita_uso_canabis'
                              accept='image/*,.pdf'
                            />
                            <BootstrapForm.Text className='text-muted'>
                              Adicionar nova receita médica
                            </BootstrapForm.Text>
                          </BootstrapForm.Group>
                        </Col>

                        <Col md={6}>
                          <BootstrapForm.Group controlId='autorizacao_anvisa'>
                            <BootstrapForm.Label>Autorização da ANVISA</BootstrapForm.Label>
                            <BootstrapForm.Control
                              type='file'
                              name='autorizacao_anvisa'
                              accept='image/*,.pdf'
                            />
                            <BootstrapForm.Text className='text-muted'>
                              Adicionar nova autorização
                            </BootstrapForm.Text>
                          </BootstrapForm.Group>
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
                      onClick={() => navigate(`/app/gente/${perfil.id}`)}
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
                          <i className='las la-save me-2'></i>
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </BootstrapForm>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
};

export default EditarPerfil;
