import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  prisma, entrar, criarUsuarioDireto, criarAssociadoCompleto,
  emailFake, nomeFake, telefoneFake, arquivoPng, arquivoPdf, Papel,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

async function clienteAdmin() {
  const { email, senha, usuario } = await criarUsuarioDireto({ papel: Papel.ADMIN });
  const cliente = await entrar(email, senha, 'admin');
  return { cliente, usuario };
}

/** Faz um associado subir um documento real e devolve o registro criado. */
async function documentoEnviadoPorAssociado() {
  const associado = await criarAssociadoCompleto();
  const cliente = await entrar(associado.email, associado.senha);
  const resposta = await cliente.postMultipart('/app/documentos/novo', {}, {
    identificacao_1: arquivoPng('identidade.png'),
  });
  assert.equal(resposta.status, 200);
  const documento = await prisma.documentos.findFirst({
    where: { associadoId: associado.associado.id },
    orderBy: { criado_em: 'desc' },
  });
  assert.ok(documento, 'o upload deveria gerar um documento');
  return { ...associado, documento, cliente };
}

describe('Documentos — listagem e acesso privado', () => {
  test('admin lista todos os documentos', async () => {
    const { documento, perfil } = await documentoEnviadoPorAssociado();
    const { cliente } = await clienteAdmin();

    const resposta = await cliente.get('/app/documentos');
    assert.equal(resposta.status, 200);
    const html = await resposta.text();
    assert.ok(html.includes(perfil.nome_completo), 'deveria mostrar o dono do documento');
    assert.ok(documento);
  });

  test('admin recebe link temporário e baixa o arquivo', async () => {
    const { documento } = await documentoEnviadoPorAssociado();
    const { cliente, usuario } = await clienteAdmin();

    await cliente.get('/app/documentos');

    const link = await prisma.linkTemporarioDocumento.findFirst({
      where: { documentoId: documento.id, usuarioId: usuario.id },
      orderBy: { criado_em: 'desc' },
    });
    assert.ok(link, 'a listagem deveria gerar um link temporário para o admin');

    const arquivo = await cliente.get(`/app/documentos/arquivo/${link.token}`);
    assert.equal(arquivo.status, 200);
    assert.equal(arquivo.headers.get('content-type'), 'image/png');
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    assert.ok(bytes.length > 0, 'o arquivo deveria ter conteúdo');
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG', 'deveria devolver o PNG salvo');
  });

  test('download forçado usa Content-Disposition attachment', async () => {
    const { documento } = await documentoEnviadoPorAssociado();
    const { cliente, usuario } = await clienteAdmin();
    await cliente.get('/app/documentos');

    const link = await prisma.linkTemporarioDocumento.findFirst({
      where: { documentoId: documento.id, usuarioId: usuario.id },
    });
    const arquivo = await cliente.get(`/app/documentos/arquivo/${link.token}?download=1`);
    assert.equal(arquivo.status, 200);
    assert.ok(arquivo.headers.get('content-disposition').startsWith('attachment'));
  });

  test('link de um usuário não serve para outro', async () => {
    const { documento } = await documentoEnviadoPorAssociado();
    const primeiro = await clienteAdmin();
    await primeiro.cliente.get('/app/documentos');

    const link = await prisma.linkTemporarioDocumento.findFirst({
      where: { documentoId: documento.id, usuarioId: primeiro.usuario.id },
    });

    const segundo = await clienteAdmin();
    const resposta = await segundo.cliente.get(`/app/documentos/arquivo/${link.token}`);
    assert.equal(resposta.status, 403, 'o link é pessoal e não deveria valer para outro usuário');
  });

  test('link expirado é recusado', async () => {
    const { documento } = await documentoEnviadoPorAssociado();
    const { cliente, usuario } = await clienteAdmin();

    const expirado = await prisma.linkTemporarioDocumento.create({
      data: {
        token: `expirado-${Date.now()}`,
        documentoId: documento.id,
        usuarioId: usuario.id,
        expira_em: new Date(Date.now() - 60_000),
      },
    });

    const resposta = await cliente.get(`/app/documentos/arquivo/${expirado.token}`);
    assert.equal(resposta.status, 403);
  });

  test('token inexistente é recusado', async () => {
    const { cliente } = await clienteAdmin();
    const resposta = await cliente.get('/app/documentos/arquivo/token-que-nao-existe');
    assert.equal(resposta.status, 403);
  });

  test('visitante anônimo não baixa arquivo', async () => {
    const { documento } = await documentoEnviadoPorAssociado();
    const { cliente, usuario } = await clienteAdmin();
    await cliente.get('/app/documentos');
    const link = await prisma.linkTemporarioDocumento.findFirst({
      where: { documentoId: documento.id, usuarioId: usuario.id },
    });

    const { Cliente } = await import('./helpers/harness.mjs');
    const anonimo = new Cliente();
    const resposta = await anonimo.get(`/app/documentos/arquivo/${link.token}`);
    assert.equal(resposta.status, 401);
  });

  test('perfil sem permissão configurada não recebe link', async () => {
    const { documento } = await documentoEnviadoPorAssociado();
    const { email, senha, usuario } = await criarUsuarioDireto({ papel: Papel.SECRETARIA });
    const cliente = await entrar(email, senha);

    await cliente.get('/app/documentos');

    const link = await prisma.linkTemporarioDocumento.findFirst({
      where: { documentoId: documento.id, usuarioId: usuario.id },
    });
    assert.equal(link, null, 'sem permissão cadastrada, nenhum link deveria ser emitido');
  });

  test('permissão TODOS habilita o perfil de saúde a receber link', async () => {
    const { documento } = await documentoEnviadoPorAssociado();
    const permissao = await prisma.permissaoSolicitacaoLinkDocumento.create({
      data: { papel: Papel.SAUDE, tipoDocumento: null, escopo: 'TODOS', ativo: true },
    });

    try {
      const { email, senha, usuario } = await criarUsuarioDireto({ papel: Papel.SAUDE });
      const cliente = await entrar(email, senha);
      await cliente.get('/app/documentos');

      const link = await prisma.linkTemporarioDocumento.findFirst({
        where: { documentoId: documento.id, usuarioId: usuario.id },
      });
      assert.ok(link, 'com escopo TODOS o perfil de saúde deveria receber link');

      const arquivo = await cliente.get(`/app/documentos/arquivo/${link.token}`);
      assert.equal(arquivo.status, 200);
    } finally {
      await prisma.permissaoSolicitacaoLinkDocumento.delete({ where: { id: permissao.id } });
    }
  });
});

