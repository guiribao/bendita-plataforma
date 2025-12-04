import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, Link } from "@remix-run/react";
import { Button, Card, Col, Container, Row, Form as BSForm, Alert, Tabs, Tab } from "react-bootstrap";
import { useState } from "react";
import LayoutRestrictArea from "~/component/layout/LayoutRestrictArea";
import { InputMaskClient } from "~/component/InputMaskClient";
import { prisma } from "~/secure/db.server";
import { authenticator } from "~/secure/authentication.server";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Editar Perfil - Associação Bendita Canábica" },
    {
      name: "description",
      content: "Edite suas informações pessoais, endereço e dados de saúde.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: (usuario as any).id },
    include: {
      Associacao: true,
    },
  });

  if (!perfil) {
    throw new Response("Perfil não encontrado", { status: 404 });
  }

  return json({ perfil, usuario });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Método não permitido" }, { status: 405 });
  }

  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: "/autentica/entrar",
  });

  const formData = await request.formData();
  const tipo = formData.get("tipo");

  try {
    if (tipo === "pessoal") {
      await prisma.perfil.update({
        where: { usuarioId: (usuario as any).id },
        data: {
          nome_completo: formData.get("nome_completo") as string,
          apelido: (formData.get("apelido") as string) || null,
          data_nascimento: formData.get("data_nascimento") ? new Date(formData.get("data_nascimento") as string) : undefined,
          sexo: (formData.get("sexo") as string) || null,
          cpf: (formData.get("cpf") as string) || null,
          rg: (formData.get("rg") as string) || null,
          nacionalidade: (formData.get("nacionalidade") as string) || null,
          estado_civil: (formData.get("estado_civil") as string) || null,
          telefone: (formData.get("telefone") as string) || null,
        },
      });

      return json({ success: true, message: "Informações pessoais atualizadas com sucesso!" });
    }

    if (tipo === "endereco") {
      await prisma.perfil.update({
        where: { usuarioId: (usuario as any).id },
        data: {
          cep: (formData.get("cep") as string) || null,
          endereco_rua: (formData.get("endereco_rua") as string) || null,
          endereco_numero: (formData.get("endereco_numero") as string) || null,
          endereco_complemento: (formData.get("endereco_complemento") as string) || null,
          endereco_bairro: (formData.get("endereco_bairro") as string) || null,
          endereco_cidade: (formData.get("endereco_cidade") as string) || null,
          endereco_estado: (formData.get("endereco_estado") as string) || null,
        },
      });

      return json({ success: true, message: "Endereço atualizado com sucesso!" });
    }

    if (tipo === "redes") {
      await prisma.perfil.update({
        where: { usuarioId: (usuario as any).id },
        data: {
          redes_instagram: (formData.get("redes_instagram") as string) || null,
          redes_linkedin: (formData.get("redes_linkedin") as string) || null,
        },
      });

      return json({ success: true, message: "Redes sociais atualizadas com sucesso!" });
    }

    if (tipo === "saude") {
      const perfil = await prisma.perfil.findUnique({
        where: { usuarioId: (usuario as any).id },
        include: { Associacao: true },
      });

      if (!perfil?.Associacao) {
        return json({ error: "Você não é um associado" }, { status: 400 });
      }

      await prisma.associado.update({
        where: { id: perfil.Associacao.id },
        data: {
          saude_quadro_geral: (formData.get("saude_quadro_geral") as string) || null,
          saude_uso_medicacao: formData.get("saude_uso_medicacao") === "on",
          saude_uso_medicacao_nome: (formData.get("saude_uso_medicacao_nome") as string) || null,
          saude_uso_terapeutico_canabis: formData.get("saude_uso_terapeutico_canabis") === "on",
          saude_uso_terapeutico_canabis_experiencia: (formData.get("saude_uso_terapeutico_canabis_experiencia") as string) || null,
          saude_medico_prescritor: formData.get("saude_medico_prescritor") === "on",
          saude_medico_prescritor_nome: (formData.get("saude_medico_prescritor_nome") as string) || null,
          saude_medico_prescritor_crm: (formData.get("saude_medico_prescritor_crm") as string) || null,
        },
      });

      return json({ success: true, message: "Informações de saúde atualizadas com sucesso!" });
    }

    return json({ error: "Tipo de atualização desconhecido" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return json({ error: "Erro ao atualizar perfil. Tente novamente." }, { status: 500 });
  }
}

export default function EditarPerfilPage() {
  const { perfil, usuario } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [activeTab, setActiveTab] = useState("pessoal");

  return (
    <LayoutRestrictArea usuarioSistema={usuario as any}>
      <Container fluid className="app-content">
        <Row className="align-items-center mt-3 mb-4">
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-user-edit la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className="mb-1">Editar Meu Perfil</h2>
                <p className="text-muted mb-0">Atualize suas informações pessoais e detalhes da sua conta</p>
              </div>
            </div>
          </Col>
          <Col md="auto">
            <Link to="/app/perfil">
              <Button variant="outline-secondary">
                <i className="las la-arrow-left"></i> Voltar
              </Button>
            </Link>
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

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Tabs
              id="editar-tabs"
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || "pessoal")}
              className="mb-0"
            >
              {/* Abas de Informações Pessoais */}
              <Tab eventKey="pessoal" title={<><i className="las la-user"></i> Pessoais</>}>
                <div className="p-4">
                  <Form method="post">
                    <input type="hidden" name="tipo" value="pessoal" />

                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <strong>Nome Completo</strong>
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="nome_completo"
                            defaultValue={perfil.nome_completo}
                            required
                          />
                        </BSForm.Group>
                      </Col>
                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>Apelido</BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="apelido"
                            defaultValue={perfil.apelido || ""}
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <strong>Data de Nascimento</strong>
                          </BSForm.Label>
                          <BSForm.Control
                            type="date"
                            name="data_nascimento"
                            defaultValue={perfil.data_nascimento ? new Date(perfil.data_nascimento).toISOString().split('T')[0] : ""}
                            required
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>Gênero</BSForm.Label>
                          <BSForm.Select name="sexo" defaultValue={perfil.sexo || ""}>
                            <option value="">Selecionar...</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                            <option value="O">Outro</option>
                            <option value="N">Prefiro não informar</option>
                          </BSForm.Select>
                        </BSForm.Group>
                      </Col>

                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>CPF</BSForm.Label>
                          <InputMaskClient
                            type="text"
                            name="cpf"
                            id="cpf"
                            autoComplete="off"
                            mask="999.999.999-99"
                            maskPlaceholder={"_"}
                            defaultValue={perfil.cpf || ""}
                            placeholder="000.000.000-00"
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>RG</BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="rg"
                            defaultValue={perfil.rg || ""}
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>Nacionalidade</BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="nacionalidade"
                            defaultValue={perfil.nacionalidade || ""}
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>Estado Civil</BSForm.Label>
                          <BSForm.Select name="estado_civil" defaultValue={perfil.estado_civil || ""}>
                            <option value="">Selecionar...</option>
                            <option value="SOLTEIRO">Solteiro(a)</option>
                            <option value="CASADO">Casado(a)</option>
                            <option value="DIVORCIADO">Divorciado(a)</option>
                            <option value="VIUVO">Viúvo(a)</option>
                            <option value="UNIAO_ESTAVEL">União estável</option>
                          </BSForm.Select>
                        </BSForm.Group>
                      </Col>

                      <Col md={12}>
                        <BSForm.Group>
                          <BSForm.Label>Telefone</BSForm.Label>
                          <InputMaskClient
                            type="text"
                            name="telefone"
                            id="telefone"
                            autoComplete="off"
                            mask="+55 (99) 9 9999-9999"
                            maskPlaceholder={"_"}
                            defaultValue={perfil.telefone || ""}
                            placeholder="(00) 9 0000-0000"
                          />
                        </BSForm.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button variant="primary" type="submit">
                        <i className="las la-save"></i> Salvar Alterações
                      </Button>
                      <Button variant="outline-secondary" as={Link} to="/app/perfil">
                        Cancelar
                      </Button>
                    </div>
                  </Form>
                </div>
              </Tab>

              {/* Abas de Endereço */}
              <Tab eventKey="endereco" title={<><i className="las la-map-marker-alt"></i> Endereço</>}>
                <div className="p-4">
                  <Form method="post">
                    <input type="hidden" name="tipo" value="endereco" />

                    <Row className="g-3 mb-3">
                      <Col md={3}>
                        <BSForm.Group>
                          <BSForm.Label>CEP</BSForm.Label>
                          <InputMaskClient
                            type="text"
                            name="cep"
                            id="cep"
                            autoComplete="off"
                            mask="99999-999"
                            maskPlaceholder={"_"}
                            defaultValue={perfil.cep || ""}
                            placeholder="00000-000"
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={9}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <strong>Logradouro</strong>
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="endereco_rua"
                            defaultValue={perfil.endereco_rua || ""}
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={3}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <strong>Número</strong>
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="endereco_numero"
                            defaultValue={perfil.endereco_numero || ""}
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={9}>
                        <BSForm.Group>
                          <BSForm.Label>Complemento</BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="endereco_complemento"
                            defaultValue={perfil.endereco_complemento || ""}
                            placeholder="Apto, Sala, etc."
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={4}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <strong>Bairro</strong>
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="endereco_bairro"
                            defaultValue={perfil.endereco_bairro || ""}
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={5}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <strong>Cidade</strong>
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="endereco_cidade"
                            defaultValue={perfil.endereco_cidade || ""}
                          />
                        </BSForm.Group>
                      </Col>

                      <Col md={3}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <strong>Estado</strong>
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="endereco_estado"
                            defaultValue={perfil.endereco_estado || ""}
                            placeholder="SP"
                            maxLength={2}
                          />
                        </BSForm.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button variant="primary" type="submit">
                        <i className="las la-save"></i> Salvar Alterações
                      </Button>
                      <Button variant="outline-secondary" as={Link} to="/app/perfil">
                        Cancelar
                      </Button>
                    </div>
                  </Form>
                </div>
              </Tab>

              {/* Abas de Redes Sociais */}
              <Tab eventKey="redes" title={<><i className="las la-share-alt"></i> Redes Sociais</>}>
                <div className="p-4">
                  <Form method="post">
                    <input type="hidden" name="tipo" value="redes" />

                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <i className="lab la-instagram"></i> Instagram
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="redes_instagram"
                            defaultValue={perfil.redes_instagram || ""}
                            placeholder="seu_usuario"
                          />
                          <small className="text-muted">Apenas o nome de usuário, sem @</small>
                        </BSForm.Group>
                      </Col>

                      <Col md={6}>
                        <BSForm.Group>
                          <BSForm.Label>
                            <i className="lab la-linkedin"></i> LinkedIn
                          </BSForm.Label>
                          <BSForm.Control
                            type="text"
                            name="redes_linkedin"
                            defaultValue={perfil.redes_linkedin || ""}
                            placeholder="seu-nome-completo"
                          />
                          <small className="text-muted">Apenas o ID do seu perfil</small>
                        </BSForm.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button variant="primary" type="submit">
                        <i className="las la-save"></i> Salvar Alterações
                      </Button>
                      <Button variant="outline-secondary" as={Link} to="/app/perfil">
                        Cancelar
                      </Button>
                    </div>
                  </Form>
                </div>
              </Tab>

              {/* Abas de Saúde (apenas se for associado) */}
              {perfil.Associacao && (
                <Tab eventKey="saude" title={<><i className="las la-heartbeat"></i> Saúde</>}>
                  <div className="p-4">
                    <Form method="post">
                      <input type="hidden" name="tipo" value="saude" />

                      <Row className="g-3 mb-3">
                        <Col md={12}>
                          <BSForm.Group>
                            <BSForm.Label>Quadro Geral de Saúde</BSForm.Label>
                            <BSForm.Control
                              as="textarea"
                              rows={3}
                              name="saude_quadro_geral"
                              defaultValue={perfil.Associacao.saude_quadro_geral || ""}
                              placeholder="Descreva seu quadro geral de saúde..."
                            />
                          </BSForm.Group>
                        </Col>

                        <Col md={12}>
                          <BSForm.Group>
                            <BSForm.Check
                              type="checkbox"
                              name="saude_uso_medicacao"
                              label="Faço uso de medicação"
                              defaultChecked={perfil.Associacao.saude_uso_medicacao}
                            />
                          </BSForm.Group>
                        </Col>

                        <Col md={12}>
                          <BSForm.Group>
                            <BSForm.Label>Nome da Medicação</BSForm.Label>
                            <BSForm.Control
                              type="text"
                              name="saude_uso_medicacao_nome"
                              defaultValue={perfil.Associacao.saude_uso_medicacao_nome || ""}
                            />
                          </BSForm.Group>
                        </Col>

                        <Col md={12}>
                          <BSForm.Group>
                            <BSForm.Check
                              type="checkbox"
                              name="saude_uso_terapeutico_canabis"
                              label="Faço uso terapêutico de cannabis"
                              defaultChecked={perfil.Associacao.saude_uso_terapeutico_canabis}
                            />
                          </BSForm.Group>
                        </Col>

                        <Col md={12}>
                          <BSForm.Group>
                            <BSForm.Label>Experiência com Cannabis Medicinal</BSForm.Label>
                            <BSForm.Control
                              as="textarea"
                              rows={3}
                              name="saude_uso_terapeutico_canabis_experiencia"
                              defaultValue={perfil.Associacao.saude_uso_terapeutico_canabis_experiencia || ""}
                              placeholder="Descreva sua experiência..."
                            />
                          </BSForm.Group>
                        </Col>

                        <Col md={12}>
                          <BSForm.Group>
                            <BSForm.Check
                              type="checkbox"
                              name="saude_medico_prescritor"
                              label="Tenho médico prescritor de cannabis"
                              defaultChecked={perfil.Associacao.saude_medico_prescritor}
                            />
                          </BSForm.Group>
                        </Col>

                        <Col md={6}>
                          <BSForm.Group>
                            <BSForm.Label>Nome do Médico Prescritor</BSForm.Label>
                            <BSForm.Control
                              type="text"
                              name="saude_medico_prescritor_nome"
                              defaultValue={perfil.Associacao.saude_medico_prescritor_nome || ""}
                            />
                          </BSForm.Group>
                        </Col>

                        <Col md={6}>
                          <BSForm.Group>
                            <BSForm.Label>CRM do Médico</BSForm.Label>
                            <BSForm.Control
                              type="text"
                              name="saude_medico_prescritor_crm"
                              defaultValue={perfil.Associacao.saude_medico_prescritor_crm || ""}
                            />
                          </BSForm.Group>
                        </Col>
                      </Row>

                      <div className="d-flex gap-2">
                        <Button variant="primary" type="submit">
                          <i className="las la-save"></i> Salvar Alterações
                        </Button>
                        <Button variant="outline-secondary" as={Link} to="/app/perfil">
                          Cancelar
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Tab>
              )}
            </Tabs>
          </Card.Body>
        </Card>

        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="mb-2">
            <i className="las la-info-circle text-info"></i> Informações Importantes
          </h6>
          <ul className="mb-0 small">
            <li>Para alterar seu email ou senha, entre em contato com o suporte</li>
            <li>Alguns campos como CPF e RG não podem ser alterados após a confirmação</li>
            <li>Suas alterações serão salvas imediatamente</li>
          </ul>
        </div>
      </Container>
    </LayoutRestrictArea>
  );
}

