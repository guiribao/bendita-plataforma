import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  unstable_parseMultipartFormData,
  redirect,
} from '@remix-run/node';
import { Form, useActionData, useNavigation, useLoaderData } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { TipoDocumento, Papel } from '@prisma/client';
import { Button, Card, Col, Container, Form as BootstrapForm, ProgressBar, Row, Alert } from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { authenticator } from '~/secure/authentication.server';
import { prisma } from '~/secure/db.server';
import { s3UploaderHandler } from '~/storage/s3.service.server';
import criarDocumento from '~/domain/Documentos/criar-documento.server';
import cadastroStyle from '~/assets/css/cadastro.css';

export const meta: MetaFunction = () => {
  return [
    { title: 'Enviar Documentos - Associação Bendita Canábica' },
    { name: 'description', content: 'Envie seus documentos para a Associação Bendita Canábica' },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: cadastroStyle }];
};

type TipoDocumentoConfig = {
  tipo: TipoDocumento;
  label: string;
  descricao: string;
  icon: string;
  fieldName: string;
};

const TIPOS_DOCUMENTOS: TipoDocumentoConfig[] = [
  {
    tipo: TipoDocumento.IDENTIFICACAO,
    label: 'Identificação',
    descricao: 'RG, CNH ou Passaporte',
    icon: 'las la-id-card',
    fieldName: 'identificacao_1',
  },
  {
    tipo: TipoDocumento.COMPROVANTE_RESIDENCIA,
    label: 'Comprovante de Residência',
    descricao: 'Conta de água, energia ou internet',
    icon: 'las la-home',
    fieldName: 'comprovante_residencia',
  },
  {
    tipo: TipoDocumento.RECEITA_MEDICA,
    label: 'Receita Médica',
    descricao: 'Prescrição médica para cannabis',
    icon: 'las la-prescription',
    fieldName: 'receita_uso_canabis',
  },
  {
    tipo: TipoDocumento.AUTORIZACAO_ANVISA,
    label: 'Autorização ANVISA',
    descricao: 'Documento de autorização da ANVISA',
    icon: 'las la-certificate',
    fieldName: 'autorizacao_anvisa',
  },
];

