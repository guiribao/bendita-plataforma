//@ts-nocheck
import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, useLoaderData, useActionData, useFetcher } from '@remix-run/react';
import { useState, useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form as BootstrapForm,
  InputGroup,
  Row,
  ListGroup,
  Spinner,
  Modal,
} from 'react-bootstrap';
import LayoutRestrictArea from '~/component/layout/LayoutRestrictArea';
import { authenticator } from '~/secure/authentication.server';
import { prisma } from '~/secure/db.server';
import { Papel, Usuario, Remetente } from '@prisma/client';
import enviarEmailResposta from '~/domain/Contatos/enviar-email-resposta.server';
import { useRootLoaderData } from '~/hooks/useRootLoaderData';

export const meta: MetaFunction = () => {
  return [
    { title: 'Contatos - Associação Bendita Canábica' },
    {
      name: 'description',
      content: 'Gerenciamento de contatos e mensagens da associação',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Verificar se o usuário é ADMIN ou SECRETARIA
  if (usuario.papel !== Papel.ADMIN && usuario.papel !== Papel.SECRETARIA) {
    return redirect('/app/dashboard');
  }

  // Buscar todos os contatos com suas mensagens
  const contatos = await prisma.contato.findMany({
    include: {
      Mensagens: {
        where: { respostaParaId: null }, // Apenas mensagens originais
        orderBy: { criado_em: 'desc' },
      },
    },
    orderBy: { criado_em: 'desc' },
  });

  // Para cada mensagem, buscar suas respostas
  const contatosComRespostas = await Promise.all(
    contatos.map(async (contato) => {
      const mensagensComRespostas = await Promise.all(
        contato.Mensagens.map(async (mensagem) => {
          const respostas = await prisma.mensagem.findMany({
            where: { respostaParaId: mensagem.id },
            orderBy: { criado_em: 'asc' },
          });
          return { ...mensagem, respostas };
        })
      );
      return { ...contato, Mensagens: mensagensComRespostas };
    })
  );

  return json({ usuario, contatos: contatosComRespostas });
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await authenticator.isAuthenticated(request, {
    failureRedirect: '/autentica/entrar',
  });

  // Verificar permissões
  if (usuario.papel !== Papel.ADMIN && usuario.papel !== Papel.SECRETARIA) {
    return json({ error: 'Permissão negada' }, { status: 403 });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const action = formData.get('_action');

    if (action === 'marcar_como_lido') {
      const mensagemId = formData.get('mensagem_id') as string;

      if (!mensagemId) {
        return json({ error: 'ID da mensagem não fornecido' }, { status: 400 });
      }

      try {
        await prisma.mensagem.update({
          where: { id: mensagemId },
          data: { lido: true },
        });

        return json({ success: true });
      } catch (error) {
        return json({ error: 'Erro ao marcar mensagem como lida' }, { status: 500 });
      }
    }

    if (action === 'enviar_resposta') {
      const contatoId = formData.get('contato_id') as string;
      const mensagemId = formData.get('mensagem_id') as string;
      const resposta = formData.get('resposta') as string;

      if (!contatoId || !resposta || resposta.trim() === '') {
        return json({ error: 'Dados inválidos' }, { status: 400 });
      }

      try {
        const contato = await prisma.contato.findUnique({
          where: { id: contatoId },
        });

        if (!contato) {
          return json({ error: 'Contato não encontrado' }, { status: 404 });
        }

        if (!contato.email) {
          return json({ error: 'Contato não possui email cadastrado' }, { status: 400 });
        }

        // Salvar resposta no banco de dados
        await prisma.mensagem.create({
          data: {
            contatoId: contatoId,
            texto: resposta,
            assunto: `Resposta: ${mensagemId}`,
            respostaParaId: mensagemId || undefined,
            remetente: Remetente.FROM_BENDITA,
            lido: true,
          },
        });

        // Enviar email usando o serviço
        const enviado = await enviarEmailResposta(contato.email, contato.nome, resposta);

        if (!enviado) {
          return json({ error: 'Erro ao enviar resposta via email' }, { status: 500 });
        }

        return json({ success: true, message: 'Resposta enviada com sucesso!' });
      } catch (error) {
        console.error('Erro ao enviar resposta:', error);
        return json({ error: 'Erro ao enviar resposta via email' }, { status: 500 });
      }
    }
  }

  return json({ error: 'Ação não permitida' }, { status: 405 });
}

type LoaderDataType = {
  usuario: Usuario;
  contatos: any[];
};

const ContatosPage = () => {
  const { usuario, contatos } = useLoaderData<LoaderDataType>();
  const { mensagensNaoLidas } = useRootLoaderData();
  const [filtroNome, setFiltroNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState<string | null>(
    contatos.length > 0 ? contatos[0].id : null
  );
  const [showModalResposta, setShowModalResposta] = useState(false);
  const [mensagemSelecionada, setMensagemSelecionada] = useState<any>(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fetcher = useFetcher();

  // Filtrar contatos
  const contatosFiltrados = useMemo(() => {
    return contatos.filter((contato) => {
      const matchNome =
        filtroNome === '' ||
        contato.nome.toLowerCase().includes(filtroNome.toLowerCase()) ||
        contato.telefone.includes(filtroNome);

      // Filtro de data
      let matchData = true;
      if (dataInicio || dataFim) {
        const dataUltimaMensagem = contato.Mensagens[0]?.criado_em
          ? new Date(contato.Mensagens[0].criado_em)
          : new Date(contato.criado_em);

        if (dataInicio) {
          matchData = matchData && dataUltimaMensagem >= new Date(dataInicio);
        }
        if (dataFim) {
          const dataFimAjustada = new Date(dataFim);
          dataFimAjustada.setHours(23, 59, 59, 999);
          matchData = matchData && dataUltimaMensagem <= dataFimAjustada;
        }
      }

      return matchNome && matchData;
    });
  }, [contatos, filtroNome, dataInicio, dataFim]);

  // Obter contato selecionado
  const contato = contatosFiltrados.find((c) => c.id === contatoSelecionado) ||
    contatosFiltrados[0] || null;

  const mensagens = contato?.Mensagens || [];
  const naoLidas = mensagens.filter((m: any) => !m.lido).length;

  const handleMarcarComoLido = (mensagemId: string) => {
    const formData = new FormData();
    formData.append('_action', 'marcar_como_lido');
    formData.append('mensagem_id', mensagemId);
    fetcher.submit(formData, { method: 'post' });
  };

  const abrirModalResposta = (mensagem: any) => {
    console.log('Abrindo modal para mensagem:', mensagem);
    setMensagemSelecionada(mensagem);
    setRespostaTexto('');
    setShowModalResposta(true);
    // Marcar como lido ao abrir
    if (!mensagem.lido) {
      handleMarcarComoLido(mensagem.id);
    }
  };

  const fecharModalResposta = () => {
    setShowModalResposta(false);
    setMensagemSelecionada(null);
    setRespostaTexto('');
  };

  const handleEnviarResposta = async () => {
    if (!respostaTexto.trim() || !contato || !mensagemSelecionada) return;

    setEnviando(true);
    const formData = new FormData();
    formData.append('_action', 'enviar_resposta');
    formData.append('contato_id', contato.id);
    formData.append('mensagem_id', mensagemSelecionada.id);
    formData.append('resposta', respostaTexto);

    try {
      fetcher.submit(formData, { method: 'post' });
      fecharModalResposta();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    } finally {
      setEnviando(false);
    }
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
                <h2 className='mb-1'>Mensagens de Contato</h2>
                <p className='text-muted mb-0'>Gerencie mensagens recebidas através do formulário de contato</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Filtros */}
        <Card className='mb-4 shadow-sm border-0'>
          <Card.Body>
            <Row className='g-3 align-items-end'>
              <Col xs={12} md={6} lg={4}>
                <BootstrapForm.Group controlId='filterNome'>
                  <BootstrapForm.Label className='small text-muted mb-1'>Buscar por Nome ou Telefone</BootstrapForm.Label>
                  <InputGroup>
                    <InputGroup.Text className='bg-white'>
                      <i className='las la-search text-muted' />
                    </InputGroup.Text>
                    <BootstrapForm.Control
                      type='text'
                      placeholder='Nome ou telefone...'
                      value={filtroNome}
                      onChange={(e) => {
                        setFiltroNome(e.target.value);
                        // Resetar seleção ao filtrar
                        const novoFiltrado = contatosFiltrados.find((c) =>
                          c.nome.toLowerCase().includes(e.target.value.toLowerCase()) ||
                          c.telefone.includes(e.target.value)
                        );
                        setContatoSelecionado(novoFiltrado?.id || null);
                      }}
                      className='border-start-0'
                    />
                    {filtroNome && (
                      <Button
                        variant='outline-secondary'
                        onClick={() => setFiltroNome('')}
                        style={{ borderLeft: 0 }}
                      >
                        ×
                      </Button>
                    )}
                  </InputGroup>
                </BootstrapForm.Group>
              </Col>

              <Col xs={12} sm={6} md={3}>
                <BootstrapForm.Group controlId='dataInicio'>
                  <BootstrapForm.Label className='small text-muted mb-1'>Data Início</BootstrapForm.Label>
                  <BootstrapForm.Control
                    type='date'
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </BootstrapForm.Group>
              </Col>

              <Col xs={12} sm={6} md={3}>
                <BootstrapForm.Group controlId='dataFim'>
                  <BootstrapForm.Label className='small text-muted mb-1'>Data Fim</BootstrapForm.Label>
                  <BootstrapForm.Control
                    type='date'
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </BootstrapForm.Group>
              </Col>

              <Col xs={12} lg='auto' className='ms-lg-auto'>
                <div className='d-flex gap-2 align-items-center'>
                  <small className='text-muted'>
                    <i className='las la-filter me-1'></i>
                    {contatosFiltrados.length} contato(s)
                  </small>
                  {(filtroNome || dataInicio || dataFim) && (
                    <Button
                      variant='link'
                      size='sm'
                      onClick={() => {
                        setFiltroNome('');
                        setDataInicio('');
                        setDataFim('');
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Layout de duas colunas */}
        <Row className='conversation-layout g-3 mb-4' style={{ minHeight: 'calc(100vh - 400px)' }}>
          {/* Coluna Esquerda - Lista de Contatos */}
          <Col xs={12} md={5} lg={4} className='contact-list-col'>
            <Card className='shadow-sm border-0 h-100'>
              <Card.Header className='bg-light border-bottom'>
                <Card.Title className='mb-0' style={{ fontSize: '1rem' }}>
                  <i className='las la-users me-2'></i>
                  Contatos ({contatosFiltrados.length})
                </Card.Title>
              </Card.Header>
              <Card.Body className='p-0' style={{ maxHeight: 'calc(100vh - 500px)', overflowY: 'auto' }}>
                {contatosFiltrados.length === 0 ? (
                  <div className='text-center py-5'>
                    <div className='text-muted'>
                      <i className='las la-inbox la-3x d-block mb-3' style={{ opacity: 0.3 }}></i>
                      <p className='mb-0'>Nenhum contato encontrado</p>
                    </div>
                  </div>
                ) : (
                  <ListGroup variant='flush'>
                    {contatosFiltrados.map((contatoItem) => {
                      const naoLidosContato = contatoItem.Mensagens.filter((m: any) => !m.lido).length;
                      const isSelected = contatoItem.id === contatoSelecionado;

                      return (
                        <ListGroup.Item
                          key={contatoItem.id}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(153, 50, 204, 0.1)' : 'transparent',
                            borderLeft: isSelected ? '4px solid darkorchid' : '4px solid transparent',
                          }}
                          onClick={() => setContatoSelecionado(contatoItem.id)}
                          className='py-2 py-md-3'
                        >
                          <div className='d-flex justify-content-between align-items-start'>
                            <div className='flex-grow-1'>
                              <div className='fw-bold'>
                                {contatoItem.nome}
                                {naoLidosContato > 0 && (
                                  <Badge bg='danger' className='ms-2'>
                                    {naoLidosContato}
                                  </Badge>
                                )}
                              </div>
                              <small className='text-muted d-block'>
                                <i className='las la-phone me-1'></i>
                                {contatoItem.telefone}
                              </small>
                              <small className='text-muted d-block'>
                                <i className='las la-calendar me-1'></i>
                                {new Date(contatoItem.criado_em).toLocaleDateString('pt-BR')}
                              </small>
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Coluna Direita - Detalhes do Contato e Mensagens */}
          <Col xs={12} md={7} lg={8} className='message-detail-col'>
            {contato ? (
              <Card className='shadow-sm border-0 h-100 d-flex flex-column'>
                <Card.Header className='bg-light border-bottom'>
                  <div className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
                    <div>
                      <Card.Title className='mb-1'>
                        <i className='las la-envelope me-2'></i>
                        {contato.nome}
                      </Card.Title>
                      <small className='text-muted'>
                        <i className='las la-phone me-1'></i>
                        {contato.telefone}
                      </small>
                    </div>
                    {naoLidas > 0 && (
                      <Badge bg='danger' className='ms-2'>
                        {naoLidas} não lida(s)
                      </Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body style={{ overflowY: 'auto', flex: 1, backgroundColor: '#f8f9fa' }}>
                  {mensagens.length === 0 ? (
                    <div className='text-center py-5'>
                      <div className='text-muted'>
                        <i className='las la-envelope-open la-3x d-block mb-3' style={{ opacity: 0.3 }}></i>
                        <p className='mb-0'>Nenhuma mensagem deste contato</p>
                      </div>
                    </div>
                  ) : (
                    <div className='d-flex flex-column gap-2'>
                      {/* Buscar todas as mensagens (originais e respostas) e ordenar cronologicamente */}
                      {(() => {
                        const todasMensagens: any[] = [];
                        
                        mensagens.forEach((mensagem: any) => {
                          todasMensagens.push(mensagem);
                          if (mensagem.respostas && mensagem.respostas.length > 0) {
                            todasMensagens.push(...mensagem.respostas);
                          }
                        });
                        
                        // Ordenar por data decrescente (mais recente primeiro)
                        todasMensagens.sort((a, b) => 
                          new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
                        );
                        
                        return todasMensagens.map((msg: any) => {
                          const isFromContact = msg.remetente === 'FROM_CONTACT';
                          
                          return (
                            <div 
                              key={msg.id}
                              className='d-flex'
                              style={{
                                justifyContent: isFromContact ? 'flex-start' : 'flex-end',
                              }}
                            >
                              <div style={{ maxWidth: '70%' }}>
                                <Card
                                  className='border-0 shadow-sm'
                                  style={{
                                    backgroundColor: isFromContact 
                                      ? (msg.lido ? '#ffffff' : '#e3f2fd')
                                      : '#e8f5e9',
                                    cursor: isFromContact ? 'pointer' : 'default',
                                  }}
                                  onClick={isFromContact ? () => abrirModalResposta(msg) : undefined}
                                  role={isFromContact ? "button" : undefined}
                                >
                                  <Card.Body className='p-3'>
                                    <div className='d-flex justify-content-between align-items-start mb-2'>
                                      <div>
                                        <small className='text-muted d-block fw-bold'>
                                          {isFromContact ? (
                                            <>
                                              <i className='las la-user me-1'></i>
                                              {contato.nome}
                                            </>
                                          ) : (
                                            <>
                                              <i className='las la-leaf me-1'></i>
                                              Bendita Canábica
                                            </>
                                          )}
                                        </small>
                                        <small className='text-muted'>
                                          <i className='las la-calendar me-1'></i>
                                          {new Date(msg.criado_em).toLocaleString('pt-BR')}
                                        </small>
                                      </div>
                                      {isFromContact && !msg.lido && (
                                        <Badge bg='danger' className='ms-2'>
                                          Novo
                                        </Badge>
                                      )}
                                    </div>
                                    {msg.assunto && isFromContact && (
                                      <div className='mb-2'>
                                        <small className='text-muted'>
                                          <strong>Assunto:</strong> {msg.assunto}
                                        </small>
                                      </div>
                                    )}
                                    <Card.Text 
                                      className='mb-0' 
                                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                    >
                                      {msg.texto}
                                    </Card.Text>
                                  </Card.Body>
                                </Card>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </Card.Body>
              </Card>
            ) : (
              <Card className='shadow-sm border-0 h-100 d-flex align-items-center justify-content-center'>
                <div className='text-center'>
                  <div className='text-muted'>
                    <i className='las la-inbox la-4x d-block mb-3' style={{ opacity: 0.2 }}></i>
                    <p className='mb-0'>Selecione um contato para ver suas mensagens</p>
                  </div>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Modal de Resposta */}
      <Modal show={showModalResposta} onHide={fecharModalResposta} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className='las la-reply me-2'></i>
            Responder a {contato?.nome}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {mensagemSelecionada && (
            <>
              <div className='mb-4 p-3 bg-light rounded'>
                <div className='mb-2'>
                  <small className='text-muted'>
                    <strong>Mensagem original:</strong>
                  </small>
                </div>
                {mensagemSelecionada.assunto && (
                  <div className='mb-2'>
                    <strong className='small'>{mensagemSelecionada.assunto}</strong>
                  </div>
                )}
                <p className='mb-0 small' style={{ whiteSpace: 'pre-wrap' }}>
                  {mensagemSelecionada.texto}
                </p>
                <small className='text-muted d-block mt-2'>
                  <i className='las la-calendar me-1'></i>
                  {new Date(mensagemSelecionada.criado_em).toLocaleString('pt-BR')}
                </small>
              </div>

              <BootstrapForm.Group controlId="resposta">
                <BootstrapForm.Label>
                  Sua Resposta <span style={{ color: 'red' }}>*</span>
                </BootstrapForm.Label>
                <BootstrapForm.Control
                  as="textarea"
                  rows={6}
                  placeholder="Digite sua resposta aqui..."
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  disabled={enviando}
                  style={{
                    borderColor: 'rgba(153, 50, 204, 0.3)',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'darkorchid')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(153, 50, 204, 0.3)')}
                />
              </BootstrapForm.Group>

              <div className='mt-2 p-2 bg-info bg-opacity-10 rounded small text-muted'>
                <i className='las la-info-circle me-1'></i>
                {contato?.email ? (
                  <>A resposta será enviada via email para <strong>{contato.email}</strong></>
                ) : (
                  <span className='text-warning'>
                    <i className='las la-exclamation-triangle me-1'></i>
                    Este contato não possui email cadastrado
                  </span>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={fecharModalResposta}
            disabled={enviando}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleEnviarResposta}
            disabled={!respostaTexto.trim() || enviando || !contato?.email}
            style={{ backgroundColor: 'darkorchid', borderColor: 'darkorchid' }}
          >
            {enviando ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Enviando...
              </>
            ) : (
              <>
                <i className='las la-paper-plane me-2'></i>
                Enviar Resposta
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </LayoutRestrictArea>
  );
};

export default ContatosPage;
