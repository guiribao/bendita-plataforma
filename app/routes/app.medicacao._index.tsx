import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Badge, Button, Card, Col, Container, Row, Table, ProgressBar } from "react-bootstrap";
import { format } from "date-fns";
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

  const isAdmin = usuario?.papel === Papel.ADMIN;
  const isSecretaria = usuario?.papel === Papel.SECRETARIA;
  const isSaude = usuario?.papel === Papel.SAUDE;
  const isAssociado = usuario?.papel === Papel.ASSOCIADO;
  const podeGerenciar = isAdmin || isSecretaria || isSaude;

  // Buscar remessas ativas (para admin, sem expor dados de interesses de outros usuários)
  const remessas = await prisma.remessa.findMany({
    where: {
      ativa: true,
    },
    include: {
      _count: {
        select: {
          Interesses: true,
        },
      },
    },
    orderBy: {
      criado_em: "desc",
    },
  });

  // Se for associado, buscar seus interesses
  let meuPerfil = null;
  let meusInteresses: any[] = [];
  
  if (isAssociado) {
    meuPerfil = await prisma.perfil.findUnique({
      where: { usuarioId: usuario.id },
      include: {
        Associacao: {
          include: {
            Interesses: {
              include: {
                remessa: true,
              },
            },
          },
        },
      },
    });

    if (meuPerfil?.Associacao) {
      meusInteresses = meuPerfil.Associacao.Interesses;
    }
  }

  // Estatísticas para gestores
  let stats = null;
  if (podeGerenciar) {
    const totalRemessas = await prisma.remessa.count({ where: { ativa: true } });
    const totalInteresses = await prisma.interesse.count();
    const interessesAprovados = await prisma.interesse.count({ where: { aprovado: true } });
    const totalQuantidadeDisponivel = remessas.reduce(
      (acc, r) => acc + r.quantidade_disponivel,
      0
    );

    stats = {
      totalRemessas,
      totalInteresses,
      interessesAprovados,
      totalQuantidadeDisponivel,
    };
  }

  return json({
    remessas,
    podeGerenciar,
    isAssociado,
    meuPerfil,
    meusInteresses,
    stats,
    usuario,
  });
}