describe('Medicação — gestão de remessas', () => {
  test('tela de nova remessa abre para admin', async () => {
    const { cliente } = await clienteAdmin();
    assert.equal((await cliente.get('/app/medicacao/nova-remessa')).status, 200);
  });

  test('cria remessa válida', async () => {
    const { cliente } = await clienteAdmin();
    const nome = `Remessa ${Date.now()}`;

    const resposta = await cliente.postForm('/app/medicacao/nova-remessa', {
      nome,
      descricao: 'Óleo 20mg/ml frasco 30ml',
      quantidade_total: '40',
      valor_unitario: '180.50',
      data_limite: '2026-12-31',
    });
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/medicacao');

    const remessa = await prisma.remessa.findFirst({ where: { nome } });
    assert.ok(remessa);
    assert.equal(remessa.quantidade_total, 40);
    assert.equal(remessa.quantidade_disponivel, 40, 'a disponibilidade inicial é o total');
    assert.equal(Number(remessa.valor_unitario), 180.5);
    assert.equal(remessa.ativa, true);
  });

  test('recusa remessa sem nome, quantidade ou data limite', async () => {
    const { cliente } = await clienteAdmin();

    const semNome = await cliente.postForm('/app/medicacao/nova-remessa', {
      nome: '', quantidade_total: '10', data_limite: '2026-12-31',
    });
    assert.equal(semNome.status, 400);

    const semQuantidade = await cliente.postForm('/app/medicacao/nova-remessa', {
      nome: 'X', quantidade_total: '0', data_limite: '2026-12-31',
    });
    assert.equal(semQuantidade.status, 400);

    const semData = await cliente.postForm('/app/medicacao/nova-remessa', {
      nome: 'X', quantidade_total: '10', data_limite: '',
    });
    assert.equal(semData.status, 400);
  });

  test('associado não cria remessa', async () => {
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const tela = await cliente.get('/app/medicacao/nova-remessa');
    assert.equal(tela.status, 403);

    const envio = await cliente.postForm('/app/medicacao/nova-remessa', {
      nome: 'Remessa Pirata', quantidade_total: '10', data_limite: '2026-12-31',
    });
    assert.equal(envio.status, 403);
  });
});

