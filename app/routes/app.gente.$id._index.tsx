//@ts-nocheck
import {
  Papel,
  Perfil,
  Usuario,
  Associado,
  Documentos,
  TipoDocumento,
} from '@prisma/client';
import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Table,
} from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { authenticator } from '~/secure/authentication.server';
import { brDataFromIsoString, brDisplayDateTime } from '~/shared/DateTime.util';
import { prisma } from '~/secure/db.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Perfil - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Visualização de perfil de usuário',
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
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
          Pagamentos: {
            orderBy: { criado_em: 'desc' },
          },
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
      Pagamentos: any[];
    };
  };
};

// Função para obter avatar baseado no papel e sexo
const obterAvatar = (nome: string, papel: Papel, sexo?: string) => {
  const seed = nome?.toLowerCase().replace(/\s/g, '') || 'user';
  
  // Determinar o estilo baseado no sexo - usando personas formais
  let style = 'thumbs'; // estilo formal e profissional
  
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
};

// Função auxiliar para obter badge do papel
const obterBadgePapel = (papel: Papel) => {
  const configs = {
    [Papel.ASSOCIADO]: { icon: 'las la-leaf', label: 'Associado', bg: 'success' },
    [Papel.ASSOCIADO_DEPENDENTE]: { icon: 'las la-user', label: 'Dependente', bg: 'info' },
    [Papel.ADMIN]: { icon: 'las la-crown', label: 'Admin', bg: 'danger' },
    [Papel.SECRETARIA]: { icon: 'las la-clipboard-list', label: 'Secretaria', bg: 'warning' },
    [Papel.SAUDE]: { icon: 'las la-stethoscope', label: 'Saúde', bg: 'primary' },
  };
  return configs[papel] || { icon: 'las la-circle', label: papel, bg: 'secondary' };
};

// Função para obter label do tipo de documento
const obterLabelDocumento = (tipo: TipoDocumento) => {
  const labels = {
    [TipoDocumento.IDENTIFICACAO]: 'Documento de Identificação',
    [TipoDocumento.IDENTIFICACAO_RESPONSAVEL]: 'Doc. ID Responsável',
    [TipoDocumento.COMPROVANTE_RESIDENCIA]: 'Comprovante de Residência',
    [TipoDocumento.RECEITA_MEDICA]: 'Receita Médica',
    [TipoDocumento.AUTORIZACAO_ANVISA]: 'Autorização ANVISA',
    [TipoDocumento.NAO_IDENTIFICADO]: 'Não Identificado',
  };
  return labels[tipo] || tipo;
};

