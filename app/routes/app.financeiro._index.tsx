import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams, useNavigation, useActionData } from "@remix-run/react";
import { Badge, Button, Card, Col, Container, Row, Table, Alert } from "react-bootstrap";
import { format, parseISO, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import LayoutRestrictArea from "~/component/layout/LayoutRestrictArea";
import { prisma } from "~/secure/db.server";
import { authenticator } from "~/secure/authentication.server";
import { Papel } from "@prisma/client";
import { formatarMoeda } from "~/shared/Number.util";
import { RoleBasedRender } from "~/secure/protected-components";

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  const isAdmin = usuario?.papel === Papel.ADMIN || usuario?.papel === Papel.SECRETARIA || usuario?.papel === Papel.SAUDE;
  const isAssociado = usuario?.papel === Papel.ASSOCIADO;

  // Se for associado, buscar apenas seus próprios pagamentos
  if (isAssociado) {
    const perfil = await prisma.perfil.findUnique({
      where: { usuarioId: usuario.id },
      include: {
        Associacao: {
          include: {
            Pagamentos: {
              orderBy: { data_pagamento: 'desc' },
            },
          },
        },
      },
    });

    if (!perfil?.Associacao) {
      return json({
        pagamentos: [],
        meusPagamentos: [],
        usuario,
        isAssociado: true,
        podeAporte: false,
        associado: null,
        totalRecebido: 0,
        mediaPagamento: 0,
        totalPagamentos: 0,
        pagamentosPorMes: {},
        associadosVigentes: 0,
        associadosVencidos: 0,
        totalAssociados: 0,
        filtros: {
          pessoa: '',
          dataInicio: '',
          dataFim: '',
        },
      });
    }

    const associado = perfil.Associacao;
    const meusPagamentos = associado.Pagamentos;

    // Verificar se tem pagamento ativo (próximo vencimento no futuro)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const temPagamentoAtivo = meusPagamentos.some(
      (p) => new Date(p.proximo_vencimento) >= hoje
    );

    // Pode solicitar aporte se for elegível E não tiver pagamento ativo
    const podeAporte = associado.elegivel_tarifa_social && !temPagamentoAtivo;

    return json({
      pagamentos: [],
      meusPagamentos,
      usuario,
      isAssociado: true,
      podeAporte,
      associado,
      totalRecebido: 0,
      mediaPagamento: 0,
      totalPagamentos: 0,
      pagamentosPorMes: {},
      associadosVigentes: 0,
      associadosVencidos: 0,
      totalAssociados: 0,
      filtros: {
        pessoa: '',
        dataInicio: '',
        dataFim: '',
      },
    });
  }

  // Lógica para administradores
  const url = new URL(request.url);
  const pessoaNome = url.searchParams.get("pessoa") || "";
  const dataInicio = url.searchParams.get("dataInicio") || "";
  const dataFim = url.searchParams.get("dataFim") || "";

  // Construir filtros
  const where: any = {};

  if (pessoaNome) {
    where.associado = {
      perfil: {
        nome_completo: {
          contains: pessoaNome,
          mode: "insensitive",
        },
      },
    };
  }

  if (dataInicio && dataFim) {
    where.data_pagamento = {
      gte: parseISO(dataInicio),
      lte: parseISO(dataFim),
    };
  } else if (dataInicio) {
    where.data_pagamento = {
      gte: parseISO(dataInicio),
    };
  } else if (dataFim) {
    where.data_pagamento = {
      lte: parseISO(dataFim),
    };
  }

  // Buscar pagamentos
  const pagamentos = await prisma.pagamento.findMany({
    where,
    include: {
      associado: {
        include: {
          perfil: {
            select: {
              nome_completo: true,
              cpf: true,
              telefone: true,
            },
          },
        },
      },
    },
    orderBy: {
      data_pagamento: "desc",
    },
  });

  // Estatísticas
  const totalRecebido = pagamentos.reduce(
    (acc, p) => acc + (p.valor ? Number(p.valor) : 0),
    0
  );

  const pagamentosComValor = pagamentos.filter((p) => p.valor !== null);
  const mediaPagamento = pagamentosComValor.length > 0
    ? totalRecebido / pagamentosComValor.length
    : 0;

  // Pagamentos por mês (últimos 6 meses)
  const hoje = new Date();
  const pagamentosPorMes: { [key: string]: number } = {};
  
  for (let i = 5; i >= 0; i--) {
    const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mesKey = format(mes, "yyyy-MM");
    pagamentosPorMes[mesKey] = 0;
  }

  pagamentos.forEach((p) => {
    const mesKey = format(new Date(p.data_pagamento), "yyyy-MM");
    if (pagamentosPorMes.hasOwnProperty(mesKey)) {
      pagamentosPorMes[mesKey] += p.valor ? Number(p.valor) : 0;
    }
  });

  // Associados com pagamentos vigentes vs vencidos
  const associadosUnicos = await prisma.associado.findMany({
    where: {
      status: "ASSOCIADO",
    },
    include: {
      Pagamentos: {
        orderBy: {
          proximo_vencimento: "desc",
        },
        take: 1,
      },
      perfil: {
        select: {
          nome_completo: true,
        },
      },
    },
  });

  const hoje_sem_hora = new Date();
  hoje_sem_hora.setHours(0, 0, 0, 0);

  const associadosVigentes = associadosUnicos.filter(
    (a) =>
      a.Pagamentos.length > 0 &&
      new Date(a.Pagamentos[0].proximo_vencimento) >= hoje_sem_hora
  ).length;

  const associadosVencidos = associadosUnicos.length - associadosVigentes;

  return json({
    pagamentos,
    meusPagamentos: [],
    totalRecebido,
    mediaPagamento,
    totalPagamentos: pagamentos.length,
    pagamentosPorMes,
    associadosVigentes,
    associadosVencidos,
    totalAssociados: associadosUnicos.length,
    filtros: {
      pessoa: pessoaNome,
      dataInicio,
      dataFim,
    },
    usuario,
    isAssociado: false,
    podeAporte: false,
    associado: null,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  if (usuario.papel !== Papel.ASSOCIADO) {
    return json({ error: "Acesso negado" }, { status: 403 });
  }

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "solicitar_aporte") {
    // Buscar perfil do associado
    const perfil = await prisma.perfil.findUnique({
      where: { usuarioId: usuario.id },
      include: {
        Associacao: true,
      },
    });

    if (!perfil?.Associacao) {
      return json({ error: "Associado não encontrado" }, { status: 404 });
    }

    const associado = perfil.Associacao;

    // Verificar se é elegível
    if (!associado.elegivel_tarifa_social) {
      return json({ error: "Você não está elegível para tarifa social" }, { status: 400 });
    }

    // Verificar se já tem pagamento ativo
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const pagamentoAtivo = await prisma.pagamento.findFirst({
      where: {
        associadoId: associado.id,
        proximo_vencimento: {
          gte: hoje,
        },
      },
    });

    if (pagamentoAtivo) {
      return json({ error: "Você já possui um plano ativo" }, { status: 400 });
    }

    // Criar pagamento de aporte social (valor 0)
    const proximoVencimento = addMonths(hoje, 1);

    await prisma.pagamento.create({
      data: {
        associadoId: associado.id,
        valor: 0,
        proximo_vencimento: proximoVencimento,
        observacao: "Mensalidade social - Aporte social solicitado pelo associado",
      },
    });

    return json({ success: true, message: "Aporte social solicitado com sucesso!" });
  }

  return json({ error: "Ação inválida" }, { status: 400 });
}