describe('Medicação — aprovação de interesses', () => {
  async function cenario({ quantidade = 20, pedido = 5 } = {}) {
    const { cliente: admin, usuario } = await clienteAdmin();
    const remessa = await prisma.remessa.create({
      data: {
        nome: `Remessa aprovação ${Date.now()}${Math.random()}`,
        quantidade_total: quantidade,
        quantidade_disponivel: quantidade,
        data_limite: new Date(Date.now() + 30 * 86_400_000),
        criado_por_id: usuario.id,
      },
    });
    const associado = await criarAssociadoCompleto();
    const clienteAssociado = await entrar(associado.email, associado.senha);
    await clienteAssociado.postForm(`/app/medicacao/${remessa.id}/interesse`, { quantidade: String(pedido) });

    const interesse = await prisma.interesse.findFirst({
      where: { remessaId: remessa.id, associadoId: associado.associado.id },
    });
    return { admin, remessa, associado, interesse };
  }

  test('detalhe da remessa lista os interessados', async () => {
    const { admin, remessa, associado } = await cenario();
    const resposta = await admin.get(`/app/medicacao/${remessa.id}`);
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes(associado.perfil.nome_completo));
  });

  test('aprovar interesse baixa a quantidade disponível', async () => {
    const { admin, remessa, interesse } = await cenario({ quantidade: 20, pedido: 5 });

    const resposta = await admin.postForm(`/app/medicacao/${remessa.id}`, {
      interesseId: interesse.id, acao: 'aprovar',
    });
    assert.equal(resposta.status, 200);

    const depois = await prisma.interesse.findUnique({ where: { id: interesse.id } });
    const remessaDepois = await prisma.remessa.findUnique({ where: { id: remessa.id } });
    assert.equal(depois.aprovado, true);
    assert.equal(remessaDepois.quantidade_disponivel, 15);
  });

  test('cancelar aprovação devolve a quantidade', async () => {
    const { admin, remessa, interesse } = await cenario({ quantidade: 20, pedido: 5 });
    await admin.postForm(`/app/medicacao/${remessa.id}`, { interesseId: interesse.id, acao: 'aprovar' });
    await admin.postForm(`/app/medicacao/${remessa.id}`, { interesseId: interesse.id, acao: 'cancelar_aprovacao' });

    const depois = await prisma.interesse.findUnique({ where: { id: interesse.id } });
    const remessaDepois = await prisma.remessa.findUnique({ where: { id: remessa.id } });
    assert.equal(depois.aprovado, false);
    assert.equal(remessaDepois.quantidade_disponivel, 20, 'a quantidade deveria voltar ao original');
  });

  test('reprovar remove o interesse', async () => {
    const { admin, remessa, interesse } = await cenario();

    const resposta = await admin.postForm(`/app/medicacao/${remessa.id}`, {
      interesseId: interesse.id, acao: 'reprovar',
    });
    assert.equal(resposta.status, 200);
    assert.equal(await prisma.interesse.count({ where: { id: interesse.id } }), 0);
  });

  test('não aprova interesse acima da disponibilidade', async () => {
    const { admin, remessa, interesse } = await cenario({ quantidade: 10, pedido: 8 });
    await prisma.remessa.update({ where: { id: remessa.id }, data: { quantidade_disponivel: 3 } });

    const resposta = await admin.postForm(`/app/medicacao/${remessa.id}`, {
      interesseId: interesse.id, acao: 'aprovar',
    });
    assert.equal(resposta.status, 400);
    assert.ok((await resposta.text()).includes('Quantidade indisponível'));

    const depois = await prisma.interesse.findUnique({ where: { id: interesse.id } });
    assert.equal(depois.aprovado, false);
  });

  test('aprovações concorrentes não ultrapassam o estoque', async () => {
    const { admin, remessa, interesse } = await cenario({ quantidade: 5, pedido: 5 });
    const respostas = await Promise.all([
      admin.postForm(`/app/medicacao/${remessa.id}`, { interesseId: interesse.id, acao: 'aprovar' }),
      admin.postForm(`/app/medicacao/${remessa.id}`, { interesseId: interesse.id, acao: 'aprovar' }),
    ]);

    const remessaDepois = await prisma.remessa.findUnique({ where: { id: remessa.id } });
    const interesseDepois = await prisma.interesse.findUnique({ where: { id: interesse.id } });
    assert.equal(remessaDepois.quantidade_disponivel, 0);
    assert.equal(interesseDepois.aprovado, true);
    assert.equal(respostas.filter((resposta) => resposta.status === 200).length, 1);
    assert.equal(respostas.filter((resposta) => resposta.status === 400).length, 1);
  });

  test('recusa ação sem dados', async () => {
    const { admin, remessa } = await cenario();
    const resposta = await admin.postForm(`/app/medicacao/${remessa.id}`, {});
    assert.equal(resposta.status, 400);
  });

  test('associado não acessa o detalhe de gestão da remessa', async () => {
    const { remessa, associado } = await cenario();
    const cliente = await entrar(associado.email, associado.senha);
    const resposta = await cliente.get(`/app/medicacao/${remessa.id}`);
    assert.equal(resposta.status, 403);
  });
});