const PerfilDetalhes = () => {
  const { usuario, perfil } = useLoaderData<LoaderDataType>();
  const navigate = useNavigate();

  const badgeInfo = obterBadgePapel(perfil.usuario.papel);
  const isAssociado = [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE].includes(perfil.usuario.papel);
  const avatarUrl = obterAvatar(perfil.nome_completo, perfil.usuario.papel, perfil.sexo);

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className='app-content'>
        {/* Header com navegação */}
        <Row className='align-items-center mt-3 mb-4'>
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-user la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>Detalhes do Perfil</h2>
                <p className='text-muted mb-0'>{perfil.nome_completo}</p>
              </div>
            </div>
          </Col>
          <Col xs='auto' className='d-flex gap-2'>
            <Button 
              variant='outline-dark'
              onClick={() => navigate('/app/gente')}
              className='rounded-3 px-3'
            >
              <i className='las la-arrow-left me-2' /> Voltar
            </Button>
            <Button 
              onClick={() => navigate(`/app/gente/${perfil.id}/editar`)}
              className='rounded-3 px-3'
              style={{ backgroundColor: 'darkorchid', borderColor: 'darkorchid', color: 'white' }}
            >
              <i className='las la-pen me-2' /> Editar Perfil
            </Button>
          </Col>
        </Row>

        {/* Card principal com foto e informações básicas */}
        <Card className='mb-4 shadow-sm border-0'>
          <Card.Body>
            <Row>
              <Col md={3} className='text-center mb-3 mb-md-0'>
                <div 
                  className='rounded-circle mx-auto mb-3' 
                  style={{
                    width: '160px',
                    height: '160px',
                    overflow: 'hidden',
                    border: '4px solid #f0f0f0',
                  }}
                >
                  <img 
                    src={avatarUrl} 
                    alt={perfil.nome_completo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <Badge 
                  bg={badgeInfo.bg} 
                  className='d-inline-flex align-items-center gap-1 px-3 py-2'
                  style={{ fontSize: '0.9rem' }}
                >
                  <i className={badgeInfo.icon} />
                  <span>{badgeInfo.label}</span>
                </Badge>
              </Col>

              <Col md={9}>
                <h3 className='mb-1'>{perfil.nome_completo}</h3>
                {perfil.apelido && (
                  <p className='text-muted mb-3'>"{perfil.apelido}"</p>
                )}
                
                <Row className='g-3'>
                  <Col md={6}>
                    <strong className='text-muted small d-block'>E-mail</strong>
                    <a href={`mailto:${perfil.usuario.email}`} className='text-decoration-none'>
                      <i className='las la-envelope me-1' /> {perfil.usuario.email}
                    </a>
                  </Col>
                  {perfil.telefone && (
                    <Col md={6}>
                      <strong className='text-muted small d-block'>Telefone</strong>
                      <a href={`tel:${perfil.telefone}`} className='text-decoration-none'>
                        <i className='las la-phone me-1' /> {perfil.telefone}
                      </a>
                    </Col>
                  )}
                  {perfil.data_nascimento && (
                    <Col md={6}>
                      <strong className='text-muted small d-block'>Data de Nascimento</strong>
                      <span><i className='las la-birthday-cake me-1' /> {brDataFromIsoString(perfil.data_nascimento)}</span>
                    </Col>
                  )}
                  {perfil.sexo && (
                    <Col md={6}>
                      <strong className='text-muted small d-block'>Sexo</strong>
                      <span>{perfil.sexo}</span>
                    </Col>
                  )}
                  <Col md={12}>
                    <strong className='text-muted small d-block'>Cadastrado em</strong>
                    <span className='text-muted'>{brDisplayDateTime(perfil.criado_em)}</span>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row>
          {/* Coluna esquerda - Informações pessoais */}
          <Col lg={6}>
            {/* Documentos pessoais */}
            <Card className='mb-4 shadow-sm border-0'>
              <Card.Header className='bg-white border-bottom'>
                <h5 className='mb-0'><i className='las la-id-card me-2' />Documentos Pessoais</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant='flush'>
                  <ListGroup.Item className='px-0'>
                    <Row className='align-items-center'>
                      <Col xs={4} className='text-muted small'>CPF</Col>
                      <Col xs={8} className='font-monospace'>
                        {perfil.cpf || '-'}
                      </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item className='px-0'>
                    <Row className='align-items-center'>
                      <Col xs={4} className='text-muted small'>RG</Col>
                      <Col xs={8}>{perfil.rg || '-'}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item className='px-0'>
                    <Row className='align-items-center'>
                      <Col xs={4} className='text-muted small'>Nacionalidade</Col>
                      <Col xs={8}>{perfil.nacionalidade || '-'}</Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item className='px-0'>
                    <Row className='align-items-center'>
                      <Col xs={4} className='text-muted small'>Estado Civil</Col>
                      <Col xs={8}>{perfil.estado_civil || '-'}</Col>
                    </Row>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Endereço */}
            <Card className='mb-4 shadow-sm border-0'>
              <Card.Header className='bg-white border-bottom'>
                <h5 className='mb-0'><i className='las la-map-marker me-2' />Endereço</h5>
              </Card.Header>
              <Card.Body>
                {perfil.endereco_rua || perfil.cep ? (
                  <ListGroup variant='flush'>
                    {perfil.cep && (
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>CEP</Col>
                          <Col xs={8}>{perfil.cep}</Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                    {perfil.endereco_rua && (
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Logradouro</Col>
                          <Col xs={8}>
                            {perfil.endereco_rua}
                            {perfil.endereco_numero && `, ${perfil.endereco_numero}`}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                    {perfil.endereco_complemento && (
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Complemento</Col>
                          <Col xs={8}>{perfil.endereco_complemento}</Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                    {perfil.endereco_bairro && (
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Bairro</Col>
                          <Col xs={8}>{perfil.endereco_bairro}</Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                    {perfil.endereco_cidade && (
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Cidade</Col>
                          <Col xs={8}>{perfil.endereco_cidade} - {perfil.endereco_estado || ''}</Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                ) : (
                  <p className='text-muted mb-0'>Endereço não informado</p>
                )}
              </Card.Body>
            </Card>

            {/* Redes Sociais */}
            {(perfil.redes_instagram || perfil.redes_linkedin) && (
              <Card className='mb-4 shadow-sm border-0'>
                <Card.Header className='bg-white border-bottom'>
                  <h5 className='mb-0'><i className='las la-share-alt me-2' />Redes Sociais</h5>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant='flush'>
                    {perfil.redes_instagram && (
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Instagram</Col>
                          <Col xs={8}>
                            <a 
                              href={perfil.redes_instagram.startsWith('http') 
                                ? perfil.redes_instagram 
                                : `https://instagram.com/${perfil.redes_instagram.replace('@', '')}`
                              }
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-decoration-none'
                            >
                              {perfil.redes_instagram}
                            </a>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                    {perfil.redes_linkedin && (
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>LinkedIn</Col>
                          <Col xs={8}>
                            <a 
                              href={perfil.redes_linkedin}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-decoration-none'
                            >
                              Acessar perfil
                            </a>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Coluna direita - Informações de associação (se aplicável) */}
          <Col lg={6}>
            {isAssociado && perfil.Associacao ? (
              <>
                {/* Informações de Saúde */}
                <Card className='mb-4 shadow-sm border-0'>
                  <Card.Header className='bg-white border-bottom'>
                    <h5 className='mb-0'><i className='las la-stethoscope me-2' />Informações de Saúde</h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant='flush'>
                      <ListGroup.Item className='px-0'>
                        <strong className='text-muted small d-block mb-2'>Quadro Geral</strong>
                        <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>
                          {perfil.Associacao.saude_quadro_geral || 'Não informado'}
                        </p>
                      </ListGroup.Item>

                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={6} className='text-muted small'>Usa medicação?</Col>
                          <Col xs={6}>
                            {perfil.Associacao.saude_uso_medicacao ? (
                              <Badge bg='info'>Sim</Badge>
                            ) : (
                              <Badge bg='secondary'>Não</Badge>
                            )}
                          </Col>
                        </Row>
                        {perfil.Associacao.saude_uso_medicacao && perfil.Associacao.saude_uso_medicacao_nome && (
                          <div className='mt-2'>
                            <small className='text-muted'>Medicações: </small>
                            <span>{perfil.Associacao.saude_uso_medicacao_nome}</span>
                          </div>
                        )}
                      </ListGroup.Item>

                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={6} className='text-muted small'>Uso terapêutico de cannabis?</Col>
                          <Col xs={6}>
                            {perfil.Associacao.saude_uso_terapeutico_canabis ? (
                              <Badge bg='success'>Sim</Badge>
                            ) : (
                              <Badge bg='secondary'>Não</Badge>
                            )}
                          </Col>
                        </Row>
                        {perfil.Associacao.saude_uso_terapeutico_canabis && 
                         perfil.Associacao.saude_uso_terapeutico_canabis_experiencia && (
                          <div className='mt-2'>
                            <small className='text-muted'>Experiência: </small>
                            <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>
                              {perfil.Associacao.saude_uso_terapeutico_canabis_experiencia}
                            </p>
                          </div>
                        )}
                      </ListGroup.Item>

                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={6} className='text-muted small'>Médico prescritor?</Col>
                          <Col xs={6}>
                            {perfil.Associacao.saude_medico_prescritor ? (
                              <Badge bg='primary'>Sim</Badge>
                            ) : (
                              <Badge bg='secondary'>Não</Badge>
                            )}
                          </Col>
                        </Row>
                        {perfil.Associacao.saude_medico_prescritor && (
                          <div className='mt-2'>
                            {perfil.Associacao.saude_medico_prescritor_nome && (
                              <div>
                                <small className='text-muted'>Nome: </small>
                                <span>{perfil.Associacao.saude_medico_prescritor_nome}</span>
                              </div>
                            )}
                            {perfil.Associacao.saude_medico_prescritor_crm && (
                              <div>
                                <small className='text-muted'>CRM: </small>
                                <span>{perfil.Associacao.saude_medico_prescritor_crm}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>

                {/* Status da Associação */}
                <Card className='mb-4 shadow-sm border-0'>
                  <Card.Header className='bg-white border-bottom'>
                    <h5 className='mb-0'><i className='las la-user-check me-2' />Status da Associação</h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant='flush'>
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Tipo</Col>
                          <Col xs={8}>
                            <Badge bg={perfil.Associacao.tipo_associado === 'MEDICINAL' ? 'primary' : 'secondary'}>
                              {perfil.Associacao.tipo_associado}
                            </Badge>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Status</Col>
                          <Col xs={8}>
                            <Badge bg={
                              perfil.Associacao.status === 'ASSOCIADO' ? 'success' :
                              perfil.Associacao.status === 'EM_ANALISE' ? 'info' :
                              perfil.Associacao.status === 'AGUARDANDO_PAGAMENTO' ? 'warning' :
                              perfil.Associacao.status === 'AGUARDANDO_ASSINATURA' ? 'warning' :
                              'secondary'
                            }>
                              {perfil.Associacao.status === 'AGUARDANDO_CADASTRO'
                                ? 'Aguardando Cadastro'
                                : perfil.Associacao.status === 'AGUARDANDO_PAGAMENTO'
                                ? 'Aguardando Pagamento'
                                : perfil.Associacao.status === 'AGUARDANDO_ASSINATURA'
                                ? 'Aguardando Assinatura'
                                : perfil.Associacao.status === 'EM_ANALISE'
                                ? 'Em Análise'
                                : perfil.Associacao.status}
                            </Badge>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                      <ListGroup.Item className='px-0'>
                        <Row className='align-items-center'>
                          <Col xs={4} className='text-muted small'>Elegível Tarifa Social</Col>
                          <Col xs={8}>
                            {perfil.Associacao.elegivel_tarifa_social ? (
                              <span className='text-success'>
                                <i className='las la-check-circle me-1' /> Sim
                              </span>
                            ) : (
                              <span className='text-muted'>
                                <i className='las la-times-circle me-1' /> Não
                              </span>
                            )}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                      {perfil.Associacao.indicado_por && (
                        <ListGroup.Item className='px-0'>
                          <Row className='align-items-center'>
                            <Col xs={4} className='text-muted small'>Indicado por</Col>
                            <Col xs={8}>{perfil.Associacao.indicado_por}</Col>
                          </Row>
                        </ListGroup.Item>
                      )}
                      {perfil.Associacao.de_acordo_termo_associativo && (
                        <ListGroup.Item className='px-0'>
                          <Row className='align-items-center'>
                            <Col xs={4} className='text-muted small'>Termo aceito</Col>
                            <Col xs={8}>
                              <i className='las la-check-circle text-success me-1' /> {brDisplayDateTime(perfil.Associacao.de_acordo_termo_associativo_em)}
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>

                {/* Histórico de Pagamentos */}
                {perfil.Associacao.Pagamentos && perfil.Associacao.Pagamentos.length > 0 && (
                  <Card className='mb-4 shadow-sm border-0'>
                    <Card.Header className='bg-white border-bottom'>
                      <h5 className='mb-0'><i className='las la-money-bill me-2' />Histórico de Pagamentos</h5>
                    </Card.Header>
                    <Card.Body>
                      <Table hover size='sm' className='mb-0'>
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Vencimento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perfil.Associacao.Pagamentos.map((pag) => (
                            <tr key={pag.id} className='align-middle'>
                              <td>
                                <small>
                                  {pag.observacao?.includes('Social') ? (
                                    <Badge bg='success' className='me-1'>
                                      <i className='las la-heart me-1' />
                                      Social
                                    </Badge>
                                  ) : null}
                                  {pag.observacao}
                                </small>
                              </td>
                              <td>
                                <small className='font-monospace'>
                                  {Number(pag.valor) === 0 ? (
                                    <span className='text-success'>R$ 0,00</span>
                                  ) : (
                                    `R$ ${Number(pag.valor).toFixed(2)}`
                                  )}
                                </small>
                              </td>
                              <td>
                                <small className='text-muted'>
                                  {brDataFromIsoString(pag.criado_em)}
                                </small>
                              </td>
                              <td>
                                <small className='text-muted'>
                                  {pag.proximo_vencimento ? brDataFromIsoString(pag.proximo_vencimento) : '-'}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                )}

                {/* Documentos Anexados */}
                {perfil.Associacao.Documentos && perfil.Associacao.Documentos.length > 0 && (
                  <Card className='mb-4 shadow-sm border-0'>
                    <Card.Header className='bg-white border-bottom'>
                      <h5 className='mb-0'><i className='las la-paperclip me-2' />Documentos Anexados</h5>
                    </Card.Header>
                    <Card.Body>
                      <Table hover size='sm' className='mb-0'>
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Data</th>
                            <th>Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perfil.Associacao.Documentos.map((doc) => (
                            <tr key={doc.id} className='align-middle'>
                              <td>
                                <small>{obterLabelDocumento(doc.tipo)}</small>
                              </td>
                              <td>
                                <small className='text-muted'>
                                  {brDisplayDateTime(doc.criado_em)}
                                </small>
                              </td>
                              <td>
                                <Button 
                                  variant='outline-primary' 
                                  size='sm'
                                  title='Visualizar documento'
                                >
                                  <i className='las la-eye' />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                )}
              </>
            ) : (
              <Card className='mb-4 shadow-sm border-0'>
                <Card.Body className='text-center py-5'>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    <i className={badgeInfo.icon} />
                  </div>
                  <h5>Perfil {badgeInfo.label}</h5>
                  <p className='text-muted mb-0'>
                    Este é um perfil interno da plataforma. Informações adicionais de saúde e documentos não se aplicam.
                  </p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
};

export default PerfilDetalhes;
