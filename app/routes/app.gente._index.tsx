//@ts-nocheck
import { Papel, Perfil, Usuario } from '@prisma/client';
import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { Badge, Button, ButtonGroup, Card, Col, Container, Dropdown, Form as BootstrapForm, InputGroup, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import pegarPerfis from '~/domain/Perfil/pegar-perfis.server';
import { authenticator } from '~/secure/authentication.server';
import { prisma } from '~/secure/db.server';
import { brDataFromIsoString, brDisplayDateTime } from '~/shared/DateTime.util';
import { addDays, addMonths } from 'date-fns';

export const meta: MetaFunction = () => {
  return [
    { title: 'Gente  - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Página de gerenciamento de Gente do app da Associação Bendita Canábica.',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Buscar perfis com informações completas de pagamento
  const perfis = await prisma.perfil.findMany({
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
    orderBy: { criado_em: 'desc' },
  });

  return json({ usuario, listaDePerfis: perfis });
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Apenas ADMIN e SECRETARIA podem registrar pagamentos
  if (usuario.papel !== Papel.ADMIN && usuario.papel !== Papel.SECRETARIA) {
    return json({ error: 'Não autorizado' }, { status: 403 });
  }

  const formData = await request.formData();
  const associadoId = formData.get('associadoId') as string;
  const tipoPagamento = formData.get('tipoPagamento') as string;
  const acao = formData.get('acao') as string;

  // Ação de aprovar associado
  if (acao === 'aprovar') {
    if (!associadoId) {
      return json({ error: 'Dados inválidos' }, { status: 400 });
    }

    try {
      await prisma.associado.update({
        where: { id: associadoId },
        data: { status: 'ASSOCIADO' },
      });
      return json({ success: true, message: 'Associado aprovado com sucesso!' });
    } catch (error) {
      console.error('Erro ao aprovar associado:', error);
      return json({ error: 'Erro ao aprovar associado' }, { status: 500 });
    }
  }

  if (!associadoId || !tipoPagamento) {
    return json({ error: 'Dados inválidos' }, { status: 400 });
  }

  // Verificar elegibilidade para pagamentos sociais
  const associado = await prisma.associado.findUnique({
    where: { id: associadoId },
    select: { elegivel_tarifa_social: true },
  });

  if (!associado) {
    return json({ error: 'Associado não encontrado' }, { status: 404 });
  }

  // Bloquear criação de pagamentos sociais para não elegíveis
  if ((tipoPagamento === 'MENSALIDADE_SOCIAL' || tipoPagamento === 'TAXA_ASSOCIATIVA_SOCIAL') 
      && !associado.elegivel_tarifa_social) {
    return json({ error: 'Este associado não é elegível para tarifa social' }, { status: 403 });
  }

  // Definir valor e observação com base no tipo de pagamento
  let valor = 0;
  let observacao = '';
  let proximoVencimento = new Date();

  switch (tipoPagamento) {
    case 'MENSALIDADE_SOCIAL':
      valor = 0;
      observacao = 'Mensalidade Social';
      proximoVencimento = addMonths(new Date(), 1);
      break;
    case 'MENSALIDADE_INTEGRAL':
      valor = 20;
      observacao = 'Mensalidade';
      proximoVencimento = addMonths(new Date(), 1);
      break;
    case 'TAXA_ASSOCIATIVA':
      valor = 50;
      observacao = 'Taxa';
      proximoVencimento = addMonths(new Date(), 1);
      break;
    case 'TAXA_ASSOCIATIVA_SOCIAL':
      valor = 0;
      observacao = 'Taxa Social';
      proximoVencimento = addMonths(new Date(), 1);
      break;
    default:
      return json({ error: 'Tipo de pagamento inválido' }, { status: 400 });
  }

  try {
    await prisma.pagamento.create({
      data: {
        associadoId,
        valor,
        observacao,
        proximo_vencimento: proximoVencimento,
      },
    });

    // Se for taxa associativa (social ou integral), atualizar status para EM_ANALISE
    if (tipoPagamento === 'TAXA_ASSOCIATIVA' || tipoPagamento === 'TAXA_ASSOCIATIVA_SOCIAL') {
      await prisma.associado.update({
        where: { id: associadoId },
        data: { status: 'EM_ANALISE' },
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return json({ error: 'Erro ao criar pagamento' }, { status: 500 });
  }
}

type UserLoaderDataType = {
  usuario: Usuario;
  listaDePerfis: Perfil[] | null;
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

const Gente = () => {
  const { usuario, listaDePerfis } = useLoaderData<UserLoaderDataType>();

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPapel, setFiltroPapel] = useState('');

  // Aplicar filtros
  const perfisFiltrados = listaDePerfis?.filter((perfil) => {
    const matchNome =
      !filtroNome ||
      perfil.nome_completo?.toLowerCase().includes(filtroNome.toLowerCase()) ||
      perfil.apelido?.toLowerCase().includes(filtroNome.toLowerCase()) ||
      perfil.usuario.email?.toLowerCase().includes(filtroNome.toLowerCase());
    const matchPapel = !filtroPapel || perfil.usuario.papel === filtroPapel;
    return matchNome && matchPapel;
  });

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className='app-content'>
        <Row className='align-items-center mt-3 mb-4'>
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-users la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>Gestão de Pessoas</h2>
                <p className='text-muted mb-0'>Gerencie perfis e informações de usuários</p>
              </div>
            </div>
          </Col>
          <Col xs='auto'>
            <Button
              as={Link}
              to='/app/gente/novo'
              className='rounded-3 px-3'
              style={{ backgroundColor: 'darkorchid', borderColor: 'darkorchid', color: 'white' }}
            >
              <i className='las la-plus me-2' />
              Nova Pessoa
            </Button>
          </Col>
        </Row>

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
                      placeholder='Nome, apelido ou e-mail...'
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
                <BootstrapForm.Group controlId='filterPapel'>
                  <BootstrapForm.Label className='small text-muted mb-1'>Tipo de Perfil</BootstrapForm.Label>
                  <BootstrapForm.Select value={filtroPapel} onChange={(e) => setFiltroPapel(e.target.value)}>
                    <option value=''>Todos os perfis</option>
                    <option value={Papel.ASSOCIADO}>Associado</option>
                    <option value={Papel.ASSOCIADO_DEPENDENTE}>Dependente</option>
                    <option value={Papel.ADMIN}>Administrador</option>
                    <option value={Papel.SECRETARIA}>Secretaria</option>
                    <option value={Papel.SAUDE}>Saúde</option>
                  </BootstrapForm.Select>
                </BootstrapForm.Group>
              </Col>

              <Col xs={12} md={3} lg={5} className='d-flex gap-2 justify-content-md-end flex-wrap'>
                <Button variant='outline-secondary' as={Link} to='/app/gente/importar' className='flex-grow-1 flex-md-grow-0'>
                  <i className='las la-file-import me-1' /> Importar
                </Button>
                <Button 
                  variant='outline-secondary' 
                  className='flex-grow-1 flex-md-grow-0'
                  onClick={() => window.open('/app/gente/exportar', '_blank')}
                >
                  <i className='las la-file-pdf me-1' /> Exportar PDF
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {perfisFiltrados && perfisFiltrados.length > 0 && (
          <div className='mb-3 d-flex align-items-center gap-2'>
            <Badge bg='secondary' className='px-2 py-1'>
              {perfisFiltrados.length} {perfisFiltrados.length === 1 ? 'perfil' : 'perfis'}
            </Badge>
            {(filtroNome || filtroPapel) && <small className='text-muted'>de {listaDePerfis?.length} total</small>}
          </div>
        )}
        <Card className='shadow-sm border-0'>
          <Table hover className='mb-0'>
            <thead className='table-light'>
              <tr>
                <th style={{ width: '140px' }}>Papel</th>
                <th>Nome</th>
                <th>E-mail / Telefone</th>
                <th>Status</th>
                <th>Tipo</th>
                <th>Docs</th>
                <th>Indicado por</th>
                <th>Termo</th>
                <th>Pagamento</th>
                <th>Cadastrado em</th>
                <th style={{ width: '140px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!perfisFiltrados || perfisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className='text-center py-5'>
                    <div className='text-muted'>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        <i className='las la-inbox' />
                      </div>
                      <p className='mb-2'>{!listaDePerfis ? 'Nenhum perfil cadastrado' : 'Nenhum perfil encontrado com os filtros aplicados'}</p>
                      {(filtroNome || filtroPapel) && (
                        <Button
                          variant='link'
                          onClick={() => {
                            setFiltroNome('');
                            setFiltroPapel('');
                          }}
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                perfisFiltrados.map((perfil) => {
                  const badgeInfo = obterBadgePapel(perfil.usuario.papel);
                  const isAssociado = perfil.usuario.papel === Papel.ASSOCIADO || perfil.usuario.papel === Papel.ASSOCIADO_DEPENDENTE;
                  const qtdDocumentos = perfil.Associacao?.Documentos?.length || 0;
                  const statusAssociacao = perfil.Associacao?.status || '-';
                  const tipoAssociado = perfil.Associacao?.tipo_associado || '-';
                  const termoAceito = perfil.Associacao?.de_acordo_termo_associativo;
                  const indicadoPor = perfil.Associacao?.indicado_por;
                  const pagamentoMesAtual = perfil.Associacao?.Pagamentos?.length > 0;
                  const isAdminOuSecretaria = usuario.papel === Papel.ADMIN || usuario.papel === Papel.SECRETARIA;

                  return (
                    <tr key={perfil.id} className='align-middle'>
                      <td>
                        <Badge bg={badgeInfo.bg} className='d-inline-flex align-items-center gap-1'>
                          <i className={badgeInfo.icon} />
                          <span>{badgeInfo.label}</span>
                        </Badge>
                      </td>
                      <td>
                        <div>
                          <strong>{perfil.nome_completo}</strong>
                          {perfil.apelido && <div className='text-muted small'>@{perfil.apelido}</div>}
                        </div>
                      </td>
                      <td>
                        <div>
                          <a href={`mailto:${perfil.usuario.email}`} className='text-decoration-none d-block text-truncate' style={{ maxWidth: '200px' }}>
                            <i className='las la-envelope me-1' />{perfil.usuario.email}
                          </a>
                          {perfil.telefone && (
                            <a href={`tel:${perfil.telefone}`} className='text-decoration-none text-muted small d-block'>
                              <i className='las la-phone me-1' />{perfil.telefone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        {isAssociado ? (
                          <Badge
                            bg={
                              statusAssociacao === 'ASSOCIADO'
                                ? 'success'
                                : statusAssociacao === 'EM_ANALISE'
                                ? 'info'
                                : statusAssociacao === 'AGUARDANDO_PAGAMENTO'
                                ? 'warning'
                                : statusAssociacao === 'AGUARDANDO_ASSINATURA'
                                ? 'warning'
                                : statusAssociacao === 'AGUARDANDO_CADASTRO'
                                ? 'secondary'
                                : 'light'
                            }
                          >
                            {statusAssociacao === 'AGUARDANDO_CADASTRO'
                              ? 'Aguard. Cadastro'
                              : statusAssociacao === 'AGUARDANDO_PAGAMENTO'
                              ? 'Aguard. Pagamento'
                              : statusAssociacao === 'AGUARDANDO_ASSINATURA'
                              ? 'Aguard. Assinatura'
                              : statusAssociacao === 'EM_ANALISE'
                              ? 'Em Análise'
                              : statusAssociacao === 'ASSOCIADO'
                              ? 'Associado'
                              : statusAssociacao}
                          </Badge>
                        ) : (
                          <span className='text-muted small'>-</span>
                        )}
                      </td>
                      <td>
                        {isAssociado ? (
                          <Badge bg={tipoAssociado === 'MEDICINAL' ? 'primary' : 'secondary'} className='text-uppercase'>
                            {tipoAssociado === 'MEDICINAL' ? 'Medicinal' : 'Apoiador'}
                          </Badge>
                        ) : (
                          <span className='text-muted small'>-</span>
                        )}
                      </td>
                      <td className='text-center'>
                        {isAssociado ? (
                          <span className='d-inline-flex align-items-center gap-1'>
                            <i className='las la-paperclip' />
                            <span>{qtdDocumentos}</span>
                          </span>
                        ) : (
                          <span className='text-muted small'>-</span>
                        )}
                      </td>
                      <td>
                        {indicadoPor ? (
                          <span className='text-muted small'>{indicadoPor}</span>
                        ) : (
                          <span className='text-muted small'>-</span>
                        )}
                      </td>
                      <td className='text-center'>
                        {isAssociado ? (
                          termoAceito ? (
                            <i className='las la-check-circle text-success' style={{ fontSize: '1.5rem' }} title='Termo aceito' />
                          ) : (
                            <i className='las la-times-circle text-danger' style={{ fontSize: '1.5rem' }} title='Termo não aceito' />
                          )
                        ) : (
                          <span className='text-muted small'>-</span>
                        )}
                      </td>
                      <td>
                        {isAssociado && isAdminOuSecretaria ? (() => {
                          const pagamentos = perfil.Associacao?.Pagamentos || [];
                          const elegivelTarifaSocial = perfil.Associacao?.elegivel_tarifa_social;
                          
                          // Verificar se já pagou taxa associativa
                          const jaPagouTaxa = pagamentos.some(p => 
                            p.observacao?.includes('Taxa')
                          );

                          return (
                            <div className='d-flex flex-column gap-1' style={{ minWidth: '200px' }}>
                              {/* Mensalidades */}
                              <div className='d-flex gap-1'>
                                {elegivelTarifaSocial && (
                                  <Form method='post' className='flex-fill'>
                                    <input type='hidden' name='associadoId' value={perfil.Associacao?.id} />
                                    <input type='hidden' name='tipoPagamento' value='MENSALIDADE_SOCIAL' />
                                    <Button 
                                      variant='outline-success' 
                                      size='sm' 
                                      type='submit'
                                      className='w-100'
                                    >
                                      <i className='las la-heart me-1' />
                                      Mensalidade social
                                    </Button>
                                  </Form>
                                )}
                                
                                <Form method='post' className='flex-fill'>
                                  <input type='hidden' name='associadoId' value={perfil.Associacao?.id} />
                                  <input type='hidden' name='tipoPagamento' value='MENSALIDADE_INTEGRAL' />
                                  <Button 
                                    variant='outline-primary' 
                                    size='sm' 
                                    type='submit'
                                    className='w-100'
                                  >
                                    <i className='las la-dollar-sign me-1' />
                                    Mensalidade R$20
                                  </Button>
                                </Form>
                              </div>
                              
                              {/* Taxas Associativas - aparecem apenas se não foi paga */}
                              {!jaPagouTaxa && (
                                <div className='d-flex gap-1'>
                                  {elegivelTarifaSocial && (
                                    <Form method='post' className='flex-fill'>
                                      <input type='hidden' name='associadoId' value={perfil.Associacao?.id} />
                                      <input type='hidden' name='tipoPagamento' value='TAXA_ASSOCIATIVA_SOCIAL' />
                                      <Button 
                                        variant='outline-success' 
                                        size='sm' 
                                        type='submit'
                                        className='w-100'
                                      >
                                        <i className='las la-heart me-1' />
                                        Taxa social
                                      </Button>
                                    </Form>
                                  )}
                                  
                                  <Form method='post' className='flex-fill'>
                                    <input type='hidden' name='associadoId' value={perfil.Associacao?.id} />
                                    <input type='hidden' name='tipoPagamento' value='TAXA_ASSOCIATIVA' />
                                    <Button 
                                      variant='outline-warning' 
                                      size='sm' 
                                      type='submit'
                                      className='w-100'
                                    >
                                      <i className='las la-hand-holding-usd me-1' />
                                      Taxa R$50
                                    </Button>
                                  </Form>
                                </div>
                              )}
                            </div>
                          );
                        })() : isAssociado ? (
                          <span className='text-muted small'>Sem permissão</span>
                        ) : (
                          <span className='text-muted small'>-</span>
                        )}
                      </td>
                      <td className='text-muted small'>
                        {brDataFromIsoString(perfil.criado_em.toString())}
                      </td>
                      <td>
                        <div className='d-flex gap-1'>
                          {isAssociado && statusAssociacao === 'EM_ANALISE' && isAdminOuSecretaria && (
                            <Form method='post'>
                              <input type='hidden' name='associadoId' value={perfil.Associacao?.id} />
                              <input type='hidden' name='acao' value='aprovar' />
                              <Button 
                                variant='success' 
                                title='Aprovar Associado' 
                                type='submit'
                                size='sm'
                              >
                                <i className='las la-check' />
                              </Button>
                            </Form>
                          )}
                          <Button variant='outline-primary' title='Ver detalhes' as={Link} to={`/app/gente/${perfil.id}`} size='sm'>
                            <i className='las la-eye' />
                          </Button>
                          <Button variant='outline-secondary' title='Editar' as={Link} to={`/app/gente/${perfil.id}/editar`} size='sm'>
                            <i className='las la-pen' />
                          </Button>
                          <Form method='post' action={`/app/gente/${perfil.id}/deletar`} onSubmit={(e) => {
                            if (!confirm(`Tem certeza que deseja deletar o perfil de ${perfil.nome_completo}? Esta ação não pode ser desfeita e todos os dados, documentos e arquivos serão permanentemente removidos.`)) {
                              e.preventDefault();
                            }
                          }}>
                            <Button variant='outline-danger' title='Deletar' type='submit' size='sm'>
                              <i className='las la-trash' />
                            </Button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card>
      </Container>
    </LayoutRestrictArea>
  );
};

export default Gente;
