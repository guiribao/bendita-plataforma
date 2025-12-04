import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Button, Card, Col, Container, Row, Alert, Badge } from "react-bootstrap";
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

  // Buscar remessa
  const remessa = await prisma.remessa.findUnique({
    where: { id: remessaId },
  });

  if (!remessa) {
    throw new Response("Remessa não encontrada", { status: 404 });
  }

  // Buscar perfil do associado
  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      Associacao: {
        include: {
          Interesses: {
            where: {
              remessaId,
            },
          },
        },
      },
    },
  });

  if (!perfil?.Associacao) {
    throw new Response("Perfil de associado não encontrado", { status: 404 });
  }

  // Verificar se já demonstrou interesse
  if (perfil.Associacao.Interesses.length > 0) {
    return redirect("/app/medicacao");
  }

  // Verificar se a remessa ainda está dentro do prazo
  const dataLimite = new Date(remessa.data_limite);
  const hoje = new Date();
  if (dataLimite < hoje) {
    return redirect("/app/medicacao");
  }

  return json({
    remessa,
    perfil,
    associadoId: perfil.Associacao.id,
    usuario,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  const { id: remessaId } = params;

  if (!remessaId) {
    throw new Response("Remessa não encontrada", { status: 404 });
  }

  const formData = await request.formData();
  const quantidade = parseInt(formData.get("quantidade") as string);
  const observacao = formData.get("observacao") as string;

  // Buscar perfil do associado
  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      Associacao: true,
    },
  });

  if (!perfil?.Associacao) {
    throw new Response("Perfil de associado não encontrado", { status: 404 });
  }

  // Validações
  const errors: any = {};

  if (!quantidade || quantidade <= 0) {
    errors.quantidade = "Quantidade deve ser maior que zero";
  }

  // Buscar remessa para validar disponibilidade
  const remessa = await prisma.remessa.findUnique({
    where: { id: remessaId },
  });

  if (!remessa) {
    errors.geral = "Remessa não encontrada";
  } else if (quantidade > remessa.quantidade_disponivel) {
    errors.quantidade = `Quantidade solicitada excede a disponibilidade (${remessa.quantidade_disponivel} unidades)`;
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    await prisma.interesse.create({
      data: {
        remessaId,
        associadoId: perfil.Associacao.id,
        quantidade,
        observacao: observacao?.trim() || null,
      },
    });

    return redirect("/app/medicacao");
  } catch (error) {
    console.error("Erro ao registrar interesse:", error);
    return json(
      { errors: { geral: "Erro ao registrar interesse. Tente novamente." } },
      { status: 500 }
    );
  }
}

export default function DemonstrarInteresse() {
  const { remessa, perfil, usuario } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const dataLimite = new Date(remessa.data_limite);
  const hoje = new Date();
  const diasRestantes = Math.ceil(
    (dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h2>🖐️ Demonstrar Interesse</h2>
            <p className="text-muted">
              Preencha as informações para manifestar seu interesse nesta remessa
            </p>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            {actionData?.errors?.geral && (
              <Alert variant="danger" className="mb-3">
                {actionData.errors.geral}
              </Alert>
            )}

            {/* Informações da Remessa */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4 className="mb-0">{remessa.nome}</h4>
                  <Badge bg="success">Ativa</Badge>
                </div>

                {remessa.descricao && (
                  <p className="text-muted mb-3">{remessa.descricao}</p>
                )}

                <Row className="g-3">
                  <Col md={6}>
                    <div className="border-start border-primary border-3 ps-3">
                      <small className="text-muted d-block">Disponível</small>
                      <strong className="fs-5">
                        {remessa.quantidade_disponivel} / {remessa.quantidade_total}{" "}
                        unidades
                      </strong>
                    </div>
                  </Col>

                  {remessa.valor_unitario && (
                    <Col md={6}>
                      <div className="border-start border-success border-3 ps-3">
                        <small className="text-muted d-block">Valor Unitário</small>
                        <strong className="fs-5 text-success">
                          {formatarMoeda(Number(remessa.valor_unitario))}
                        </strong>
                      </div>
                    </Col>
                  )}

                  <Col md={6}>
                    <div className="border-start border-warning border-3 ps-3">
                      <small className="text-muted d-block">Data Limite</small>
                      <strong className="fs-5">
                        {format(dataLimite, "dd/MM/yyyy", { locale: ptBR })}
                      </strong>
                      <Badge bg="info" className="ms-2">
                        {diasRestantes}d restantes
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Formulário */}
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">Seu Interesse</h5>

                <Form method="post">
                  <Row>
                    <Col md={12}>
                      <div className="mb-3">
                        <label htmlFor="quantidade" className="form-label">
                          Quantidade Desejada (unidades){" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          id="quantidade"
                          name="quantidade"
                          className={`form-control ${
                            actionData?.errors?.quantidade ? "is-invalid" : ""
                          }`}
                          min="1"
                          max={remessa.quantidade_disponivel}
                          placeholder="1"
                          required
                        />
                        {actionData?.errors?.quantidade && (
                          <div className="invalid-feedback">
                            {actionData.errors.quantidade}
                          </div>
                        )}
                        <small className="text-muted">
                          Máximo disponível: {remessa.quantidade_disponivel} unidades
                        </small>
                      </div>
                    </Col>

                    <Col md={12}>
                      <div className="mb-3">
                        <label htmlFor="observacao" className="form-label">
                          Observações
                        </label>
                        <textarea
                          id="observacao"
                          name="observacao"
                          className="form-control"
                          rows={4}
                          placeholder="Adicione informações relevantes sobre seu interesse (opcional)"
                        />
                        <small className="text-muted">Opcional</small>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 mt-4">
                    <Button type="submit" variant="primary" size="lg">
                      <i className="las la-hand-paper"></i> Confirmar Interesse
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="lg"
                      href="/app/medicacao"
                    >
                      <i className="las la-times"></i> Cancelar
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 bg-light mb-3">
              <Card.Body>
                <h6 className="mb-3">
                  <i className="las la-user"></i> Seus Dados
                </h6>
                <div className="small">
                  <div className="mb-2">
                    <strong>Nome:</strong> {perfil.nome_completo}
                  </div>
                  {perfil.cpf && (
                    <div className="mb-2">
                      <strong>CPF:</strong> {perfil.cpf}
                    </div>
                  )}
                  {perfil.telefone && (
                    <div className="mb-2">
                      <strong>Telefone:</strong> {perfil.telefone}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 bg-info bg-opacity-10">
              <Card.Body>
                <h6 className="mb-3">
                  <i className="las la-info-circle text-info"></i> Importante
                </h6>
                <ul className="small mb-0">
                  <li className="mb-2">
                    Seu interesse será analisado pela equipe administrativa.
                  </li>
                  <li className="mb-2">
                    Você será notificado sobre a aprovação ou recusa.
                  </li>
                  <li className="mb-2">
                    A quantidade solicitada pode ser ajustada conforme
                    disponibilidade.
                  </li>
                  <li>
                    Certifique-se de estar com os pagamentos em dia.
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </LayoutRestrictArea>
  );
}
