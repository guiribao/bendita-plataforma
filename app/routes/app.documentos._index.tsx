import { Documentos, TipoDocumento, Usuario, Papel } from '@prisma/client';
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { Badge, Button, Card, Col, Container, Form as BootstrapForm, InputGroup, Row } from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { authenticator } from '~/secure/authentication.server';
import { prisma } from '~/secure/db.server';
import { brDataFromIsoString } from '~/shared/DateTime.util';
import { getObjectUrlFromS3 } from '~/storage/s3.service.server';
import { RoleBasedRender } from '~/secure/protected-components';

export const meta: MetaFunction = () => {
  return [
    { title: 'Documentos - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Página de gerenciamento de documentos do app da Associação Bendita Canábica.',
    },
  ];
};

type DocumentoComRelacoes = Documentos & {
  associado: {
    perfil: {
      nome_completo: string;
      apelido: string | null;
    };
  };
  criado_por: {
    nome_completo: string;
  } | null;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Buscar TODOS os documentos (para admin/secretaria/saude)
  const documentos = await prisma.documentos.findMany({
    include: {
      associado: {
        include: {
          perfil: {
            select: {
              nome_completo: true,
              apelido: true,
            },
          },
        },
      },
      criado_por: {
        select: {
          nome_completo: true,
        },
      },
    },
    orderBy: {
      criado_em: 'desc',
    },
  });

  // Se for ASSOCIADO, buscar apenas seus próprios documentos
  let documentosAssociado = null;
  if (usuario.papel === Papel.ASSOCIADO) {
    const perfil = await prisma.perfil.findUnique({
      where: { usuarioId: usuario.id },
      include: { Associacao: true },
    });
    if (perfil?.Associacao) {
      documentosAssociado = await prisma.documentos.findMany({
        where: { associadoId: perfil.Associacao.id },
        include: {
          associado: {
            include: {
              perfil: {
                select: {
                  nome_completo: true,
                  apelido: true,
                },
              },
            },
          },
          criado_por: {
            select: {
              nome_completo: true,
            },
          },
        },
        orderBy: {
          criado_em: 'desc',
        },
      });
    }
  }

  // Gerar URLs assinadas para as thumbnails (todos os documentos)
  const documentosComUrls = await Promise.all(
    documentos.map(async (doc) => {
      let thumbnailUrl = null;
      try {
        thumbnailUrl = await getObjectUrlFromS3(doc.nome_arquivo);
      } catch (error) {
        console.error('Erro ao gerar URL do documento:', error);
      }
      return {
        ...doc,
        thumbnailUrl,
      };
    })
  );

  // Gerar URLs assinadas para as thumbnails (documentos do associado)
  const documentosAssociadoComUrls = documentosAssociado
    ? await Promise.all(
        documentosAssociado.map(async (doc) => {
          let thumbnailUrl = null;
          try {
            thumbnailUrl = await getObjectUrlFromS3(doc.nome_arquivo);
          } catch (error) {
            console.error('Erro ao gerar URL do documento:', error);
          }
          return {
            ...doc,
            thumbnailUrl,
          };
        })
      )
    : null;

  return json({ usuario, documentos: documentosComUrls, documentosAssociado: documentosAssociadoComUrls });
}

type LoaderDataType = {
  usuario: Usuario;
  documentos: (DocumentoComRelacoes & { thumbnailUrl: string | null })[];
  documentosAssociado?: (DocumentoComRelacoes & { thumbnailUrl: string | null })[] | null;
};

// Função auxiliar para obter badge do tipo de documento
const obterBadgeTipoDocumento = (tipo: TipoDocumento) => {
  const configs = {
    [TipoDocumento.IDENTIFICACAO]: { icon: 'las la-id-card', label: 'Identificação', bg: 'primary' },
    [TipoDocumento.IDENTIFICACAO_RESPONSAVEL]: { icon: 'las la-id-card-alt', label: 'ID Responsável', bg: 'info' },
    [TipoDocumento.COMPROVANTE_RESIDENCIA]: { icon: 'las la-home', label: 'Comprov. Residência', bg: 'success' },
    [TipoDocumento.RECEITA_MEDICA]: { icon: 'las la-prescription', label: 'Receita Médica', bg: 'warning' },
    [TipoDocumento.AUTORIZACAO_ANVISA]: { icon: 'las la-certificate', label: 'Aut. ANVISA', bg: 'danger' },
    [TipoDocumento.NAO_IDENTIFICADO]: { icon: 'las la-file', label: 'Não Identificado', bg: 'secondary' },
  };
  return configs[tipo] || { icon: 'las la-file', label: tipo, bg: 'secondary' };
};

