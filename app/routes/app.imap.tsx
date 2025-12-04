//@ts-nocheck
import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Table,
  Spinner,
} from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { authenticator } from '~/secure/authentication.server';
import { prisma } from '~/secure/db.server';
import { Papel, Usuario } from '@prisma/client';
import { useRootLoaderData } from '~/hooks/useRootLoaderData';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sincronização IMAP - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Monitorar sincronização de emails IMAP',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Apenas ADMIN pode acessar
  if (usuario.papel !== Papel.ADMIN) {
    return redirect('/app/dashboard');
  }

  // Buscar últimos 50 emails sincronizados
  const checkMails = await prisma.checkMail.findMany({
    include: {
      contato: true,
    },
    orderBy: { criado_em: 'desc' },
    take: 50,
  });

  // Contar emails por status
  const stats = {
    total: await prisma.checkMail.count(),
    salvos: await prisma.checkMail.count({ where: { salvo: true } }),
    naoProcesados: await prisma.checkMail.count({ where: { salvo: false } }),
    comInReplyTo: await prisma.checkMail.count({ where: { inReplyTo: { not: null } } }),
  };

  return json({ usuario, checkMails, stats, mensagensNaoLidas: 0 });
}

export async function action({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  if (usuario.papel !== Papel.ADMIN) {
    return json({ error: 'Permissão negada' }, { status: 403 });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const actionType = formData.get('_action');

    if (actionType === 'limpar_todos') {
      await prisma.checkMail.deleteMany();
      return json({ success: true, message: 'Todos os registros foram limpos' });
    }

    if (actionType === 'teste_imap') {
      try {
        const { checkNewEmails } = await import('~/services/imap.server');
        await checkNewEmails();
        return json({ success: true, message: 'Verificação de emails executada com sucesso' });
      } catch (error: any) {
        return json(
          { success: false, error: error.message || 'Erro ao executar verificação' },
          { status: 500 }
        );
      }
    }
  }

  return json({ error: 'Ação não permitida' }, { status: 405 });
}

type LoaderDataType = {
  usuario: Usuario;
  checkMails: any[];
  stats: {
    total: number;
    salvos: number;
    naoProcesados: number;
    comInReplyTo: number;
  };
  mensagensNaoLidas: number;
};

export default function IMAPMonitorPage() {
  const { usuario, checkMails, stats, mensagensNaoLidas } = useLoaderData<LoaderDataType>();
  const [isRunning, setIsRunning] = React.useState(false);
  const fetcher = useFetcher();

  React.useEffect(() => {
    if (fetcher.state === 'idle') {
      setIsRunning(false);
    }
  }, [fetcher.state]);

  const handleTesteIMAP = () => {
    setIsRunning(true);
    const formData = new FormData();
    formData.append('_action', 'teste_imap');
    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <LayoutRestrictArea usuarioSistema={usuario} mensagensNaoLidas={mensagensNaoLidas}>
      <Container fluid className='app-content'>
        {/* Header */}
        <Row className='align-items-center mt-3 mb-4'>
          <Col>
            <div className='d-flex align-items-center'>
              <div className='bg-light rounded-3 p-3 me-3'>
                <i className='las la-envelope la-3x' style={{ color: 'darkorchid' }}></i>
              </div>
              <div>
                <h2 className='mb-1'>Sincronização IMAP</h2>
                <p className='text-muted mb-0'>Monitorar e testar sincronização de emails</p>
              </div>
            </div>
          </Col>
          <Col xs='auto'>
            <Button
              variant='primary'
              onClick={handleTesteIMAP}
              disabled={isRunning}
              style={{ backgroundColor: 'darkorchid', borderColor: 'darkorchid' }}
            >
              {isRunning ? (
                <>
                  <Spinner animation='border' size='sm' className='me-2' />
                  Testando...
                </>
              ) : (
                <>
                  <i className='las la-sync me-2'></i>
                  Testar Sincronização
                </>
              )}
            </Button>
          </Col>
        </Row>

        {/* Feedback */}
        {fetcher.data?.success && (
          <div className='alert alert-success alert-dismissible fade show' role='alert'>
            <i className='las la-check-circle me-2'></i>
            {fetcher.data.message}
            <button
              type='button'
              className='btn-close'
              data-bs-dismiss='alert'
              aria-label='Close'
            ></button>
          </div>
        )}
        {fetcher.data?.error && (
          <div className='alert alert-danger alert-dismissible fade show' role='alert'>
            <i className='las la-exclamation-circle me-2'></i>
            {fetcher.data.error}
            <button
              type='button'
              className='btn-close'
              data-bs-dismiss='alert'
              aria-label='Close'
            ></button>
          </div>
        )}

        {/* Stats */}
        <Row className='mb-4 g-3'>
          <Col md={3}>
            <Card className='shadow-sm border-0'>
              <Card.Body>
                <div className='d-flex align-items-center'>
                  <div className='bg-info bg-opacity-10 rounded-3 p-3 me-3'>
                    <i className='las la-envelope la-2x text-info'></i>
                  </div>
                  <div>
                    <small className='text-muted'>Total de Emails</small>
                    <h3 className='mb-0'>{stats.total}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className='shadow-sm border-0'>
              <Card.Body>
                <div className='d-flex align-items-center'>
                  <div className='bg-success bg-opacity-10 rounded-3 p-3 me-3'>
                    <i className='las la-check-circle la-2x text-success'></i>
                  </div>
                  <div>
                    <small className='text-muted'>Salvos</small>
                    <h3 className='mb-0'>{stats.salvos}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className='shadow-sm border-0'>
              <Card.Body>
                <div className='d-flex align-items-center'>
                  <div className='bg-warning bg-opacity-10 rounded-3 p-3 me-3'>
                    <i className='las la-hourglass-half la-2x text-warning'></i>
                  </div>
                  <div>
                    <small className='text-muted'>Não Processados</small>
                    <h3 className='mb-0'>{stats.naoProcesados}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className='shadow-sm border-0'>
              <Card.Body>
                <div className='d-flex align-items-center'>
                  <div className='bg-primary bg-opacity-10 rounded-3 p-3 me-3'>
                    <i className='las la-reply la-2x text-primary'></i>
                  </div>
                  <div>
                    <small className='text-muted'>Com In-Reply-To</small>
                    <h3 className='mb-0'>{stats.comInReplyTo}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabela */}
        <Card className='shadow-sm border-0'>
          <Card.Header className='bg-light border-bottom'>
            <Card.Title className='mb-0'>
              <i className='las la-list me-2'></i>
              Últimos 50 Emails Sincronizados
            </Card.Title>
          </Card.Header>
          <Card.Body className='p-0'>
            <div style={{ overflowX: 'auto' }}>
              <Table striped hover className='mb-0'>
                <thead className='bg-light'>
                  <tr>
                    <th>Message-ID</th>
                    <th>De</th>
                    <th>Para</th>
                    <th>In-Reply-To</th>
                    <th>Status</th>
                    <th>Contato</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {checkMails.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='text-center py-4 text-muted'>
                        <i className='las la-inbox la-2x d-block mb-2' style={{ opacity: 0.3 }}></i>
                        Nenhum email sincronizado ainda
                      </td>
                    </tr>
                  ) : (
                    checkMails.map((checkMail) => (
                      <tr key={checkMail.id}>
                        <td>
                          <code style={{ fontSize: '11px' }}>
                            {checkMail.messageId.substring(0, 30)}...
                          </code>
                        </td>
                        <td>
                          <small>{checkMail.emailFrom}</small>
                        </td>
                        <td>
                          <small>{checkMail.emailTo}</small>
                        </td>
                        <td>
                          {checkMail.inReplyTo ? (
                            <code style={{ fontSize: '10px' }}>
                              {checkMail.inReplyTo.substring(0, 20)}...
                            </code>
                          ) : (
                            <span className='text-muted'>-</span>
                          )}
                        </td>
                        <td>
                          {checkMail.salvo ? (
                            <Badge bg='success'>Salvo</Badge>
                          ) : (
                            <Badge bg='warning'>Pendente</Badge>
                          )}
                        </td>
                        <td>
                          {checkMail.contato ? (
                            <small>{checkMail.contato.nome}</small>
                          ) : (
                            <span className='text-muted'>-</span>
                          )}
                        </td>
                        <td>
                          <small>
                            {new Date(checkMail.criado_em).toLocaleString('pt-BR')}
                          </small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Info Box */}
        <Card className='mt-4 bg-info bg-opacity-10 border-info'>
          <Card.Body>
            <h5 className='mb-3'>
              <i className='las la-info-circle me-2'></i>
              Como Usar
            </h5>
            <ul className='mb-0'>
              <li>
                <strong>Testar Sincronização:</strong> Clique no botão "Testar Sincronização" para forçar uma verificação imediata de emails
              </li>
              <li>
                <strong>Status "Salvo":</strong> Significa que o email foi processado e uma mensagem foi criada na plataforma
              </li>
              <li>
                <strong>Status "Pendente":</strong> Email foi recebido mas não foi processado (pode não ter In-Reply-To ou contato não encontrado)
              </li>
              <li>
                <strong>In-Reply-To:</strong> Identificador da mensagem que está sendo respondida
              </li>
              <li>
                <strong>Cron Job:</strong> Roda automaticamente a cada {process.env.CRON_EMAIL_SCHEDULE || '5 minutos'}
              </li>
            </ul>
          </Card.Body>
        </Card>
      </Container>
    </LayoutRestrictArea>
  );
}

import React from 'react';
import { useFetcher } from '@remix-run/react';
