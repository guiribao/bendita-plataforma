import { Papel, Usuario, AssociacaoStatus, TipoAssociado } from '@prisma/client';
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Badge, Card, Col, Container, Row, ProgressBar } from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { authenticator } from '~/secure/authentication.server';
import { useRootLoaderData } from '~/hooks/useRootLoaderData';
import { prisma } from '~/secure/db.server';
import { RoleBasedRender } from '~/secure/protected-components';
import { differenceInDays, isAfter } from 'date-fns';

export const meta: MetaFunction = () => {
  return [
    { title: 'Dashboard - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Dashboard do app da Associação Bendita Canábica.',
    },
  ];
};

type DashboardStats = {
  totalUsuarios: number;
  totalAssociados: number;
  associadosAtivos: number;
  associadosAguardandoCadastro: number;
  associadosEmAnalise: number;
  associadosMedicinais: number;
  associadosApoiadores: number;
  totalDocumentos: number;
  documentosPendentes: number;
  usuariosPorPapel: Record<string, number>;
  associadosPorStatus: Record<string, number>;
  documentosPorTipo: Record<string, number>;
  // Dados para profissionais de saúde
  pacientesComMedicacao: number;
  pacientesComPrescritor: number;
  pacientesComAutorizacaoAnvisa: number;
  pacientesComUsoTerapeutico: number;
  // Dados de contatos e mensagens
  totalContatos: number;
  totalMensagens: number;
  mensagensNaoLidas: number;
  contatosRecentes: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Buscar associado e último pagamento do associado (se for ASSOCIADO)
  let proximoVencimento: Date | null = null;
  if (usuario.papel === 'ASSOCIADO') {
    const perfil = await prisma.perfil.findUnique({
      where: { usuarioId: usuario.id },
      include: { Associacao: true },
    });
    if (perfil?.Associacao) {
      const ultimoPagamento = await prisma.pagamento.findFirst({
        where: { associadoId: perfil.Associacao.id },
        orderBy: { data_pagamento: 'desc' },
      });
      proximoVencimento = ultimoPagamento?.proximo_vencimento || null;
    }
  }

  // Buscar estatísticas gerais
  const totalUsuarios = await prisma.usuario.count();
  const totalAssociados = await prisma.associado.count();
  const totalDocumentos = await prisma.documentos.count();

  // Associados por status
  const associadosAtivos = await prisma.associado.count({
    where: { status: AssociacaoStatus.ASSOCIADO },
  });

  const associadosAguardandoCadastro = await prisma.associado.count({
    where: { status: AssociacaoStatus.AGUARDANDO_CADASTRO },
  });

  const associadosEmAnalise = await prisma.associado.count({
    where: { status: AssociacaoStatus.EM_ANALISE },
  });

  // Associados por tipo
  const associadosMedicinais = await prisma.associado.count({
    where: { tipo_associado: TipoAssociado.MEDICINAL },
  });

  const associadosApoiadores = await prisma.associado.count({
    where: { tipo_associado: TipoAssociado.APOIADOR },
  });

  // Usuários por papel
  const usuariosPorPapel = await prisma.usuario.groupBy({
    by: ['papel'],
    _count: true,
  });

  const usuariosPorPapelMap = usuariosPorPapel.reduce((acc, item) => {
    acc[item.papel] = item._count;
    return acc;
  }, {} as Record<string, number>);

  // Associados por status
  const associadosPorStatus = await prisma.associado.groupBy({
    by: ['status'],
    _count: true,
  });

  const associadosPorStatusMap = associadosPorStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);

  // Documentos por tipo
  const documentosPorTipo = await prisma.documentos.groupBy({
    by: ['tipo'],
    _count: true,
  });

  const documentosPorTipoMap = documentosPorTipo.reduce((acc, item) => {
    acc[item.tipo] = item._count;
    return acc;
  }, {} as Record<string, number>);

  // Documentos pendentes (associados sem documentos básicos)
  const associadosComDocumentos = await prisma.associado.findMany({
    include: {
      Documentos: true,
    },
  });

  const documentosPendentes = associadosComDocumentos.filter(
    (a) => a.Documentos.length === 0
  ).length;

  // Dados para profissionais de saúde
  const pacientesComMedicacao = await prisma.associado.count({
    where: { saude_uso_medicacao: true },
  });

  const pacientesComPrescritor = await prisma.associado.count({
    where: { saude_medico_prescritor: true },
  });

  const pacientesComAutorizacaoAnvisa = await prisma.documentos.count({
    where: { tipo: 'AUTORIZACAO_ANVISA' },
  });

  const pacientesComUsoTerapeutico = await prisma.associado.count({
    where: { saude_uso_terapeutico_canabis: true },
  });

  // Dados de contatos e mensagens (apenas para ADMIN e SECRETARIA)
  let totalContatos = 0;
  let totalMensagens = 0;
  let mensagensNaoLidas = 0;
  let contatosRecentes = 0;

  if (usuario.papel === Papel.ADMIN || usuario.papel === Papel.SECRETARIA) {
    totalContatos = await prisma.contato.count();
    totalMensagens = await prisma.mensagem.count();
    mensagensNaoLidas = await prisma.mensagem.count({
      where: { lido: false },
    });

    // Contatos criados nos últimos 7 dias
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    contatosRecentes = await prisma.contato.count({
      where: {
        criado_em: {
          gte: seteDiasAtras,
        },
      },
    });
  }

  const stats: DashboardStats = {
    totalUsuarios,
    totalAssociados,
    associadosAtivos,
    associadosAguardandoCadastro,
    associadosEmAnalise,
    associadosMedicinais,
    associadosApoiadores,
    totalDocumentos,
    documentosPendentes,
    usuariosPorPapel: usuariosPorPapelMap,
    associadosPorStatus: associadosPorStatusMap,
    documentosPorTipo: documentosPorTipoMap,
    pacientesComMedicacao,
    pacientesComPrescritor,
    pacientesComAutorizacaoAnvisa,
    pacientesComUsoTerapeutico,
    totalContatos,
    totalMensagens,
    mensagensNaoLidas,
    contatosRecentes,
  };

  // Dados detalhados do associado para o dashboard do associado
  let associadoData = null;
  if (usuario.papel === 'ASSOCIADO') {
    const perfil = await prisma.perfil.findUnique({
      where: { usuarioId: usuario.id },
      include: {
        Associacao: {
          include: {
            Documentos: true,
            Pagamentos: { orderBy: { data_pagamento: 'desc' }, take: 1 },
            Interesses: true,
          },
        },
      },
    });
    if (perfil?.Associacao) {
      const associado = perfil.Associacao;
      associadoData = {
        nome: perfil.nome_completo,
        cpf: perfil.cpf,
        status: associado.status,
        tipo_associado: associado.tipo_associado,
        saude_quadro_geral: associado.saude_quadro_geral,
        saude_uso_medicacao: associado.saude_uso_medicacao,
        saude_uso_terapeutico_canabis: associado.saude_uso_terapeutico_canabis,
        saude_medico_prescritor: associado.saude_medico_prescritor,
        documentos: associado.Documentos,
        solicitacoes_oleo: associado.Interesses,
        proximo_vencimento: associado.Pagamentos[0]?.proximo_vencimento || null,
      };
    }
  }

  return json({ usuario, stats, associadoData });
}

