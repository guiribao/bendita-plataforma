import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Badge, Button, Card, Col, Container, Row, Table, ProgressBar } from "react-bootstrap";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LayoutRestrictArea from "~/component/layout/LayoutRestrictArea";
import { prisma } from "~/secure/db.server";
import { authenticator } from "~/secure/authentication.server";
import { Papel } from "@prisma/client";
import { formatarMoeda } from "~/shared/Number.util";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  const { id: remessaId } = params;

  if (!remessaId) {
    throw new Response("Remessa não encontrada", { status: 404 });
  }

  // Apenas ADMIN, SECRETARIA e SAUDE podem gerenciar
  const podeGerenciar =
    usuario?.papel === Papel.ADMIN ||
    usuario?.papel === Papel.SECRETARIA ||
    usuario?.papel === Papel.SAUDE;

  if (!podeGerenciar) {
    throw new Response("Não autorizado", { status: 403 });
  }

    // Buscar remessa com interesses
    const remessa = await prisma.remessa.findUnique({
      where: { id: remessaId },
      include: {
        Interesses: {
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
            criado_em: "desc",
          },
        },
      },
    });  if (!remessa) {
    throw new Response("Remessa não encontrada", { status: 404 });
  }

  // Estatísticas
  const totalInteresses = remessa.Interesses.length;
  const interessesAprovados = remessa.Interesses.filter((i) => i.aprovado).length;
  const interessesPendentes = totalInteresses - interessesAprovados;
  const quantidadeSolicitada = remessa.Interesses.reduce(
    (acc, i) => acc + (i.aprovado ? i.quantidade : 0),
    0
  );

  return json({
    remessa,
    totalInteresses,
    interessesAprovados,
    interessesPendentes,
    quantidadeSolicitada,
    usuario,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  const podeGerenciar =
    usuario?.papel === Papel.ADMIN ||
    usuario?.papel === Papel.SECRETARIA ||
    usuario?.papel === Papel.SAUDE;

  if (!podeGerenciar) {
    throw new Response("Não autorizado", { status: 403 });
  }

  const formData = await request.formData();
  const interesseId = formData.get("interesseId") as string;
  const acao = formData.get("acao") as string;

  if (!interesseId || !acao) {
    return json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    if (acao === "aprovar") {
      // Buscar interesse
      const interesse = await prisma.interesse.findUnique({
        where: { id: interesseId },
        include: { remessa: true },
      });

      if (!interesse) {
        return json({ error: "Interesse não encontrado" }, { status: 404 });
      }

      // Verificar disponibilidade
      if (interesse.quantidade > interesse.remessa.quantidade_disponivel) {
        return json(
          { error: "Quantidade indisponível" },
          { status: 400 }
        );
      }

      // Aprovar interesse e atualizar quantidade disponível
      await prisma.$transaction([
        prisma.interesse.update({
          where: { id: interesseId },
          data: { aprovado: true },
        }),
        prisma.remessa.update({
          where: { id: interesse.remessaId },
          data: {
            quantidade_disponivel: {
              decrement: interesse.quantidade,
            },
          },
        }),
      ]);
    } else if (acao === "reprovar") {
      await prisma.interesse.delete({
        where: { id: interesseId },
      });
    } else if (acao === "cancelar_aprovacao") {
      // Buscar interesse
      const interesse = await prisma.interesse.findUnique({
        where: { id: interesseId },
      });

      if (!interesse) {
        return json({ error: "Interesse não encontrado" }, { status: 404 });
      }

      // Cancelar aprovação e devolver quantidade
      await prisma.$transaction([
        prisma.interesse.update({
          where: { id: interesseId },
          data: { aprovado: false },
        }),
        prisma.remessa.update({
          where: { id: interesse.remessaId },
          data: {
            quantidade_disponivel: {
              increment: interesse.quantidade,
            },
          },
        }),
      ]);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Erro ao processar ação:", error);
    return json({ error: "Erro ao processar ação" }, { status: 500 });
  }
}

export default function DetalhesRemessa() {
  const {
    remessa,
    totalInteresses,
    interessesAprovados,
    interessesPendentes,
    quantidadeSolicitada,
    usuario,
  } = useLoaderData<typeof loader>();

  const percentualDisponivel =
    (remessa.quantidade_disponivel / remessa.quantidade_total) * 100;

  const dataLimite = new Date(remessa.data_limite);
  const hoje = new Date();
  const diasRestantes = Math.ceil(
    (dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
  const estaVencida = diasRestantes < 0;

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>📦 {remessa.nome}</h2>
                <p className="text-muted">Gerenciamento de interesses da remessa</p>
              </div>
              <Button variant="outline-secondary" href="/app/medicacao">
                <i className="las la-arrow-left"></i> Voltar
              </Button>
            </div>
          </Col>
        </Row>

        {/* Informações da Remessa */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Row className="g-3">
                  <Col md={3}>
                    <div className="border-start border-primary border-3 ps-3">
                      <small className="text-muted d-block">Status</small>
                      {estaVencida ? (
                        <Badge bg="danger">Encerrada</Badge>
                      ) : (
                        <Badge bg="success">Ativa</Badge>
                      )}
                    </div>
                  </Col>

                  <Col md={3}>
                    <div className="border-start border-info border-3 ps-3">
                      <small className="text-muted d-block">Data Limite</small>
                      <strong>
                        {format(dataLimite, "dd/MM/yyyy", { locale: ptBR })}
                      </strong>
                      {!estaVencida && (
                        <Badge bg="info" className="ms-2">
                          {diasRestantes}d
                        </Badge>
                      )}
                    </div>
                  </Col>

                  <Col md={3}>
                    <div className="border-start border-warning border-3 ps-3">
                      <small className="text-muted d-block">Disponível</small>
                      <strong>
                        {remessa.quantidade_disponivel} / {remessa.quantidade_total}
                      </strong>
                      <div className="mt-1">
                        <ProgressBar
                          now={percentualDisponivel}
                          variant={
                            percentualDisponivel > 50
                              ? "success"
                              : percentualDisponivel > 20
                              ? "warning"
                              : "danger"
                          }
                          style={{ height: "8px" }}
                        />
                      </div>
                    </div>
                  </Col>

                  {remessa.valor_unitario && (
                    <Col md={3}>
                      <div className="border-start border-success border-3 ps-3">
                        <small className="text-muted d-block">Valor Unitário</small>
                        <strong className="text-success">
                          {formatarMoeda(Number(remessa.valor_unitario))}
                        </strong>
                      </div>
                    </Col>
                  )}
                </Row>

                {remessa.descricao && (
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted d-block mb-1">Descrição</small>
                    <p className="mb-0">{remessa.descricao}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Estatísticas dos Interesses */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Total de Interesses</p>
                    <h4 className="mb-0">{totalInteresses}</h4>
                  </div>
                  <i className="las la-list fs-2 text-primary opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Aprovados</p>
                    <h4 className="mb-0 text-success">{interessesAprovados}</h4>
                  </div>
                  <i className="las la-check-circle fs-2 text-success opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Pendentes</p>
                    <h4 className="mb-0 text-warning">{interessesPendentes}</h4>
                  </div>
                  <i className="las la-clock fs-2 text-warning opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Qtd. Aprovada</p>
                    <h4 className="mb-0">{quantidadeSolicitada} un.</h4>
                  </div>
                  <i className="las la-cubes fs-2 text-info opacity-50"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Listagem de Interesses */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">
                  <i className="las la-users"></i> Interesses Manifestados
                </h5>

                {remessa.Interesses.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="las la-inbox fs-1 d-block mb-2"></i>
                    <p>Nenhum interesse manifestado ainda.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="table-light">
                        <tr>
                          <th>Associado</th>
                          <th>CPF</th>
                          <th>Telefone</th>
                          <th>Quantidade</th>
                          <th>Observação</th>
                          <th>Data</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {remessa.Interesses.map((interesse) => (
                          <tr key={interesse.id}>
                            <td>
                              <div className="fw-bold">
                                {interesse.associado.perfil.nome_completo}
                              </div>
                            </td>
                            <td>
                              <code className="small">
                                {interesse.associado.perfil.cpf || "-"}
                              </code>
                            </td>
                            <td>{interesse.associado.perfil.telefone || "-"}</td>
                            <td>
                              <Badge bg="secondary">{interesse.quantidade} un.</Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {interesse.observacao
                                  ? interesse.observacao.substring(0, 50) +
                                    (interesse.observacao.length > 50 ? "..." : "")
                                  : "-"}
                              </small>
                            </td>
                            <td>
                              {format(new Date(interesse.criado_em), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </td>
                            <td>
                              {interesse.aprovado ? (
                                <Badge bg="success">
                                  <i className="las la-check"></i> Aprovado
                                </Badge>
                              ) : (
                                <Badge bg="warning" text="dark">
                                  <i className="las la-clock"></i> Pendente
                                </Badge>
                              )}
                            </td>
                            <td>
                              <Form method="post" className="d-inline">
                                <input
                                  type="hidden"
                                  name="interesseId"
                                  value={interesse.id}
                                />
                                {interesse.aprovado ? (
                                  <Button
                                    type="submit"
                                    name="acao"
                                    value="cancelar_aprovacao"
                                    variant="outline-warning"
                                    size="sm"
                                    title="Cancelar aprovação"
                                  >
                                    <i className="las la-undo"></i>
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      type="submit"
                                      name="acao"
                                      value="aprovar"
                                      variant="outline-success"
                                      size="sm"
                                      className="me-1"
                                      title="Aprovar"
                                      disabled={
                                        interesse.quantidade >
                                        remessa.quantidade_disponivel
                                      }
                                    >
                                      <i className="las la-check"></i>
                                    </Button>
                                    <Button
                                      type="submit"
                                      name="acao"
                                      value="reprovar"
                                      variant="outline-danger"
                                      size="sm"
                                      title="Reprovar"
                                    >
                                      <i className="las la-times"></i>
                                    </Button>
                                  </>
                                )}
                              </Form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
}