export const action: ActionFunction = async ({ request }) => {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Apenas associados podem fazer upload
  if (usuario.papel !== Papel.ASSOCIADO) {
    throw new Error('Acesso negado. Apenas associados podem fazer upload de documentos.');
  }

  // Parse multipart form data com upload para S3
  const form = await unstable_parseMultipartFormData(request, s3UploaderHandler);

  // Buscar perfil do usuário para obter associado
  const perfil = await prisma.perfil.findUnique({
    where: { usuarioId: usuario.id },
    include: { Associacao: true },
  });

  if (!perfil?.Associacao) {
    return { error: 'Associado não encontrado' };
  }

  const associadoId = perfil.Associacao.id;
  const perfilId = perfil.id;

  const uploadedDocuments = [];
  const errors = [];

  // Processar cada tipo de documento
  for (const config of TIPOS_DOCUMENTOS) {
    const fileData = form.get(config.fieldName);

    if (fileData && typeof fileData === 'string' && fileData.trim() !== '') {
      try {
        const documentoObj = {
          tipo: config.tipo,
          nome_arquivo: fileData,
          associadoId: associadoId,
          criadoPorId: perfilId,
        };
        await criarDocumento(documentoObj);
        uploadedDocuments.push(config.label);
      } catch (error) {
        errors.push(`Erro ao fazer upload de ${config.label}: ${error}`);
      }
    }
  }

  if (uploadedDocuments.length === 0 && errors.length > 0) {
    return { error: `Nenhum documento foi enviado. ${errors.join(' ')}` };
  }

  return {
    success: true,
    uploadedDocuments,
    message: `${uploadedDocuments.length} documento(s) enviado(s) com sucesso!`,
    errors: errors.length > 0 ? errors : undefined,
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Apenas associados podem acessar
  if (usuario.papel !== Papel.ASSOCIADO) {
    throw redirect('/app/documentos');
  }

  return { usuario };
}

type LoaderDataType = {
  usuario: Awaited<ReturnType<typeof authenticator.isAuthenticated>>;
};

export default function DocumentoNovoPage() {
  const { usuario } = useLoaderData<LoaderDataType>();
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileChange = (fieldName: string, file: File | null) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fieldName]: file,
    }));
  };

  const handleRemoveFile = (fieldName: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
    if (fileInputRefs.current[fieldName]) {
      fileInputRefs.current[fieldName]!.value = '';
    }
  };

  useEffect(() => {
    if (actionData?.success && formRef.current) {
      formRef.current.reset();
      setSelectedFiles({});
      // Opcional: redirecionar após sucesso
      setTimeout(() => {
        window.location.href = '/app/documentos';
      }, 2000);
    }
  }, [actionData?.success]);

  return (
    <LayoutRestrictArea usuarioSistema={usuario}>
      <Container fluid className='app-content'>
        <Row className='align-items-center mt-3 mb-4'>
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-cloud-upload-alt la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>Enviar Documentos</h2>
                <p className='text-muted mb-0'>Selecione e faça upload dos seus documentos</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Mensagem de sucesso */}
        {actionData?.success && (
          <Alert variant='success' dismissible className='mb-4'>
            <Alert.Heading>
              <i className='las la-check-circle me-2' />
              Sucesso!
            </Alert.Heading>
            <p className='mb-0'>{actionData.message}</p>
            {actionData.uploadedDocuments && actionData.uploadedDocuments.length > 0 && (
              <ul className='mb-0 mt-2'>
                {actionData.uploadedDocuments.map((doc: string) => (
                  <li key={doc}>{doc} enviado com sucesso</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        {/* Mensagens de erro */}
        {actionData?.error && (
          <Alert variant='danger' dismissible className='mb-4'>
            <Alert.Heading>
              <i className='las la-exclamation-triangle me-2' />
              Erro
            </Alert.Heading>
            <p className='mb-0'>{actionData.error}</p>
          </Alert>
        )}

        {actionData?.errors && actionData.errors.length > 0 && (
          <Alert variant='warning' className='mb-4'>
            <Alert.Heading>
              <i className='las la-info-circle me-2' />
              Avisos
            </Alert.Heading>
            <ul className='mb-0'>
              {actionData.errors.map((error: string, idx: number) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Form method='post' encType='multipart/form-data' ref={formRef}>
          <Row className='g-4'>
            {TIPOS_DOCUMENTOS.map((config) => (
              <Col key={config.tipo} xs={12} md={6} lg={6}>
                <Card className='h-100 shadow-sm border-0'>
                  <Card.Body>
                    <div className='mb-3 text-center'>
                      <i className={config.icon} style={{ fontSize: '3rem', color: '#6c757d' }} />
                    </div>

                    <h5 className='mb-2 text-center'>{config.label}</h5>
                    <p className='text-muted small text-center mb-3'>{config.descricao}</p>

                    <div className='file-input-wrapper mb-3'>
                      <BootstrapForm.Group controlId={config.fieldName}>
                        <BootstrapForm.Label className='d-block mb-2'>
                          {selectedFiles[config.fieldName] ? (
                            <span className='text-success'>
                              <i className='las la-check-circle me-1' />
                              {selectedFiles[config.fieldName]?.name}
                            </span>
                          ) : (
                            <span className='text-muted'>
                              <i className='las la-cloud-upload-alt me-1' />
                              Selecione um arquivo
                            </span>
                          )}
                        </BootstrapForm.Label>

                        <BootstrapForm.Control
                          type='file'
                          name={config.fieldName}
                          accept='.jpg,.jpeg,.png,.pdf'
                          onChange={(e) => {
                            const file = (e.target as HTMLInputElement).files?.[0] || null;
                            handleFileChange(config.fieldName, file);
                          }}
                          ref={(el) => {
                            if (el) fileInputRefs.current[config.fieldName] = el;
                          }}
                          disabled={isSubmitting}
                          className='mb-2'
                        />

                        <small className='text-muted d-block mb-2'>
                          Formatos aceitos: JPG, PNG ou PDF (máximo 5MB)
                        </small>
                      </BootstrapForm.Group>

                      {selectedFiles[config.fieldName] && (
                        <Button
                          variant='outline-danger'
                          size='sm'
                          className='w-100'
                          onClick={() => handleRemoveFile(config.fieldName)}
                          disabled={isSubmitting}
                        >
                          <i className='las la-trash me-1' />
                          Remover
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className='mt-5'>
            <Col xs={12} className='d-flex gap-2 justify-content-between'>
              <Button
                variant='outline-secondary'
                href='/app/documentos'
                disabled={isSubmitting}
              >
                <i className='las la-arrow-left me-1' />
                Voltar
              </Button>

              <Button
                variant='primary'
                type='submit'
                disabled={isSubmitting || Object.values(selectedFiles).every((f) => !f)}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className='spinner-border spinner-border-sm me-2'
                      role='status'
                      aria-hidden='true'
                    ></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className='las la-cloud-upload-alt me-1' />
                    Enviar Documentos
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Form>

        <Card className='mt-5 bg-light border-0'>
          <Card.Body>
            <h6 className='mb-3'>
              <i className='las la-lightbulb me-2 text-warning' />
              Dicas Importantes
            </h6>
            <ul className='mb-0 small text-muted'>
              <li>
                Os documentos de <strong>identificação</strong> devem estar legíveis e com validade vigente
              </li>
              <li>
                O <strong>comprovante de residência</strong> deve estar em seu nome e com data de emissão recente
              </li>
              <li>
                A <strong>receita médica</strong> deve conter dados do prescritor e ser legível
              </li>
              <li>
                A <strong>autorização ANVISA</strong>, se aplicável, deve ser anexada conforme requerido
              </li>
              <li>Todos os documentos devem estar em bom estado, sem rasgos ou danos</li>
            </ul>
          </Card.Body>
        </Card>
      </Container>
    </LayoutRestrictArea>
  );
}
