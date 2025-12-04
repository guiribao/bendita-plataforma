import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge, Button, Card, Col, Container, Row, Table, Alert } from "react-bootstrap";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import LayoutRestrictArea from "~/component/layout/LayoutRestrictArea";
import { prisma } from "~/secure/db.server";
import { authenticator } from "~/secure/authentication.server";
import { Papel, type Usuario } from "@prisma/client";
import { formatarMoeda } from "~/shared/Number.util";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Meu Perfil - Associação Bendita Canábica" },
    {
      name: "description",
      content: "Visualize suas informações pessoais, documentos, pagamentos e histórico.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  // Buscar perfil completo
  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      usuario: true,
      Associacao: {
        include: {
          Documentos: {
            orderBy: { criado_em: "desc" },
            take: 10,
          },
          Pagamentos: {
            orderBy: { data_pagamento: "desc" },
            take: 10,
          },
          Interesses: {
            include: { remessa: true },
            orderBy: { criado_em: "desc" },
            take: 10,
          },
        },
      },
      Dependentes: {
        select: {
          id: true,
          perfil: { select: { nome_completo: true, apelido: true } },
        },
      },
    },
  });

  // Buscar tokens de recuperação de senha
  const tokensRecuperacao = await prisma.usuario_Esqueci_Senha.findMany({
    where: {
      usuarioId: usuario.id,
    },
    orderBy: {
      criado_em: "desc",
    },
    take: 10,
  });

  if (!perfil) {
    throw new Response("Perfil não encontrado", { status: 404 });
  }

  return json({
    perfil,
    usuario,
    tokensRecuperacao,
  });
}