export default function Medicacao() {
  const { remessas, podeGerenciar, isAssociado, meuPerfil, meusInteresses, stats, usuario } =
    useLoaderData<typeof loader>();

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className="app-content">
        <Row className="align-items-center mt-3 mb-4">
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-pills la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className="mb-1">{podeGerenciar ? 'Gestão de Medicação' : 'Medicação'}</h2>
                <p className="text-muted mb-0">
                  {podeGerenciar
                    ? "Crie e gerencie remessas de medicação para os associados"
                    : "Visualize remessas disponíveis e acompanhe seus pedidos"}
                </p>
              </div>
            </div>
          </Col>
          <RoleBasedRender roles={['ADMIN', 'SECRETARIA', 'SAUDE']} userRole={usuario.papel}>
            <Col xs="auto">
              <Link to="/app/medicacao/nova-remessa">
                <Button variant="primary" size="lg">
                  <i className="las la-plus-circle"></i> Nova Remessa
                </Button>
              </Link>
            </Col>
          </RoleBasedRender>
        </Row>

        {/* Estatísticas para Gestores */}
        <RoleBasedRender roles={['ADMIN', 'SECRETARIA', 'SAUDE']} userRole={usuario.papel}>
        {stats && (
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-muted mb-1 small">Remessas Ativas</p>
                      <h4 className="mb-0">{stats.totalRemessas}</h4>
                    </div>
                    <i className="las la-boxes fs-2 text-primary opacity-50"></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-muted mb-1 small">Total de Interesses</p>
                      <h4 className="mb-0">{stats.totalInteresses}</h4>
                    </div>
                    <i className="las la-hand-paper fs-2 text-info opacity-50"></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-muted mb-1 small">Interesses Aprovados</p>
                      <h4 className="mb-0 text-success">{stats.interessesAprovados}</h4>
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
                      <p className="text-muted mb-1 small">Unidades Disponíveis</p>
                      <h4 className="mb-0 text-warning">{stats.totalQuantidadeDisponivel}</h4>
                    </div>
                    <i className="las la-cubes fs-2 text-warning opacity-50"></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
        </RoleBasedRender>

        {/* Meus Interesses (para Associados) */}
        <RoleBasedRender roles={['ASSOCIADO']} userRole={usuario.papel}>
        {meusInteresses.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">
                    <i className="las la-star text-warning"></i> Meus Interesses
                  </h5>
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Remessa</th>
                        <th>Quantidade Solicitada</th>
                        <th>Observação</th>
                        <th>Status</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meusInteresses.map((interesse) => (
                        <tr key={interesse.id}>
                          <td>
                            <div className="fw-bold">{interesse.remessa.nome}</div>
                          </td>
                          <td>{interesse.quantidade} unidades</td>
                          <td>
                            <small className="text-muted">
                              {interesse.observacao || "-"}
                            </small>
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
                            {format(new Date(interesse.criado_em), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
        </RoleBasedRender>

        {/* Listagem de Remessas */}
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">
                  <i className="las la-list"></i> {podeGerenciar ? 'Remessas Ativas' : 'Remessas Disponíveis'}
                </h5>

                {remessas.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="las la-inbox fs-1 d-block mb-2"></i>
                    <p>Nenhuma remessa disponível no momento.</p>
                    {podeGerenciar && (
                      <Link to="/app/medicacao/nova-remessa">
                        <Button variant="primary">
                          <i className="las la-plus"></i> Criar Primeira Remessa
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <Row className="g-3">
                    {remessas.map((remessa) => {
                      const percentualDisponivel =
                        (remessa.quantidade_disponivel / remessa.quantidade_total) * 100;
                      const dataLimite = new Date(remessa.data_limite);
                      const hoje = new Date();
                      const diasRestantes = Math.ceil(
                        (dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const estaVencida = diasRestantes < 0;
                      
                      // Verificar se o associado já demonstrou interesse
                      const meuInteresse = meusInteresses.find(
                        (i) => i.remessaId === remessa.id
                      );

                      return (
                        <Col key={remessa.id} md={6} lg={4}>
                          <Card className="h-100 border-0 shadow-sm hover-shadow">
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h5 className="mb-0">{remessa.nome}</h5>
                                {estaVencida ? (
                                  <Badge bg="danger">Encerrada</Badge>
                                ) : (
                                  <Badge bg="success">Ativa</Badge>
                                )}
                              </div>

                              {remessa.descricao && (
                                <p className="text-muted small mb-3">{remessa.descricao}</p>
                              )}

                              <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                  <small className="text-muted">Disponibilidade</small>
                                  <small className="fw-bold">
                                    {remessa.quantidade_disponivel} / {remessa.quantidade_total}
                                  </small>
                                </div>
                                <ProgressBar
                                  now={percentualDisponivel}
                                  variant={
                                    percentualDisponivel > 50
                                      ? "success"
                                      : percentualDisponivel > 20
                                      ? "warning"
                                      : "danger"
                                  }
                                />
                              </div>

                              <div className="mb-3">
                                <div className="d-flex justify-content-between">
                                  <span className="text-muted small">
                                    <i className="las la-calendar"></i> Prazo:
                                  </span>
                                  <span className="small">
                                    {format(dataLimite, "dd/MM/yyyy", { locale: ptBR })}
                                    {!estaVencida && (
                                      <Badge bg="info" className="ms-2">
                                        {diasRestantes}d
                                      </Badge>
                                    )}
                                  </span>
                                </div>

                                {remessa.valor_unitario && (
                                  <div className="d-flex justify-content-between mt-2">
                                    <span className="text-muted small">
                                      <i className="las la-tag"></i> Valor:
                                    </span>
                                    <span className="fw-bold text-success">
                                      {formatarMoeda(Number(remessa.valor_unitario))}
                                    </span>
                                  </div>
                                )}

                                <div className="d-flex justify-content-between mt-2">
                                  <span className="text-muted small">
                                    <i className="las la-users"></i> Interesses:
                                  </span>
                                  <span className="small">{remessa._count.Interesses}</span>
                                </div>
                              </div>

                              <div className="mt-auto">
                                {podeGerenciar ? (
                                  <Link
                                    to={`/app/medicacao/${remessa.id}`}
                                    className="w-100"
                                  >
                                    <Button variant="outline-primary" className="w-100">
                                      <i className="las la-eye"></i> Ver Detalhes
                                    </Button>
                                  </Link>
                                ) : isAssociado ? (
                                  meuInteresse ? (
                                    <Button variant="secondary" className="w-100" disabled>
                                      <i className="las la-check"></i> Interesse Registrado
                                    </Button>
                                  ) : estaVencida ? (
                                    <Button variant="secondary" className="w-100" disabled>
                                      Encerrada
                                    </Button>
                                  ) : remessa.quantidade_disponivel === 0 ? (
                                    <Button variant="secondary" className="w-100" disabled>
                                      Esgotada
                                    </Button>
                                  ) : (
                                    <Link
                                      to={`/app/medicacao/${remessa.id}/interesse`}
                                      className="w-100"
                                    >
                                      <Button variant="primary" className="w-100">
                                        <i className="las la-hand-paper"></i> Demonstrar Interesse
                                      </Button>
                                    </Link>
                                  )
                                ) : null}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
}