type LoaderDataType = {
  usuario: Usuario;
  stats: DashboardStats;
  associadoData?: any;
};

const Dashboard = () => {
  const data = useLoaderData<LoaderDataType>();
  const { usuario, stats, associadoData } = data;
  const { mensagensNaoLidas } = useRootLoaderData();

  const isAdmin = usuario.papel === Papel.ADMIN || usuario.papel === Papel.SECRETARIA;
  const isSaude = usuario.papel === Papel.SAUDE;

  // Calcular percentuais
  const percentualAtivos = stats.totalAssociados > 0 
    ? Math.round((stats.associadosAtivos / stats.totalAssociados) * 100) 
    : 0;

  const percentualMedicinais = stats.totalAssociados > 0
    ? Math.round((stats.associadosMedicinais / stats.totalAssociados) * 100)
    : 0;

  const percentualComPrescritor = stats.associadosMedicinais > 0
    ? Math.round((stats.pacientesComPrescritor / stats.associadosMedicinais) * 100)
    : 0;

  const percentualComMedicacao = stats.totalAssociados > 0
    ? Math.round((stats.pacientesComMedicacao / stats.totalAssociados) * 100)
    : 0;

  // Validação de pagamento vigente (para associado)
  let pagamentoPendente = true;
  let documentosPendentes: string[] = [];
  let solicitacoesOleoCount = 0;
  if (associadoData) {
    if (associadoData.proximo_vencimento) {
      const hoje = new Date();
      const vencimento = new Date(associadoData.proximo_vencimento);
      pagamentoPendente = isAfter(hoje, vencimento);
    }
    // Validação de documentos pendentes
    const documentos = associadoData.documentos || [];
    const temIdentificacao = documentos.some((doc: any) => doc.tipo === 'IDENTIFICACAO');
    const temResidencia = documentos.some((doc: any) => doc.tipo === 'COMPROVANTE_RESIDENCIA');
    if (!temIdentificacao) documentosPendentes.push('Identificação');
    if (!temResidencia) documentosPendentes.push('Comprovante de Residência');
    solicitacoesOleoCount = associadoData.solicitacoes_oleo?.length || 0;
  }

  return (
    <LayoutRestrictArea usuarioSistema={usuario} mensagensNaoLidas={mensagensNaoLidas}>
      <Container fluid className='app-content'>
        <Row className='align-items-center mt-3 mb-4'>
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-home la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>Painel Inicial</h2>
                <p className='text-muted mb-0'>Visão geral da plataforma e estatísticas</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Sessão ADMIN - tudo que já existe */}
        <RoleBasedRender roles={['ADMIN']} userRole={usuario.papel}>
          {/* Cards de estatísticas principais */}
          <Row className='g-4 mb-4'>
            <Col xs={12} sm={6} lg={3}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-shrink-0'>
                      <div
                        className='rounded-circle d-flex align-items-center justify-content-center'
                        style={{ width: '48px', height: '48px', backgroundColor: '#e3f2fd' }}
                      >
                        <i className='las la-users' style={{ fontSize: '24px', color: '#1976d2' }} />
                      </div>
                    </div>
                    <div className='flex-grow-1 ms-3'>
                      <div className='text-muted small'>Total de Usuários</div>
                      <h3 className='mb-0'>{stats.totalUsuarios}</h3>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-shrink-0'>
                      <div
                        className='rounded-circle d-flex align-items-center justify-content-center'
                        style={{ width: '48px', height: '48px', backgroundColor: '#e8f5e9' }}
                      >
                        <i className='las la-user-check' style={{ fontSize: '24px', color: '#388e3c' }} />
                      </div>
                    </div>
                    <div className='flex-grow-1 ms-3'>
                      <div className='text-muted small'>Associados Ativos</div>
                      <h3 className='mb-0'>{stats.associadosAtivos}</h3>
                      <small className='text-success'>{percentualAtivos}% do total</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-shrink-0'>
                      <div
                        className='rounded-circle d-flex align-items-center justify-content-center'
                        style={{ width: '48px', height: '48px', backgroundColor: '#fff3e0' }}
                      >
                        <i className='las la-hourglass-half' style={{ fontSize: '24px', color: '#f57c00' }} />
                      </div>
                    </div>
                    <div className='flex-grow-1 ms-3'>
                      <div className='text-muted small'>Em Análise</div>
                      <h3 className='mb-0'>{stats.associadosEmAnalise}</h3>
                      <small className='text-warning'>Requer atenção</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} lg={3}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-shrink-0'>
                      <div
                        className='rounded-circle d-flex align-items-center justify-content-center'
                        style={{ width: '48px', height: '48px', backgroundColor: '#fce4ec' }}
                      >
                        <i className='las la-file-alt' style={{ fontSize: '24px', color: '#c2185b' }} />
                      </div>
                    </div>
                    <div className='flex-grow-1 ms-3'>
                      <div className='text-muted small'>Total Documentos</div>
                      <h3 className='mb-0'>{stats.totalDocumentos}</h3>
                      {stats.documentosPendentes > 0 && (
                        <small className='text-danger'>{stats.documentosPendentes} pendentes</small>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Card de Contatos e Mensagens */}
          <Row className='g-4 mb-4'>
            <Col xs={12}>
              <Card className='shadow-sm border-0'>
                <Card.Header className='bg-white border-bottom'>
                  <div className='d-flex align-items-center justify-content-between'>
                    <h5 className='mb-0'>
                      <i className='las la-envelope me-2' style={{ color: 'darkorchid' }} />
                      Contatos e Mensagens
                    </h5>
                    <a href='/app/contatos' className='btn btn-sm' style={{ color: 'darkorchid' }}>
                      Ver todos <i className='las la-arrow-right' />
                    </a>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className='g-4'>
                    <Col xs={12} sm={6} md={3}>
                      <div className='text-center p-3'>
                        <div className='mb-3'>
                          <div
                            className='rounded-circle d-inline-flex align-items-center justify-content-center'
                            style={{ width: '64px', height: '64px', backgroundColor: 'rgba(153, 50, 204, 0.1)' }}
                          >
                            <i className='las la-address-book' style={{ fontSize: '32px', color: 'darkorchid' }} />
                          </div>
                        </div>
                        <h3 className='mb-1' style={{ color: 'darkorchid' }}>{stats.totalContatos}</h3>
                        <p className='text-muted mb-0 small'>Total de Contatos</p>
                      </div>
                    </Col>

                    <Col xs={12} sm={6} md={3}>
                      <div className='text-center p-3'>
                        <div className='mb-3'>
                          <div
                            className='rounded-circle d-inline-flex align-items-center justify-content-center'
                            style={{ width: '64px', height: '64px', backgroundColor: 'rgba(33, 150, 243, 0.1)' }}
                          >
                            <i className='las la-comments' style={{ fontSize: '32px', color: '#2196f3' }} />
                          </div>
                        </div>
                        <h3 className='mb-1' style={{ color: '#2196f3' }}>{stats.totalMensagens}</h3>
                        <p className='text-muted mb-0 small'>Total de Mensagens</p>
                      </div>
                    </Col>

                    <Col xs={12} sm={6} md={3}>
                      <div className='text-center p-3'>
                        <div className='mb-3'>
                          <div
                            className='rounded-circle d-inline-flex align-items-center justify-content-center'
                            style={{ width: '64px', height: '64px', backgroundColor: stats.mensagensNaoLidas > 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)' }}
                          >
                            <i className='las la-envelope-open' style={{ fontSize: '32px', color: stats.mensagensNaoLidas > 0 ? '#f44336' : '#4caf50' }} />
                          </div>
                        </div>
                        <h3 className='mb-1' style={{ color: stats.mensagensNaoLidas > 0 ? '#f44336' : '#4caf50' }}>
                          {stats.mensagensNaoLidas}
                        </h3>
                        <p className='text-muted mb-0 small'>
                          {stats.mensagensNaoLidas > 0 ? 'Não Lidas' : 'Todas Lidas'} 
                          {stats.mensagensNaoLidas > 0 && <i className='las la-exclamation-circle ms-1' />}
                        </p>
                      </div>
                    </Col>

                    <Col xs={12} sm={6} md={3}>
                      <div className='text-center p-3'>
                        <div className='mb-3'>
                          <div
                            className='rounded-circle d-inline-flex align-items-center justify-content-center'
                            style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255, 152, 0, 0.1)' }}
                          >
                            <i className='las la-calendar-check' style={{ fontSize: '32px', color: '#ff9800' }} />
                          </div>
                        </div>
                        <h3 className='mb-1' style={{ color: '#ff9800' }}>{stats.contatosRecentes}</h3>
                        <p className='text-muted mb-0 small'>Últimos 7 Dias</p>
                      </div>
                    </Col>
                  </Row>

                  {stats.mensagensNaoLidas > 0 && (
                    <div className='mt-3 p-3 rounded' style={{ backgroundColor: 'rgba(244, 67, 54, 0.05)', borderLeft: '4px solid #f44336' }}>
                      <div className='d-flex align-items-center'>
                        <i className='las la-bell me-2' style={{ fontSize: '20px', color: '#f44336' }} />
                        <div>
                          <strong style={{ color: '#f44336' }}>Atenção!</strong>
                          <p className='mb-0 small text-muted'>
                            Você tem {stats.mensagensNaoLidas} mensagem{stats.mensagensNaoLidas > 1 ? 's' : ''} não lida{stats.mensagensNaoLidas > 1 ? 's' : ''} aguardando resposta.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className='g-4 mb-4'>
            {/* Distribuição de Associados por Status */}
            {isAdmin && (
              <Col xs={12} lg={6}>
                <Card className='shadow-sm border-0 h-100'>
                  <Card.Header className='bg-white border-bottom'>
                    <h5 className='mb-0'>
                      <i className='las la-chart-pie me-2' />
                      Status dos Associados
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className='mb-3'>
                      <div className='d-flex justify-content-between mb-2'>
                        <span>
                          <Badge bg='success' className='me-2'>Associado</Badge>
                          {stats.associadosPorStatus.ASSOCIADO || 0} pessoas
                        </span>
                        <strong>
                          {stats.totalAssociados > 0
                            ? Math.round(((stats.associadosPorStatus.ASSOCIADO || 0) / stats.totalAssociados) * 100)
                            : 0}%
                        </strong>
                      </div>
                      <ProgressBar 
                        now={stats.totalAssociados > 0 ? ((stats.associadosPorStatus.ASSOCIADO || 0) / stats.totalAssociados) * 100 : 0} 
                        variant='success' 
                      />
                    </div>

                    <div className='mb-3'>
                      <div className='d-flex justify-content-between mb-2'>
                        <span>
                          <Badge bg='info' className='me-2'>Em Análise</Badge>
                          {stats.associadosPorStatus.EM_ANALISE || 0} pessoas
                        </span>
                        <strong>
                          {stats.totalAssociados > 0
                            ? Math.round(((stats.associadosPorStatus.EM_ANALISE || 0) / stats.totalAssociados) * 100)
                            : 0}%
                        </strong>
                      </div>
                      <ProgressBar 
                        now={stats.totalAssociados > 0 ? ((stats.associadosPorStatus.EM_ANALISE || 0) / stats.totalAssociados) * 100 : 0} 
                        variant='info' 
                      />
                    </div>

                    <div className='mb-3'>
                      <div className='d-flex justify-content-between mb-2'>
                        <span>
                          <Badge bg='warning' className='me-2'>Aguardando Pagamento</Badge>
                          {stats.associadosPorStatus.AGUARDANDO_PAGAMENTO || 0} pessoas
                        </span>
                        <strong>
                          {stats.totalAssociados > 0
                            ? Math.round(((stats.associadosPorStatus.AGUARDANDO_PAGAMENTO || 0) / stats.totalAssociados) * 100)
                            : 0}%
                        </strong>
                      </div>
                      <ProgressBar 
                        now={stats.totalAssociados > 0 ? ((stats.associadosPorStatus.AGUARDANDO_PAGAMENTO || 0) / stats.totalAssociados) * 100 : 0} 
                        variant='warning' 
                      />
                    </div>

                    <div className='mb-3'>
                      <div className='d-flex justify-content-between mb-2'>
                        <span>
                          <Badge bg='warning' className='me-2'>Aguardando Assinatura</Badge>
                          {stats.associadosPorStatus.AGUARDANDO_ASSINATURA || 0} pessoas
                        </span>
                        <strong>
                          {stats.totalAssociados > 0
                            ? Math.round(((stats.associadosPorStatus.AGUARDANDO_ASSINATURA || 0) / stats.totalAssociados) * 100)
                            : 0}%
                        </strong>
                      </div>
                      <ProgressBar 
                        now={stats.totalAssociados > 0 ? ((stats.associadosPorStatus.AGUARDANDO_ASSINATURA || 0) / stats.totalAssociados) * 100 : 0} 
                        variant='warning' 
                      />
                    </div>

                    <div>
                      <div className='d-flex justify-content-between mb-2'>
                        <span>
                          <Badge bg='secondary' className='me-2'>Aguardando Cadastro</Badge>
                          {stats.associadosPorStatus.AGUARDANDO_CADASTRO || 0} pessoas
                        </span>
                        <strong>
                          {stats.totalAssociados > 0
                            ? Math.round(((stats.associadosPorStatus.AGUARDANDO_CADASTRO || 0) / stats.totalAssociados) * 100)
                            : 0}%
                        </strong>
                      </div>
                      <ProgressBar 
                        now={stats.totalAssociados > 0 ? ((stats.associadosPorStatus.AGUARDANDO_CADASTRO || 0) / stats.totalAssociados) * 100 : 0} 
                        variant='secondary' 
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* Tipo de Associados */}
            <Col xs={12} lg={isAdmin ? 6 : 12}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Header className='bg-white border-bottom'>
                  <h5 className='mb-0'>
                    <i className='las la-leaf me-2' />
                    Tipos de Associação
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className='g-3'>
                    <Col xs={12} md={6}>
                      <div className='text-center p-4 bg-light rounded'>
                        <i className='las la-capsules' style={{ fontSize: '48px', color: '#9932cc' }} />
                        <h3 className='mt-2 mb-0'>{stats.associadosMedicinais}</h3>
                        <div className='text-muted'>Medicinais</div>
                        <Badge bg='primary' className='mt-2'>{percentualMedicinais}% do total</Badge>
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className='text-center p-4 bg-light rounded'>
                        <i className='las la-hands-helping' style={{ fontSize: '48px', color: '#4caf50' }} />
                        <h3 className='mt-2 mb-0'>{stats.associadosApoiadores}</h3>
                        <div className='text-muted'>Apoiadores</div>
                        <Badge bg='success' className='mt-2'>{100 - percentualMedicinais}% do total</Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Seção para Profissionais de Saúde */}
          {(isSaude || isAdmin) && (
            <>
              <Row className='mt-4 mb-3'>
                <Col>
                  <h4 className='mb-0'>
                    <i className='las la-stethoscope me-2' />
                    Informações de Saúde
                  </h4>
                  <p className='text-muted small mb-0'>Dados sobre o acompanhamento terapêutico dos associados</p>
                </Col>
              </Row>

              <Row className='g-4 mb-4'>
                <Col xs={12} sm={6} lg={3}>
                  <Card className='shadow-sm border-0 h-100'>
                    <Card.Body className='text-center'>
                      <i className='las la-pills' style={{ fontSize: '48px', color: '#ff9800' }} />
                      <h3 className='mt-3 mb-1'>{stats.pacientesComMedicacao}</h3>
                      <div className='text-muted small'>Em uso de medicação</div>
                      <Badge bg='warning' className='mt-2'>{percentualComMedicacao}%</Badge>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <Card className='shadow-sm border-0 h-100'>
                    <Card.Body className='text-center'>
                      <i className='las la-user-md' style={{ fontSize: '48px', color: '#2196f3' }} />
                      <h3 className='mt-3 mb-1'>{stats.pacientesComPrescritor}</h3>
                      <div className='text-muted small'>Com médico prescritor</div>
                      <Badge bg='info' className='mt-2'>{percentualComPrescritor}%</Badge>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <Card className='shadow-sm border-0 h-100'>
                    <Card.Body className='text-center'>
                      <i className='las la-certificate' style={{ fontSize: '48px', color: '#e91e63' }} />
                      <h3 className='mt-3 mb-1'>{stats.pacientesComAutorizacaoAnvisa}</h3>
                      <div className='text-muted small'>Autorizações ANVISA</div>
                      <Badge bg='danger' className='mt-2'>Documentos</Badge>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12} sm={6} lg={3}>
                  <Card className='shadow-sm border-0 h-100'>
                    <Card.Body className='text-center'>
                      <i className='las la-cannabis' style={{ fontSize: '48px', color: '#4caf50' }} />
                      <h3 className='mt-3 mb-1'>{stats.pacientesComUsoTerapeutico}</h3>
                      <div className='text-muted small'>Já usaram terapeuticamente</div>
                      <Badge bg='success' className='mt-2'>
                        {stats.associadosMedicinais > 0 
                          ? Math.round((stats.pacientesComUsoTerapeutico / stats.associadosMedicinais) * 100)
                          : 0}%
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className='g-4'>
                <Col xs={12}>
                  <Card className='shadow-sm border-0'>
                    <Card.Header className='bg-white border-bottom'>
                      <h5 className='mb-0'>
                        <i className='las la-chart-bar me-2' />
                        Insights Clínicos
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6} className='mb-3'>
                          <div className='border-start border-primary border-3 ps-3'>
                            <h6 className='text-primary mb-2'>
                              <i className='las la-info-circle me-1' />
                              Acompanhamento Médico
                            </h6>
                            <p className='mb-1 small'>
                              {stats.pacientesComPrescritor} associados medicinais ({percentualComPrescritor}%) estão sob 
                              acompanhamento de médico prescritor de cannabis.
                            </p>
                            {percentualComPrescritor < 50 && (
                              <small className='text-muted'>
                                Considere campanhas de conscientização sobre a importância do acompanhamento médico.
                              </small>
                            )}
                          </div>
                        </Col>

                        <Col md={6} className='mb-3'>
                          <div className='border-start border-success border-3 ps-3'>
                            <h6 className='text-success mb-2'>
                              <i className='las la-check-circle me-1' />
                              Experiência com Cannabis
                            </h6>
                            <p className='mb-1 small'>
                              {stats.pacientesComUsoTerapeutico} associados já tiveram experiência com uso terapêutico 
                              de cannabis medicinal.
                            </p>
                            <small className='text-muted'>
                              Base de conhecimento disponível para orientação de novos associados.
                            </small>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className='border-start border-warning border-3 ps-3'>
                            <h6 className='text-warning mb-2'>
                              <i className='las la-exclamation-triangle me-1' />
                              Uso de Medicação Contínua
                            </h6>
                            <p className='mb-1 small'>
                              {stats.pacientesComMedicacao} associados ({percentualComMedicacao}%) fazem uso 
                              regular de medicamentos.
                            </p>
                            <small className='text-muted'>
                              Importante monitorar possíveis interações medicamentosas.
                            </small>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className='border-start border-danger border-3 ps-3'>
                            <h6 className='text-danger mb-2'>
                              <i className='las la-file-medical me-1' />
                              Regularização ANVISA
                            </h6>
                            <p className='mb-1 small'>
                              {stats.pacientesComAutorizacaoAnvisa} documentos de autorização ANVISA cadastrados.
                            </p>
                            <small className='text-muted'>
                              Essencial para importação legal de produtos canábicos.
                            </small>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* Distribuição de Usuários por Papel (Admin only) */}
          {isAdmin && (
            <Row className='g-4 mt-2'>
              <Col xs={12}>
                <Card className='shadow-sm border-0'>
                  <Card.Header className='bg-white border-bottom'>
                    <h5 className='mb-0'>
                      <i className='las la-user-shield me-2' />
                      Distribuição de Usuários por Papel
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className='g-3'>
                      {Object.entries(stats.usuariosPorPapel).map(([papel, count]) => {
                        const papelConfig = {
                          ADMIN: { label: 'Administradores', icon: 'las la-crown', color: '#dc3545' },
                          ASSOCIADO: { label: 'Associados', icon: 'las la-leaf', color: '#28a745' },
                          ASSOCIADO_DEPENDENTE: { label: 'Dependentes', icon: 'las la-user', color: '#17a2b8' },
                          SECRETARIA: { label: 'Secretaria', icon: 'las la-clipboard-list', color: '#ffc107' },
                          SAUDE: { label: 'Profissionais de Saúde', icon: 'las la-stethoscope', color: '#007bff' },
                        };

                        const config = papelConfig[papel as keyof typeof papelConfig] || {
                          label: papel,
                          icon: 'las la-user',
                          color: '#6c757d',
                        };

                        const percentual = Math.round((count / stats.totalUsuarios) * 100);

                        return (
                          <Col key={papel} xs={12} sm={6} md={4}>
                            <div className='d-flex align-items-center p-3 bg-light rounded'>
                              <div
                                className='rounded-circle d-flex align-items-center justify-content-center flex-shrink-0'
                                style={{ width: '40px', height: '40px', backgroundColor: config.color + '20' }}
                              >
                                <i className={config.icon} style={{ fontSize: '20px', color: config.color }} />
                              </div>
                              <div className='ms-3'>
                                <div className='small text-muted'>{config.label}</div>
                                <div className='d-flex align-items-center gap-2'>
                                  <strong>{count}</strong>
                                  <Badge bg='secondary' className='small'>{percentual}%</Badge>
                                </div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </RoleBasedRender>

        {/* Sessão ASSOCIADO - dados personalizados */}
        <RoleBasedRender roles={['ASSOCIADO']} userRole={usuario.papel}>
          <Row className='g-4 mb-4'>
            <Col xs={12} md={6} lg={4}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-shrink-0'>
                      <div className='rounded-circle d-flex align-items-center justify-content-center' style={{ width: '48px', height: '48px', backgroundColor: '#e3f2fd' }}>
                        <i className='las la-oil-can' style={{ fontSize: '24px', color: '#1976d2' }} />
                      </div>
                    </div>
                    <div className='flex-grow-1 ms-3'>
                      <div className='text-muted small'>Minhas Solicitações de Óleo</div>
                      <h3 className='mb-0'>{solicitacoesOleoCount}</h3>
                      <small className='text-success'>Acompanhe o status das suas solicitações</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-shrink-0'>
                      <div className='rounded-circle d-flex align-items-center justify-content-center' style={{ width: '48px', height: '48px', backgroundColor: '#e8f5e9' }}>
                        <i className='las la-money-check-alt' style={{ fontSize: '24px', color: '#388e3c' }} />
                      </div>
                    </div>
                    <div className='flex-grow-1 ms-3'>
                      <div className='text-muted small'>Status de Pagamento</div>
                      <h3 className='mb-0'>{!pagamentoPendente ? 'Em dia' : 'Pendente'}</h3>
                      <small className={!pagamentoPendente ? 'text-success' : 'text-danger'}>
                        {!pagamentoPendente ? 'Tudo certo!' : 'Regularize para continuar recebendo benefícios'}
                      </small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <div className='d-flex align-items-center'>
                    <div className='flex-shrink-0'>
                      <div className='rounded-circle d-flex align-items-center justify-content-center' style={{ width: '48px', height: '48px', backgroundColor: '#fff3e0' }}>
                        <i className='las la-file-medical' style={{ fontSize: '24px', color: '#f57c00' }} />
                      </div>
                    </div>
                    <div className='flex-grow-1 ms-3'>
                      <div className='text-muted small'>Documentos Pendentes</div>
                      <h3 className='mb-0'>{documentosPendentes.length}</h3>
                      {documentosPendentes.length > 0 ? (
                        <small className='text-warning'>Pendentes: {documentosPendentes.join(', ')}</small>
                      ) : (
                        <small className='text-success'>Todos os documentos obrigatórios enviados</small>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className='g-4 mb-4'>
            <Col xs={12} md={6}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <h5 className='mb-3'><i className='las la-heartbeat me-2' />Resumo de Saúde</h5>
                  <div className='mb-2'>
                    <strong>Quadro Geral:</strong> {associadoData?.saude_quadro_geral || 'Não informado'}
                  </div>
                  <div className='mb-2'>
                    <strong>Medicação:</strong> {associadoData?.saude_uso_medicacao ? 'Sim' : 'Não'}
                  </div>
                  <div className='mb-2'>
                    <strong>Uso Terapêutico:</strong> {associadoData?.saude_uso_terapeutico_canabis ? 'Sim' : 'Não'}
                  </div>
                  <div className='mb-2'>
                    <strong>Prescritor:</strong> {associadoData?.saude_medico_prescritor ? 'Sim' : 'Não'}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className='shadow-sm border-0 h-100'>
                <Card.Body>
                  <h5 className='mb-3'><i className='las la-info-circle me-2' />Minhas Informações</h5>
                  <div className='mb-2'>
                    <strong>Nome:</strong> {associadoData?.nome}
                  </div>
                  <div className='mb-2'>
                    <strong>CPF:</strong> {associadoData?.cpf}
                  </div>
                  <div className='mb-2'>
                    <strong>Status:</strong> {associadoData?.status}
                  </div>
                  <div className='mb-2'>
                    <strong>Tipo de Associado:</strong> {associadoData?.tipo_associado}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </RoleBasedRender>
      </Container>
    </LayoutRestrictArea>
  );
};

export default Dashboard;
