//@ts-nocheck
import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { Button, Card, Alert, ProgressBar, ListGroup } from 'react-bootstrap';
import NavRestrictArea from '~/component/NavRestrictArea';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { importarPessoas } from '~/domain/Importacao/importar-pessoas.server';
import { authenticator } from '~/secure/authentication.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  return json({ usuario });
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  try {
    const formData = await request.formData();
    const arquivo = formData.get('arquivo') as File;

    if (!arquivo) {
      return json({ erro: 'Nenhum arquivo foi enviado' }, { status: 400 });
    }

    if (!arquivo.name.endsWith('.xlsx') && !arquivo.name.endsWith('.xls')) {
      return json(
        { erro: 'Formato de arquivo inválido. Por favor, envie um arquivo XLSX.' },
        { status: 400 }
      );
    }

    const resultados = await importarPessoas(arquivo);

    return json({ sucesso: true, resultados });
  } catch (erro: any) {
    console.error('Erro na importação:', erro);
    return json({ erro: erro.message || 'Erro ao processar importação' }, { status: 500 });
  }
}

export default function ImportarPessoas() {
  const { usuario } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [arquivo, setArquivo] = useState<File | null>(null);

  const isImporting = navigation.state === 'submitting';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
    }
  };

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <Card>
              <Card.Header className="bg-primary text-white">
                <div className="d-flex align-items-center">
                  <i className="las la-file-upload fs-4 me-2"></i>
                  <h4 className="mb-0">Importação em Massa de Pessoas</h4>
                </div>
              </Card.Header>

              <Card.Body>
                {/* Instruções */}
                <Alert variant="info" className="mb-4">
                  <Alert.Heading className="h6">
                    <i className="las la-info-circle me-2"></i>
                    Instruções para importação
                  </Alert.Heading>
                  <ul className="mb-0 ps-3">
                    <li>O arquivo deve estar no formato XLSX (Excel)</li>
                    <li>As colunas devem seguir exatamente o modelo fornecido</li>
                    <li>Links de documentos do Google Drive serão transferidos automaticamente para o sistema</li>
                    <li>Senhas temporárias serão geradas e enviadas por email</li>
                    <li>Responsáveis serão criados automaticamente quando informados</li>
                  </ul>
                </Alert>

                {/* Formulário de Upload */}
                <form method="post" encType="multipart/form-data">
                  <div className="mb-4">
                    <label htmlFor="arquivo" className="form-label fw-bold">
                      Selecione o arquivo XLSX
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="arquivo"
                      name="arquivo"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={isImporting}
                      required
                    />
                    {arquivo && (
                      <div className="form-text text-success">
                        <i className="las la-check-circle me-1"></i>
                        Arquivo selecionado: <strong>{arquivo.name}</strong>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!arquivo || isImporting}
                      className="d-flex align-items-center"
                    >
                      {isImporting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Importando...
                        </>
                      ) : (
                        <>
                          <i className="las la-upload me-2"></i>
                          Iniciar Importação
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => window.history.back()}
                      disabled={isImporting}
                    >
                      <i className="las la-arrow-left me-2"></i>
                      Voltar
                    </Button>
                  </div>
                </form>

                {/* Barra de Progresso durante importação */}
                {isImporting && (
                  <div className="mt-4">
                    <p className="mb-2">Processando arquivo...</p>
                    <ProgressBar animated now={100} variant="primary" />
                  </div>
                )}

                {/* Resultados */}
                {actionData && (
                  <div className="mt-4">
                    {actionData.erro && (
                      <Alert variant="danger">
                        <Alert.Heading className="h6">
                          <i className="las la-exclamation-triangle me-2"></i>
                          Erro na Importação
                        </Alert.Heading>
                        <p className="mb-0">{actionData.erro}</p>
                      </Alert>
                    )}

                    {actionData.sucesso && actionData.resultados && (
                      <>
                        <Alert variant="success">
                          <Alert.Heading className="h6">
                            <i className="las la-check-circle me-2"></i>
                            Importação Concluída
                          </Alert.Heading>
                          <p className="mb-0">
                            <strong>{actionData.resultados.sucesso}</strong> de{' '}
                            <strong>{actionData.resultados.total}</strong> registros importados com sucesso!
                          </p>
                        </Alert>

                        {/* Detalhes dos erros */}
                        {actionData.resultados.erros.length > 0 && (
                          <Card className="mt-3 border-warning">
                            <Card.Header className="bg-warning text-dark">
                              <i className="las la-exclamation-circle me-2"></i>
                              Erros Encontrados ({actionData.resultados.erros.length})
                            </Card.Header>
                            <ListGroup variant="flush">
                              {actionData.resultados.erros.map((erro, index) => (
                                <ListGroup.Item key={index}>
                                  <div className="d-flex align-items-start">
                                    <span className="badge bg-danger me-3">Linha {erro.linha}</span>
                                    <div className="flex-grow-1">
                                      <p className="mb-1 text-danger">{erro.erro}</p>
                                      {erro.dados && (
                                        <small className="text-muted">
                                          {erro.dados.nome && `Nome: ${erro.dados.nome}`}
                                          {erro.dados.cpf && ` | CPF: ${erro.dados.cpf}`}
                                          {erro.dados.email && ` | Email: ${erro.dados.email}`}
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          </Card>
                        )}

                        {/* Botão para voltar */}
                        <div className="mt-4">
                          <Button variant="primary" onClick={() => window.location.href = '/app/gente'}>
                            <i className="las la-list me-2"></i>
                            Ver Lista de Pessoas
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Card com Modelo das Colunas */}
            <Card className="mt-4">
              <Card.Header className="bg-secondary text-white">
                <i className="las la-table me-2"></i>
                Colunas do Arquivo
              </Card.Header>
              <Card.Body>
                <p className="mb-3">O arquivo XLSX deve conter as seguintes colunas na ordem exata:</p>
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold">Dados Pessoais:</h6>
                    <ul className="small">
                      <li>Associado</li>
                      <li>Carimbo de data/hora</li>
                      <li>Endereço de e-mail</li>
                      <li>Nome</li>
                      <li>CPF</li>
                      <li>RG</li>
                      <li>Anexar documento de identificação</li>
                      <li>Data do nascimento</li>
                      <li>SEXO</li>
                      <li>Endereço completo (Endereço, bairro, cidade, estado e CEP)</li>
                      <li>Comprovante de Residência (conta de água, luz ou telefone)</li>
                      <li>Telefone/Whatsapp</li>
                      <li>Email</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold">Dados da Associação:</h6>
                    <ul className="small">
                      <li>Quem indicou a Bendita Associação Canábica?</li>
                      <li>Tipo de Associado</li>
                      <li>Quadro geral de saúde - Descreva os diagnósticos de patologias existentes</li>
                      <li>Usa alguma medicação?</li>
                      <li>Se usa alguma medicação escreva aqui o(s) nome(s):</li>
                      <li>Já fez uso terapêutico com a cannabis?</li>
                      <li>Caso já tenha feito uso terapêutico faça um breve relato da sua experiência.</li>
                      <li>É acompanhado por médico prescritor de cannabis?</li>
                      <li>Se é acompanhado por médico prescritor, qual o nome e CRM do profissional?</li>
                      <li>Se você já tem receita médica para uso da cannabis medicinal anexe aqui.</li>
                      <li>Se você possui autorização da ANVISA para importação anexe aqui.</li>
                    </ul>

                    <h6 className="fw-bold mt-3">Dados do Responsável:</h6>
                    <ul className="small">
                      <li>Nome do responsável - aplicável para o caso de pacientes menores de idade e com doenças neurodegenerativas</li>
                      <li>CPF do Responsável</li>
                      <li>RG do Responsável</li>
                      <li>Anexe RG do responsável</li>
                      <li>Sexo do Responsável</li>
                      <li>Data de nascimento do responsável</li>
                      <li>Endereço completo do responsável (Endereço, bairro, cidade, estado e CEP</li>
                      <li>Telefone do responsável com DDD</li>
                      <li>E-mail do responsável</li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </LayoutRestrictArea>
  );
}