const DocumentosPage = () => {
  const { usuario, documentos, documentosAssociado } = useLoaderData<LoaderDataType>();

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  if (!usuario) {
    return null;
  }

  const isAdminView = usuario.papel === Papel.ADMIN || usuario.papel === Papel.SECRETARIA || usuario.papel === Papel.SAUDE;

  // Aplicar filtros
  const documentosFiltrados = documentos?.filter((doc) => {
    const matchNome =
      !filtroNome ||
      doc.associado.perfil.nome_completo?.toLowerCase().includes(filtroNome.toLowerCase()) ||
      doc.associado.perfil.apelido?.toLowerCase().includes(filtroNome.toLowerCase()) ||
      doc.nome_arquivo?.toLowerCase().includes(filtroNome.toLowerCase());
    const matchTipo = !filtroTipo || doc.tipo === filtroTipo;
    return matchNome && matchTipo;
  });

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className='app-content'>
        <Row className='align-items-center mt-3 mb-4'>
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-folder-open la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>{isAdminView ? 'Gestão de Documentos' : 'Meus Documentos'}</h2>
                <p className='text-muted mb-0'>
                  {isAdminView ? 'Visualize e gerencie todos os documentos enviados' : 'Visualize e gerencie seus documentos'}
                </p>
              </div>
            </div>
          </Col>
          <RoleBasedRender roles={['ASSOCIADO']} userRole={usuario.papel}>
            <Col xs='auto'>
              <Button variant='primary' href='/app/documentos/novo'>
                <i className='las la-plus me-1' />
                Adicionar Documento
              </Button>
            </Col>
          </RoleBasedRender>
        </Row>

        {/* Sessão para ADMIN, SECRETARIA, SAUDE */}
        <RoleBasedRender roles={['ADMIN', 'SECRETARIA', 'SAUDE']} userRole={usuario.papel}>
          <Card className='mb-4 shadow-sm border-0'>
            <Card.Body>
              <Row className='align-items-end g-3'>
                <Col xs={12} md={5} lg={4}>
                  <BootstrapForm.Group controlId='filterNome'>
                    <BootstrapForm.Label className='small text-muted mb-1'>Buscar</BootstrapForm.Label>
                    <InputGroup>
                      <InputGroup.Text className='bg-white'>
                        <i className='las la-search text-muted' />
                      </InputGroup.Text>
                      <BootstrapForm.Control
                        type='text'
                        placeholder='Nome do associado ou arquivo...'
                        value={filtroNome}
                        onChange={(e) => setFiltroNome(e.target.value)}
                        className='border-start-0'
                      />
                      {filtroNome && (
                        <Button variant='outline-secondary' onClick={() => setFiltroNome('')} style={{ borderLeft: 0 }}>
                          ×
                        </Button>
                      )}
                    </InputGroup>
                  </BootstrapForm.Group>
                </Col>

                <Col xs={12} md={4} lg={3}>
                  <BootstrapForm.Group controlId='filterTipo'>
                    <BootstrapForm.Label className='small text-muted mb-1'>Tipo de Documento</BootstrapForm.Label>
                    <BootstrapForm.Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                      <option value=''>Todos os tipos</option>
                      <option value={TipoDocumento.IDENTIFICACAO}>Identificação</option>
                      <option value={TipoDocumento.IDENTIFICACAO_RESPONSAVEL}>ID Responsável</option>
                      <option value={TipoDocumento.COMPROVANTE_RESIDENCIA}>Comprov. Residência</option>
                      <option value={TipoDocumento.RECEITA_MEDICA}>Receita Médica</option>
                      <option value={TipoDocumento.AUTORIZACAO_ANVISA}>Aut. ANVISA</option>
                      <option value={TipoDocumento.NAO_IDENTIFICADO}>Não Identificado</option>
                    </BootstrapForm.Select>
                  </BootstrapForm.Group>
                </Col>

                <Col xs={12} md={3} lg={5} className='d-flex gap-2 justify-content-md-end'>
                  {(filtroNome || filtroTipo) && (
                    <Button
                      variant='outline-secondary'
                      onClick={() => {
                        setFiltroNome('');
                        setFiltroTipo('');
                      }}
                    >
                      <i className='las la-times me-1' /> Limpar Filtros
                    </Button>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {documentosFiltrados && documentosFiltrados.length > 0 && (
            <div className='mb-3 d-flex align-items-center gap-2'>
              <Badge bg='secondary' className='px-2 py-1'>
                {documentosFiltrados.length} {documentosFiltrados.length === 1 ? 'documento' : 'documentos'}
              </Badge>
              {(filtroNome || filtroTipo) && <small className='text-muted'>de {documentos?.length} total</small>}
            </div>
          )}

          {!documentosFiltrados || documentosFiltrados.length === 0 ? (
            <Card className='shadow-sm border-0'>
              <Card.Body className='text-center py-5'>
                <div className='text-muted'>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    <i className='las la-file-alt' />
                  </div>
                  <p className='mb-2'>
                    {!documentos || documentos.length === 0 ? 'Nenhum documento cadastrado' : 'Nenhum documento encontrado com os filtros aplicados'}
                  </p>
                  {(filtroNome || filtroTipo) && (
                    <Button
                      variant='link'
                      onClick={() => {
                        setFiltroNome('');
                        setFiltroTipo('');
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Row className='g-4'>
              {documentosFiltrados.map((doc) => {
                const badgeInfo = obterBadgeTipoDocumento(doc.tipo);
                const isPdf = doc.nome_arquivo?.toLowerCase().endsWith('.pdf');

                return (
                  <Col key={doc.id} xs={12} sm={6} md={4} lg={3}>
                    <Card className='h-100 shadow-sm border-0 hover-shadow' style={{ transition: 'all 0.2s' }}>
                      {/* Thumbnail */}
                      <div
                        className='position-relative bg-light d-flex align-items-center justify-content-center'
                        style={{ height: '200px', overflow: 'hidden' }}
                      >
                        {doc.thumbnailUrl ? (
                          isPdf ? (
                            <div className='text-center'>
                              <i className='las la-file-pdf' style={{ fontSize: '4rem', color: '#dc3545' }} />
                              <div className='mt-2 small text-muted'>PDF</div>
                            </div>
                          ) : (
                            <img
                              src={doc.thumbnailUrl}
                              alt={doc.nome_arquivo}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = `
                                  <div class="text-center">
                                    <i class="las la-image" style="font-size: 4rem; color: #999"></i>
                                    <div class="mt-2 small text-muted">Erro ao carregar</div>
                                  </div>
                                `;
                                }
                              }}
                            />
                          )
                        ) : (
                          <div className='text-center'>
                            <i className='las la-file' style={{ fontSize: '4rem', color: '#999' }} />
                            <div className='mt-2 small text-muted'>Sem preview</div>
                          </div>
                        )}
                        {/* Badge de tipo no canto superior direito */}
                        <div className='position-absolute top-0 end-0 m-2'>
                          <Badge bg={badgeInfo.bg} className='d-inline-flex align-items-center gap-1'>
                            <i className={badgeInfo.icon} />
                            <span className='small'>{badgeInfo.label}</span>
                          </Badge>
                        </div>
                      </div>

                      <Card.Body>
                        {/* Nome do associado */}
                        <h6 className='mb-2'>
                          <i className='las la-user me-1 text-muted' />
                          {doc.associado.perfil.nome_completo}
                        </h6>
                        {doc.associado.perfil.apelido && <div className='text-muted small mb-2'>@{doc.associado.perfil.apelido}</div>}

                        {/* Nome do arquivo */}
                        <div className='small text-muted mb-2' style={{ wordBreak: 'break-all' }}>
                          <i className='las la-file me-1' />
                          {doc.nome_arquivo.split('/').pop()}
                        </div>

                        {/* Data de envio */}
                        <div className='small text-muted mb-2'>
                          <i className='las la-calendar me-1' />
                          {brDataFromIsoString(doc.criado_em.toString())}
                        </div>

                        {/* Enviado por */}
                        {doc.criado_por && (
                          <div className='small text-muted'>
                            <i className='las la-user-check me-1' />
                            Enviado por: {doc.criado_por.nome_completo}
                          </div>
                        )}
                      </Card.Body>

                      <Card.Footer className='bg-white border-top-0 pt-0'>
                        <div className='d-flex gap-2'>
                          {doc.thumbnailUrl && (
                            <Button variant='outline-primary' size='sm' className='flex-grow-1' onClick={() => window.open(doc.thumbnailUrl!, '_blank')}>
                              <i className='las la-eye me-1' />
                              Visualizar
                            </Button>
                          )}
                          {doc.thumbnailUrl && (
                            <Button variant='outline-secondary' size='sm' as='a' href={doc.thumbnailUrl} download>
                              <i className='las la-download' />
                            </Button>
                          )}
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </RoleBasedRender>

        {/* Sessão para ASSOCIADO - apenas seus próprios documentos */}
        <RoleBasedRender roles={['ASSOCIADO']} userRole={usuario.papel}>
          {!documentosAssociado || documentosAssociado.length === 0 ? (
            <Card className='shadow-sm border-0'>
              <Card.Body className='text-center py-5'>
                <div className='text-muted'>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    <i className='las la-file-alt' />
                  </div>
                  <p className='mb-3'>Você ainda não enviou nenhum documento</p>
                  <Button variant='primary' href='/app/documentos/novo'>
                    <i className='las la-plus me-1' />
                    Enviar Primeiro Documento
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <>
              <div className='mb-3 d-flex align-items-center gap-2'>
                <Badge bg='secondary' className='px-2 py-1'>
                  {documentosAssociado.length} {documentosAssociado.length === 1 ? 'documento' : 'documentos'}
                </Badge>
              </div>
              <Row className='g-4'>
                {documentosAssociado.map((doc) => {
                  const badgeInfo = obterBadgeTipoDocumento(doc.tipo);
                  const isPdf = doc.nome_arquivo?.toLowerCase().endsWith('.pdf');

                  return (
                    <Col key={doc.id} xs={12} sm={6} md={4} lg={3}>
                      <Card className='h-100 shadow-sm border-0 hover-shadow' style={{ transition: 'all 0.2s' }}>
                        {/* Thumbnail */}
                        <div
                          className='position-relative bg-light d-flex align-items-center justify-content-center'
                          style={{ height: '200px', overflow: 'hidden' }}
                        >
                          {doc.thumbnailUrl ? (
                            isPdf ? (
                              <div className='text-center'>
                                <i className='las la-file-pdf' style={{ fontSize: '4rem', color: '#dc3545' }} />
                                <div className='mt-2 small text-muted'>PDF</div>
                              </div>
                            ) : (
                              <img
                                src={doc.thumbnailUrl}
                                alt={doc.nome_arquivo}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  if (target.parentElement) {
                                    target.parentElement.innerHTML = `
                                    <div class="text-center">
                                      <i class="las la-image" style="font-size: 4rem; color: #999"></i>
                                      <div class="mt-2 small text-muted">Erro ao carregar</div>
                                    </div>
                                  `;
                                  }
                                }}
                              />
                            )
                          ) : (
                            <div className='text-center'>
                              <i className='las la-file' style={{ fontSize: '4rem', color: '#999' }} />
                              <div className='mt-2 small text-muted'>Sem preview</div>
                            </div>
                          )}
                          {/* Badge de tipo no canto superior direito */}
                          <div className='position-absolute top-0 end-0 m-2'>
                            <Badge bg={badgeInfo.bg} className='d-inline-flex align-items-center gap-1'>
                              <i className={badgeInfo.icon} />
                              <span className='small'>{badgeInfo.label}</span>
                            </Badge>
                          </div>
                        </div>

                        <Card.Body>
                          {/* Nome do arquivo */}
                          <div className='small text-muted mb-2' style={{ wordBreak: 'break-all' }}>
                            <i className='las la-file me-1' />
                            {doc.nome_arquivo.split('/').pop()}
                          </div>

                          {/* Data de envio */}
                          <div className='small text-muted mb-2'>
                            <i className='las la-calendar me-1' />
                            {brDataFromIsoString(doc.criado_em.toString())}
                          </div>

                          {/* Enviado por */}
                          {doc.criado_por && (
                            <div className='small text-muted'>
                              <i className='las la-user-check me-1' />
                              Enviado por: {doc.criado_por.nome_completo}
                            </div>
                          )}
                        </Card.Body>

                        <Card.Footer className='bg-white border-top-0 pt-0'>
                          <div className='d-flex gap-2'>
                            {doc.thumbnailUrl && (
                              <Button variant='outline-primary' size='sm' className='flex-grow-1' onClick={() => window.open(doc.thumbnailUrl!, '_blank')}>
                                <i className='las la-eye me-1' />
                                Visualizar
                              </Button>
                            )}
                            {doc.thumbnailUrl && (
                              <Button variant='outline-secondary' size='sm' as='a' href={doc.thumbnailUrl} download>
                                <i className='las la-download' />
                              </Button>
                            )}
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </RoleBasedRender>
      </Container>
    </LayoutRestrictArea>
  );
};

export default DocumentosPage;