export default function Financeiro() {
  const {
    pagamentos,
    meusPagamentos,
    totalRecebido,
    mediaPagamento,
    totalPagamentos,
    pagamentosPorMes,
    associadosVigentes,
    associadosVencidos,
    totalAssociados,
    filtros,
    usuario,
    isAssociado,
    podeAporte,
    associado,
  } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isSubmitting = navigation.state === "submitting";

  return (
    <LayoutRestrictArea usuarioSistema={usuario as any}>
      <Container fluid className="app-content">
        <Row className="align-items-center mt-3 mb-4">
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-wallet la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className="mb-1">{isAssociado ? 'Meus Pagamentos' : 'Gestão Financeira'}</h2>
                <p className="text-muted mb-0">
                  {isAssociado 
                    ? 'Acompanhe suas mensalidades e contribuições'
                    : 'Gerencie pagamentos e relatórios financeiros da associação'}
                </p>
              </div>
            </div>
          </Col>
        </Row>

        {actionData?.success && (
          <Alert variant="success" dismissible>
            <i className="las la-check-circle"></i> {actionData.message}
          </Alert>
        )}

        {actionData?.error && (
          <Alert variant="danger" dismissible>
            <i className="las la-exclamation-triangle"></i> {actionData.error}
          </Alert>
        )}

        {/* Visualização para ASSOCIADO */}
        <RoleBasedRender roles={['ASSOCIADO']} userRole={usuario.papel}>
          {/* Botão de Solicitar Aporte Social */}
          {podeAporte && (
            <Row className="mb-4">
              <Col>
                <Card className="border-0 shadow-sm bg-info bg-opacity-10 border-info">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={9}>
                        <h5 className="mb-2">
                          <i className="las la-hand-holding-heart text-info"></i> Mensalidade Social Disponível
                        </h5>
                        <p className="mb-0 text-muted">
                          Você está elegível para tarifa social. Solicite seu aporte social para ativar sua mensalidade com valor zerado.
                        </p>
                      </Col>
                      <Col md={3} className="text-end">
                        <Form method="post">
                          <input type="hidden" name="action" value="solicitar_aporte" />
                          <Button 
                            type="submit" 
                            variant="info" 
                            size="lg"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <i className="las la-spinner la-spin"></i> Processando...
                              </>
                            ) : (
                              <>
                                <i className="las la-plus-circle"></i> Solicitar Aporte Social
                              </>
                            )}
                          </Button>
                        </Form>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Histórico de Pagamentos do Associado */}
          <Row>
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">
                    <i className="las la-history"></i> Meu Histórico de Pagamentos
                  </h5>

                  {meusPagamentos.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="las la-inbox fs-1 d-block mb-2"></i>
                      <p className="mb-3">Você ainda não possui nenhum registro de pagamento.</p>
                      {podeAporte && (
                        <p className="text-info">
                          <i className="las la-arrow-up"></i> Utilize o botão acima para solicitar aporte social
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover>
                        <thead className="table-light">
                          <tr>
                            <th>Data Pagamento</th>
                            <th>Valor</th>
                            <th>Próximo Vencimento</th>
                            <th>Observação</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meusPagamentos.map((pagamento) => {
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0);
                            const vencimento = new Date(pagamento.proximo_vencimento);
                            const estaVigente = vencimento >= hoje;
                            const diasRestantes = Math.ceil(
                              (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
                            );

                            return (
                              <tr key={pagamento.id}>
                                <td>
                                  <div>
                                    {format(
                                      new Date(pagamento.data_pagamento),
                                      "dd/MM/yyyy",
                                      { locale: ptBR }
                                    )}
                                  </div>
                                  <small className="text-muted">
                                    {format(
                                      new Date(pagamento.data_pagamento),
                                      "HH:mm",
                                      { locale: ptBR }
                                    )}
                                  </small>
                                </td>
                                <td>
                                  {pagamento.valor && Number(pagamento.valor) > 0 ? (
                                    <span className="fw-bold text-success">
                                      {formatarMoeda(Number(pagamento.valor))}
                                    </span>
                                  ) : (
                                    <Badge bg="info">Mensalidade Social</Badge>
                                  )}
                                </td>
                                <td>
                                  {format(
                                    new Date(pagamento.proximo_vencimento),
                                    "dd/MM/yyyy",
                                    { locale: ptBR }
                                  )}
                                </td>
                                <td>
                                  <small className="text-muted">
                                    {pagamento.observacao || "-"}
                                  </small>
                                </td>
                                <td>
                                  {estaVigente ? (
                                    <Badge bg="success">
                                      <i className="las la-check-circle"></i> Vigente
                                      {diasRestantes > 0 && (
                                        <span className="ms-1">
                                          ({diasRestantes}d)
                                        </span>
                                      )}
                                    </Badge>
                                  ) : (
                                    <Badge bg="danger">
                                      <i className="las la-exclamation-circle"></i> Vencido
                                      {diasRestantes < 0 && (
                                        <span className="ms-1">
                                          ({Math.abs(diasRestantes)}d)
                                        </span>
                                      )}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </RoleBasedRender>

        {/* Visualização para ADMIN/SECRETARIA/SAUDE */}
        <RoleBasedRender roles={['ADMIN', 'SECRETARIA', 'SAUDE']} userRole={usuario.papel}>

        {/* Estatísticas */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Total Recebido</p>
                    <h4 className="mb-0 text-success">
                      {formatarMoeda(totalRecebido)}
                    </h4>
                  </div>
                  <i className="las la-money-bill-wave fs-2 text-success opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Média por Pagamento</p>
                    <h4 className="mb-0 text-primary">
                      {formatarMoeda(mediaPagamento)}
                    </h4>
                  </div>
                  <i className="las la-chart-line fs-2 text-primary opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Total de Transações</p>
                    <h4 className="mb-0">{totalPagamentos}</h4>
                  </div>
                  <i className="las la-file-invoice-dollar fs-2 text-info opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Status Associados</p>
                    <div className="d-flex gap-2">
                      <Badge bg="success">{associadosVigentes} em dia</Badge>
                      <Badge bg="danger">{associadosVencidos} vencidos</Badge>
                    </div>
                  </div>
                  <i className="las la-users fs-2 text-secondary opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Gráfico de Pagamentos por Mês */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">📊 Receita dos Últimos 6 Meses</h5>
                <div className="d-flex align-items-end gap-2" style={{ height: "200px" }}>
                  {Object.entries(pagamentosPorMes).map(([mes, valor]) => {
                    const maxValor = Math.max(...Object.values(pagamentosPorMes), 1);
                    const altura = (valor / maxValor) * 100;
                    
                    return (
                      <div key={mes} className="flex-fill text-center">
                        <div
                          className="bg-primary rounded-top"
                          style={{
                            height: `${altura}%`,
                            minHeight: valor > 0 ? "20px" : "0",
                          }}
                          title={formatarMoeda(valor)}
                        ></div>
                        <small className="d-block mt-2 text-muted">
                          {format(parseISO(`${mes}-01`), "MMM/yy", { locale: ptBR })}
                        </small>
                        <small className="d-block text-success fw-bold">
                          {formatarMoeda(valor)}
                        </small>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filtros */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">🔍 Filtros</h5>
                <Form method="get">
                  <Row>
                    <Col md={4}>
                      <div className="mb-3">
                        <label className="form-label small">Nome da Pessoa</label>
                        <input
                          type="text"
                          name="pessoa"
                          className="form-control"
                          placeholder="Digite o nome..."
                          defaultValue={filtros.pessoa}
                        />
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="form-label small">Data Início</label>
                        <input
                          type="date"
                          name="dataInicio"
                          className="form-control"
                          defaultValue={filtros.dataInicio}
                        />
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="form-label small">Data Fim</label>
                        <input
                          type="date"
                          name="dataFim"
                          className="form-control"
                          defaultValue={filtros.dataFim}
                        />
                      </div>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                      <div className="mb-3 w-100 d-flex gap-2">
                        <Button type="submit" variant="primary" className="flex-fill">
                          <i className="las la-search"></i> Filtrar
                        </Button>
                        {(filtros.pessoa || filtros.dataInicio || filtros.dataFim) && (
                          <Button
                            variant="outline-secondary"
                            href="/app/financeiro"
                          >
                            <i className="las la-times"></i>
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Listagem de Pagamentos */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">📋 Transações Financeiras</h5>
                  <Badge bg="secondary">{totalPagamentos} registros</Badge>
                </div>

                {pagamentos.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="las la-inbox fs-1 d-block mb-2"></i>
                    <p>Nenhuma transação encontrada com os filtros aplicados.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="table-light">
                        <tr>
                          <th>Data Pagamento</th>
                          <th>Associado</th>
                          <th>CPF</th>
                          <th>Telefone</th>
                          <th>Valor</th>
                          <th>Próximo Vencimento</th>
                          <th>Observação</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagamentos.map((pagamento) => {
                          const hoje = new Date();
                          hoje.setHours(0, 0, 0, 0);
                          const vencimento = new Date(pagamento.proximo_vencimento);
                          const estaVigente = vencimento >= hoje;
                          const diasRestantes = Math.ceil(
                            (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
                          );

                          return (
                            <tr key={pagamento.id}>
                              <td>
                                <div>
                                  {format(
                                    new Date(pagamento.data_pagamento),
                                    "dd/MM/yyyy",
                                    { locale: ptBR }
                                  )}
                                </div>
                                <small className="text-muted">
                                  {format(
                                    new Date(pagamento.data_pagamento),
                                    "HH:mm",
                                    { locale: ptBR }
                                  )}
                                </small>
                              </td>
                              <td>
                                <div className="fw-bold">
                                  {pagamento.associado.perfil.nome_completo}
                                </div>
                              </td>
                              <td>
                                <code className="small">
                                  {pagamento.associado.perfil.cpf || "-"}
                                </code>
                              </td>
                              <td>{pagamento.associado.perfil.telefone || "-"}</td>
                              <td>
                                {pagamento.valor && Number(pagamento.valor) > 0 ? (
                                  <span className="fw-bold text-success">
                                    {formatarMoeda(Number(pagamento.valor))}
                                  </span>
                                ) : (
                                  <Badge bg="info">Mensalidade Social</Badge>
                                )}
                              </td>
                              <td>
                                {format(
                                  new Date(pagamento.proximo_vencimento),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )}
                              </td>
                              <td>
                                <small className="text-muted">
                                  {pagamento.observacao || "-"}
                                </small>
                              </td>
                              <td>
                                {estaVigente ? (
                                  <Badge bg="success">
                                    <i className="las la-check-circle"></i> Vigente
                                    {diasRestantes > 0 && (
                                      <span className="ms-1">
                                        ({diasRestantes}d)
                                      </span>
                                    )}
                                  </Badge>
                                ) : (
                                  <Badge bg="danger">
                                    <i className="las la-exclamation-circle"></i> Vencido
                                    {diasRestantes < 0 && (
                                      <span className="ms-1">
                                        ({Math.abs(diasRestantes)}d)
                                      </span>
                                    )}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        </RoleBasedRender>
      </Container>
    </LayoutRestrictArea>
  );
}
