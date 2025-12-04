import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Button, Card, Col, Container, Row, Alert } from "react-bootstrap";
import LayoutRestrictArea from "~/component/layout/LayoutRestrictArea";
import { prisma } from "~/secure/db.server";
import { authenticator } from "~/secure/authentication.server";
import { Papel } from "@prisma/client";

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  // Apenas ADMIN, SECRETARIA e SAUDE podem criar remessas
  const podeGerenciar =
    usuario?.papel === Papel.ADMIN ||
    usuario?.papel === Papel.SECRETARIA ||
    usuario?.papel === Papel.SAUDE;

  if (!podeGerenciar) {
    throw new Response("Não autorizado", { status: 403 });
  }

  const formData = await request.formData();
  const nome = formData.get("nome") as string;
  const descricao = formData.get("descricao") as string;
  const quantidade_total = parseInt(formData.get("quantidade_total") as string);
  const valor_unitario = formData.get("valor_unitario") as string;
  const data_limite = formData.get("data_limite") as string;

  // Validações
  const errors: any = {};

  if (!nome || nome.trim() === "") {
    errors.nome = "Nome é obrigatório";
  }

  if (!quantidade_total || quantidade_total <= 0) {
    errors.quantidade_total = "Quantidade deve ser maior que zero";
  }

  if (!data_limite) {
    errors.data_limite = "Data limite é obrigatória";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    await prisma.remessa.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        quantidade_total,
        quantidade_disponivel: quantidade_total,
        valor_unitario: valor_unitario ? parseFloat(valor_unitario) : null,
        data_limite: new Date(data_limite),
        criado_por_id: usuario.id,
      },
    });

    return redirect("/app/medicacao");
  } catch (error) {
    console.error("Erro ao criar remessa:", error);
    return json(
      { errors: { geral: "Erro ao criar remessa. Tente novamente." } },
      { status: 500 }
    );
  }
}

export async function loader({ request }: ActionFunctionArgs) {
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

  return json({ usuario });
}

export default function NovaRemessa() {
  const actionData = useActionData<typeof action>();
  const { usuario } = useActionData<typeof loader>() || {};

  return (
    <LayoutRestrictArea usuarioSistema={{ papel: Papel.ADMIN } as any}>
      <Container fluid className="app-content">
        <Row className="align-items-center mt-3 mb-4">
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-box la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className="mb-1">Nova Remessa de Medicação</h2>
                <p className="text-muted mb-0">
                  Preencha as informações abaixo para criar uma nova remessa
                </p>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {actionData?.errors?.geral && (
                  <Alert variant="danger">{actionData.errors.geral}</Alert>
                )}

                <Form method="post">
                  <Row>
                    <Col md={12}>
                      <div className="mb-3">
                        <label htmlFor="nome" className="form-label">
                          Nome da Remessa <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="nome"
                          name="nome"
                          className={`form-control ${
                            actionData?.errors?.nome ? "is-invalid" : ""
                          }`}
                          placeholder="Ex: Óleo CBD 5% - Lote 001/2025"
                          required
                        />
                        {actionData?.errors?.nome && (
                          <div className="invalid-feedback">
                            {actionData.errors.nome}
                          </div>
                        )}
                      </div>
                    </Col>

                    <Col md={12}>
                      <div className="mb-3">
                        <label htmlFor="descricao" className="form-label">
                          Descrição
                        </label>
                        <textarea
                          id="descricao"
                          name="descricao"
                          className="form-control"
                          rows={4}
                          placeholder="Descreva detalhes sobre a remessa, composição, instruções, etc."
                        />
                        <small className="text-muted">Opcional</small>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="mb-3">
                        <label htmlFor="quantidade_total" className="form-label">
                          Quantidade Total (unidades){" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          id="quantidade_total"
                          name="quantidade_total"
                          className={`form-control ${
                            actionData?.errors?.quantidade_total ? "is-invalid" : ""
                          }`}
                          min="1"
                          placeholder="100"
                          required
                        />
                        {actionData?.errors?.quantidade_total && (
                          <div className="invalid-feedback">
                            {actionData.errors.quantidade_total}
                          </div>
                        )}
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="mb-3">
                        <label htmlFor="valor_unitario" className="form-label">
                          Valor Unitário (R$)
                        </label>
                        <input
                          type="number"
                          id="valor_unitario"
                          name="valor_unitario"
                          className="form-control"
                          step="0.01"
                          min="0"
                          placeholder="150.00"
                        />
                        <small className="text-muted">Opcional</small>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="mb-3">
                        <label htmlFor="data_limite" className="form-label">
                          Data Limite para Manifestação{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          id="data_limite"
                          name="data_limite"
                          className={`form-control ${
                            actionData?.errors?.data_limite ? "is-invalid" : ""
                          }`}
                          required
                        />
                        {actionData?.errors?.data_limite && (
                          <div className="invalid-feedback">
                            {actionData.errors.data_limite}
                          </div>
                        )}
                        <small className="text-muted">
                          Data limite para associados demonstrarem interesse
                        </small>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 mt-4">
                    <Button type="submit" variant="primary" size="lg">
                      <i className="las la-save"></i> Criar Remessa
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
            <Card className="border-0 bg-light">
              <Card.Body>
                <h5 className="mb-3">
                  <i className="las la-info-circle"></i> Informações
                </h5>
                <ul className="small">
                  <li className="mb-2">
                    A remessa ficará disponível para os associados demonstrarem
                    interesse até a data limite.
                  </li>
                  <li className="mb-2">
                    A quantidade disponível será atualizada conforme os interesses
                    forem aprovados.
                  </li>
                  <li className="mb-2">
                    Você poderá gerenciar os interesses após criar a remessa.
                  </li>
                  <li className="mb-2">
                    O valor unitário é opcional e serve como referência.
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