export default function MeuPerfil() {
  const { perfil, usuario, tokensRecuperacao } = useLoaderData<typeof loader>();

  const isAssociado = perfil.Associacao !== null;
  const dependentes = perfil.Dependentes || [];
  const ultimoPagamento = perfil.Associacao?.Pagamentos?.[0];
  const proximoVencimento = ultimoPagamento
    ? new Date(ultimoPagamento.proximo_vencimento)
    : null;
  const hoje = new Date();
  const estaVigente = proximoVencimento ? proximoVencimento >= hoje : false;

  const papelLabel: Record<string, string> = {
    [Papel.ADMIN]: "Administrador",
    [Papel.SECRETARIA]: "Secretaria",
    [Papel.SAUDE]: "Profissional de Saúde",
    [Papel.ASSOCIADO]: "Associado",
    [Papel.ASSOCIADO_DEPENDENTE]: "Dependente",
  };

  return (
    <LayoutRestrictArea usuarioSistema={usuario as any}>
      <Container fluid className="app-content">
        <Row className="align-items-center mt-3 mb-4">
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-user-circle la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className="mb-1">Meu Perfil</h2>
                <p className="text-muted mb-0">Informações pessoais e detalhes da sua conta</p>
              </div>
            </div>
          </Col>
          <Col md="auto" className="d-flex gap-2">
            <Link to="/app/perfil/editar">
              <Button variant="primary" size="sm">
                <i className="las la-pen"></i> Editar Perfil
              </Button>
            </Link>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => alert("Funcionalidade em desenvolvimento")}
            >
              <i className="las la-key"></i> Mudar Senha
            </Button>
          </Col>
        </Row>

        {/* Informações Básicas */}
        <Row className="mb-4">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 pb-2 border-bottom">
                  <i className="las la-address-card"></i> Informações Pessoais
                </h5>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="border-start border-primary border-4 ps-3">
                      <small className="text-muted d-block">Nome Completo</small>
                      <strong className="d-block text-truncate">{perfil.nome_completo}</strong>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-start border-info border-4 ps-3">
                      <small className="text-muted d-block">Apelido</small>
                      <strong className="d-block text-truncate">{perfil.apelido || "-"}</strong>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-start border-success border-4 ps-3">
                      <small className="text-muted d-block">Data de Nascimento</small>
                      <strong className="d-block">
                        {perfil.data_nascimento && new Date(perfil.data_nascimento).getTime()
                          ? format(new Date(perfil.data_nascimento), "dd/MM/yyyy")
                          : "-"}
                      </strong>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-start border-warning border-4 ps-3">
                      <small className="text-muted d-block">Gênero</small>
                      <strong className="d-block">{perfil.sexo || "-"}</strong>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-start border-danger border-4 ps-3">
                      <small className="text-muted d-block">CPF</small>
                      <code className="small d-block">{perfil.cpf || "-"}</code>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-start border-secondary border-4 ps-3">
                      <small className="text-muted d-block">RG</small>
                      <code className="small d-block">{perfil.rg || "-"}</code>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-start border-primary border-4 ps-3">
                      <small className="text-muted d-block">Telefone</small>
                      <strong className="d-block">{perfil.telefone || "-"}</strong>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="border-start border-info border-4 ps-3">
                      <small className="text-muted d-block">Estado Civil</small>
                      <strong className="d-block">{perfil.estado_civil || "-"}</strong>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Informações de Conta */}
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3 pb-2 border-bottom">
                  <i className="las la-shield-alt"></i> Conta
                </h6>
                <div className="small">
                  <div className="mb-2">
                    <strong>Email:</strong>
                    <div className="text-break">{usuario.email}</div>
                  </div>
                  <div className="mb-2">
                    <strong>Papel:</strong>
                    <div>
                      <Badge bg="primary">{papelLabel[usuario.papel as string]}</Badge>
                    </div>
                  </div>
                  <div className="mb-2 d-flex justify-content-between">
                    <strong>Membro desde:</strong>
                    <span>{perfil.criado_em && new Date(perfil.criado_em).getTime() ? format(new Date(perfil.criado_em), "dd/MM/yyyy") : "-"}</span>
                  </div>
                  <div>
                    <strong>Último acesso:</strong>
                    <div>
                      <small className="text-muted">
                        {(usuario as any).atualizadoEm && new Date((usuario as any).atualizadoEm).getTime() ? format(new Date((usuario as any).atualizadoEm), "dd/MM/yyyy HH:mm") : "-"}
                      </small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Status de Associado */}
            {isAssociado && perfil.Associacao && (
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="mb-3 pb-2 border-bottom">
                    <i className="las la-heart"></i> Associado
                  </h6>
                  <div className="small">
                    <div className="mb-2">
                      <Badge bg="success">{perfil.Associacao.status}</Badge>
                      {perfil.Associacao.tipo_associado === "MEDICINAL" ? (
                        <Badge bg="primary" className="ms-1">
                          Medicinal
                        </Badge>
                      ) : (
                        <Badge bg="secondary" className="ms-1">
                          Apoiador
                        </Badge>
                      )}
                    </div>
                    {estaVigente && proximoVencimento && proximoVencimento.getTime && proximoVencimento.getTime() && (
                      <div className="mb-2 text-success fw-bold">
                        <i className="las la-check-circle"></i> Vigente até{" "}
                        {format(proximoVencimento, "dd/MM/yyyy")}
                      </div>
                    )}
                    {!estaVigente && (
                      <Alert variant="warning" className="mb-0 small mt-2">
                        <i className="las la-exclamation-triangle"></i> Pagamento pendente
                      </Alert>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Endereço */}
        {(perfil.endereco_rua ||
          perfil.endereco_cidade ||
          perfil.endereco_estado ||
          perfil.cep) && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 pb-2 border-bottom">
                    <i className="las la-map-marker-alt"></i> Endereço
                  </h5>
                  <Row className="g-3">
                    {perfil.endereco_rua && (
                      <Col md={9}>
                        <div>
                          <small className="text-muted">Logradouro</small>
                          <div className="fw-bold">
                            {perfil.endereco_rua}, {perfil.endereco_numero}
                            {perfil.endereco_complemento && ` - ${perfil.endereco_complemento}`}
                          </div>
                        </div>
                      </Col>
                    )}
                    {perfil.cep && (
                      <Col md={3}>
                        <div>
                          <small className="text-muted">CEP</small>
                          <div className="fw-bold">{perfil.cep}</div>
                        </div>
                      </Col>
                    )}
                    {perfil.endereco_bairro && (
                      <Col md={6}>
                        <div>
                          <small className="text-muted">Bairro</small>
                          <div className="fw-bold">{perfil.endereco_bairro}</div>
                        </div>
                      </Col>
                    )}
                    {perfil.endereco_cidade && (
                      <Col md={3}>
                        <div>
                          <small className="text-muted">Cidade</small>
                          <div className="fw-bold">{perfil.endereco_cidade}</div>
                        </div>
                      </Col>
                    )}
                    {perfil.endereco_estado && (
                      <Col md={3}>
                        <div>
                          <small className="text-muted">Estado</small>
                          <div className="fw-bold">{perfil.endereco_estado}</div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Redes Sociais */}
        {(perfil.redes_instagram || perfil.redes_linkedin) && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 pb-2 border-bottom">
                    <i className="las la-share-alt"></i> Redes Sociais
                  </h5>
                  <div className="d-flex gap-2">
                    {perfil.redes_instagram && (
                      <a
                        href={`https://instagram.com/${perfil.redes_instagram}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <i className="las la-instagram"></i> Instagram
                      </a>
                    )}
                    {perfil.redes_linkedin && (
                      <a
                        href={`https://linkedin.com/in/${perfil.redes_linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <i className="las la-linkedin"></i> LinkedIn
                      </a>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Documentos e Dependentes */}
        {isAssociado && perfil.Associacao && (
          <Row className="mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 pb-2 border-bottom">
                    <i className="las la-file-alt"></i> Documentos
                    <Badge bg="info" className="ms-2">
                      {perfil.Associacao.Documentos.length}
                    </Badge>
                  </h5>
                  {perfil.Associacao.Documentos.length === 0 ? (
                    <p className="text-muted small mb-0">Nenhum documento</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {perfil.Associacao.Documentos.slice(0, 5).map((doc) => (
                        <div key={doc.id} className="list-group-item px-0 py-2 border-0">
                          <div className="d-flex justify-content-between align-items-start small">
                            <div>
                              <strong>{doc.tipo}</strong>
                              <div className="text-muted">
                                {doc.criado_em && new Date(doc.criado_em).getTime() ? format(new Date(doc.criado_em), "dd/MM/yyyy") : "-"}
                              </div>
                            </div>
                            <i className="las la-file-pdf text-danger"></i>
                          </div>
                        </div>
                      ))}
                      {perfil.Associacao.Documentos.length > 5 && (
                        <p className="text-muted small mt-2 mb-0">
                          + {perfil.Associacao.Documentos.length - 5} documento(s)
                        </p>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 pb-2 border-bottom">
                    <i className="las la-users"></i> Dependentes
                    <Badge bg="info" className="ms-2">
                      {dependentes.length}
                    </Badge>
                  </h5>
                  {dependentes.length === 0 ? (
                    <p className="text-muted small mb-0">Nenhum dependente</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {dependentes.map((dep) => (
                        <div key={dep.id} className="list-group-item px-0 py-2 border-0">
                          <div className="d-flex align-items-center small">
                            <i className="las la-user-circle text-primary me-2" style={{ fontSize: "1.5rem" }}></i>
                            <div>
                              <strong>{dep.perfil.nome_completo}</strong>
                              {dep.perfil.apelido && (
                                <div className="text-muted">
                                  <small>{dep.perfil.apelido}</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Pagamentos Recentes */}
        {isAssociado && perfil.Associacao && perfil.Associacao.Pagamentos.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 pb-2 border-bottom">
                    <i className="las la-money-bill-wave"></i> Histórico de Pagamentos
                  </h5>
                  <div className="table-responsive">
                    <Table hover size="sm" className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="small">Data Pagamento</th>
                          <th className="small">Próx. Vencimento</th>
                          <th className="small">Valor</th>
                          <th className="small">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perfil.Associacao.Pagamentos.slice(0, 5).map((pag) => (
                          <tr key={pag.id}>
                            <td className="small">
                              {pag.data_pagamento && new Date(pag.data_pagamento).getTime() ? format(new Date(pag.data_pagamento), "dd/MM/yyyy") : "-"}
                            </td>
                            <td className="small">
                              {pag.proximo_vencimento && new Date(pag.proximo_vencimento).getTime() ? format(new Date(pag.proximo_vencimento), "dd/MM/yyyy") : "-"}
                            </td>
                            <td className="small fw-bold">{formatarMoeda(Number(pag.valor))}</td>
                            <td className="small">
                              <Badge bg="success">Pago</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  {perfil.Associacao.Pagamentos.length > 5 && (
                    <p className="text-muted small mt-3 mb-0">
                      <Link to="/app/financeiro" className="text-decoration-none">
                        Ver todos os pagamentos →
                      </Link>
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Interesses em Remessas */}
        {isAssociado && perfil.Associacao && perfil.Associacao.Interesses.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 pb-2 border-bottom">
                    <i className="las la-hand-paper"></i> Interesses em Remessas
                  </h5>
                  <div className="table-responsive">
                    <Table hover size="sm" className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="small">Remessa</th>
                          <th className="small">Qtd.</th>
                          <th className="small">Status</th>
                          <th className="small">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perfil.Associacao.Interesses.slice(0, 5).map((interesse) => (
                          <tr key={interesse.id}>
                            <td className="small">{interesse.remessa.nome}</td>
                            <td className="small">{interesse.quantidade} un.</td>
                            <td className="small">
                              {interesse.aprovado ? (
                                <Badge bg="success">Aprovado</Badge>
                              ) : (
                                <Badge bg="warning" text="dark">
                                  Pendente
                                </Badge>
                              )}
                            </td>
                            <td className="small">
                              {interesse.criado_em && new Date(interesse.criado_em).getTime() ? format(new Date(interesse.criado_em), "dd/MM/yyyy") : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Solicitações de Recuperação de Senha */}
        {tokensRecuperacao.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3 pb-2 border-bottom">
                    <i className="las la-key"></i> Lembretes de Senha
                  </h5>
                  <div className="table-responsive">
                    <Table hover size="sm" className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="small">Data Solicitação</th>
                          <th className="small">Válido até</th>
                          <th className="small">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokensRecuperacao.slice(0, 5).map((token) => (
                          <tr key={token.id}>
                            <td className="small">
                              <div>
                                {token.criado_em && new Date(token.criado_em).getTime() ? format(new Date(token.criado_em), "dd/MM/yyyy HH:mm") : "-"}
                              </div>
                              <small className="text-muted">
                                {token.criado_em && new Date(token.criado_em).getTime() ? formatDistanceToNow(new Date(token.criado_em), {
                                  locale: ptBR,
                                  addSuffix: true,
                                }) : "Data inválida"}
                              </small>
                            </td>
                            <td className="small">
                              {token.valido_ate && new Date(token.valido_ate).getTime() ? format(new Date(token.valido_ate), "dd/MM/yyyy HH:mm") : "-"}
                            </td>
                            <td className="small">
                              {token.ativo ? (
                                <Badge bg="warning" text="dark">
                                  Pendente
                                </Badge>
                              ) : (
                                <Badge bg="success">Utilizado</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Segurança e Ações */}
        <Row className="mb-4">
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 pb-2 border-bottom">
                  <i className="las la-lock"></i> Segurança
                </h5>
                <Button
                  variant="outline-primary"
                  className="w-100 mb-2"
                  onClick={() => alert("Funcionalidade em desenvolvimento")}
                >
                  <i className="las la-key"></i> Alterar Senha
                </Button>
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => alert("Funcionalidade em desenvolvimento")}
                >
                  <i className="las la-shield-alt"></i> Duas Autenticações
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 pb-2 border-bottom">
                  <i className="las la-file-contract"></i> Termos e Políticas
                </h5>
                <Button
                  variant="outline-secondary"
                  className="w-100 mb-2"
                  onClick={() => alert("Funcionalidade em desenvolvimento")}
                >
                  <i className="las la-scroll"></i> Visualizar Termos
                </Button>
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => alert("Funcionalidade em desenvolvimento")}
                >
                  <i className="las la-user-shield"></i> Política de Privacidade
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </LayoutRestrictArea>
  );
}