describe('Contatos e mensagens', () => {
  async function contatoComMensagem() {
    const { Cliente } = await import('./helpers/harness.mjs');
    const visitante = new Cliente();
    const email = emailFake('visitante');
    const telefone = telefoneFake();
    await visitante.postForm('/contato', {
      nome: nomeFake(), email, telefone,
      assunto: 'Quero me associar',
      texto: 'Como faço para me associar?',
      aceiteArmazenamento: 'on',
    });
    const contato = await prisma.contato.findFirst({
      where: { email, telefone },
      include: { Mensagens: true },
    });
    return contato;
  }

  test('admin vê os contatos e as mensagens recebidas', async () => {
    const contato = await contatoComMensagem();
    const { cliente } = await clienteAdmin();

    const resposta = await cliente.get('/app/contatos');
    assert.equal(resposta.status, 200);
    const html = await resposta.text();
    assert.ok(html.includes(contato.nome));
    assert.ok(html.includes('Como faço para me associar?'));
  });

  test('marca mensagem como lida', async () => {
    const contato = await contatoComMensagem();
    const mensagem = contato.Mensagens[0];
    const { cliente } = await clienteAdmin();

    const resposta = await cliente.postForm('/app/contatos', {
      _action: 'marcar_como_lido',
      mensagem_id: mensagem.id,
    });
    assert.equal(resposta.status, 200);

    const depois = await prisma.mensagem.findUnique({ where: { id: mensagem.id } });
    assert.equal(depois.lido, true);
  });

  test('recusa marcar como lido sem id', async () => {
    const { cliente } = await clienteAdmin();
    const resposta = await cliente.postForm('/app/contatos', { _action: 'marcar_como_lido' });
    assert.equal(resposta.status, 400);
  });

  test('resposta é gravada mesmo quando o envio de e-mail falha', async () => {
    const contato = await contatoComMensagem();
    const mensagem = contato.Mensagens[0];
    const { cliente } = await clienteAdmin();

    const resposta = await cliente.postForm('/app/contatos', {
      _action: 'enviar_resposta',
      contato_id: contato.id,
      mensagem_id: mensagem.id,
      resposta: 'Olá! Basta acessar /cadastro e preencher o formulário.',
    });

    // Sem SMTP configurado no ambiente local o envio falha e a rota devolve 500,
    // mas a resposta já foi persistida antes da tentativa de envio.
    assert.equal(resposta.status, 500);

    const respostas = await prisma.mensagem.findMany({
      where: { contatoId: contato.id, remetente: 'FROM_BENDITA' },
    });
    assert.equal(respostas.length, 1);
    assert.equal(respostas[0].respostaParaId, mensagem.id);
    assert.equal(respostas[0].lido, true);
  });

  test('recusa resposta vazia', async () => {
    const contato = await contatoComMensagem();
    const { cliente } = await clienteAdmin();

    const resposta = await cliente.postForm('/app/contatos', {
      _action: 'enviar_resposta',
      contato_id: contato.id,
      resposta: '   ',
    });
    assert.equal(resposta.status, 400);
  });

  test('perfil de saúde não altera contatos', async () => {
    const contato = await contatoComMensagem();
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.SAUDE });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/contatos', {
      _action: 'marcar_como_lido',
      mensagem_id: contato.Mensagens[0].id,
    });
    assert.equal(resposta.status, 403);
  });
});

describe('Monitor IMAP', () => {
  test('admin acessa o painel', async () => {
    const { cliente } = await clienteAdmin();
    const resposta = await cliente.get('/app/imap');
    assert.equal(resposta.status, 200);
  });

  test('não-admin é redirecionado', async () => {
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.SECRETARIA });
    const cliente = await entrar(email, senha);
    const resposta = await cliente.get('/app/imap');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/dashboard');
  });

  test('teste de IMAP é bloqueado no ambiente local', async () => {
    const { cliente } = await clienteAdmin();
    const resposta = await cliente.postForm('/app/imap', { _action: 'teste_imap' });
    assert.equal(resposta.status, 400);
    assert.ok((await resposta.text()).includes('desabilitado no ambiente local'));
  });

  test('limpar registros sincronizados', async () => {
    await prisma.checkMail.create({
      data: { messageId: `<msg-${Date.now()}@teste>`, emailFrom: 'a@b.c', emailTo: 'd@e.f' },
    });
    const { cliente } = await clienteAdmin();

    const resposta = await cliente.postForm('/app/imap', { _action: 'limpar_todos' });
    assert.equal(resposta.status, 200);
    assert.equal(await prisma.checkMail.count(), 0);
  });

  test('ação desconhecida devolve 405', async () => {
    const { cliente } = await clienteAdmin();
    const resposta = await cliente.postForm('/app/imap', { _action: 'sei_la' });
    assert.equal(resposta.status, 405);
  });
});
