import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { Cliente, prisma, nomeFake, telefoneFake, emailFake } from './helpers/harness.mjs';

after(() => prisma.$disconnect());

describe('Páginas públicas', () => {
  const rotas = [
    ['/', 'Bendita'],
    ['/sobre', null],
    ['/servicos', null],
    ['/conhecimento', null],
    ['/contato', 'Contato'],
    ['/autentica/entrar', 'senha'],
    ['/autentica/senha', null],
    ['/cadastro/basico', 'nome_completo'],
  ];

  for (const [rota, trecho] of rotas) {
    test(`GET ${rota} responde 200`, async () => {
      const cliente = new Cliente();
      const resposta = await cliente.get(rota);
      const html = await resposta.text();
      assert.equal(resposta.status, 200, `esperava 200 em ${rota}, veio ${resposta.status}`);
      assert.ok(html.includes('<!DOCTYPE html>'), 'resposta deveria ser um documento HTML');
      if (trecho) assert.ok(html.includes(trecho), `esperava encontrar "${trecho}" em ${rota}`);
    });
  }

  test('GET /cadastro redireciona para a primeira etapa', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.get('/cadastro');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/cadastro/basico');
  });

  test('rota inexistente devolve 404', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.get('/rota-que-nao-existe');
    assert.equal(resposta.status, 404);
  });
});

describe('Formulário de contato', () => {
  test('recusa envio sem os campos obrigatórios', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.postForm('/contato', { nome: '', email: '', telefone: '', texto: '' });
    assert.equal(resposta.status, 400);
    const html = await resposta.text();
    assert.ok(html.includes('obrigatorio') || html.includes('obrigatório'), 'deveria exibir erros de validação');
  });

  test('recusa envio sem o aceite de armazenamento', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.postForm('/contato', {
      nome: nomeFake(),
      email: emailFake('contato'),
      telefone: telefoneFake(),
      texto: 'Mensagem sem aceite.',
    });
    assert.equal(resposta.status, 400);
  });

  test('grava contato e mensagem quando o envio é válido', async () => {
    const cliente = new Cliente();
    const email = emailFake('contato');
    const telefone = telefoneFake();
    const nome = nomeFake();

    const resposta = await cliente.postForm('/contato', {
      nome,
      email,
      telefone,
      assunto: 'Dúvida sobre associação',
      texto: 'Gostaria de saber como me associar.',
      aceiteArmazenamento: 'on',
    });

    assert.equal(resposta.status, 200);

    const contato = await prisma.contato.findFirst({
      where: { email, telefone },
      include: { Mensagens: true },
    });
    assert.ok(contato, 'contato deveria ter sido criado');
    assert.equal(contato.nome, nome);
    assert.equal(contato.Mensagens.length, 1);
    assert.equal(contato.Mensagens[0].assunto, 'Dúvida sobre associação');
    assert.equal(contato.Mensagens[0].remetente, 'FROM_CONTACT');
    assert.equal(contato.Mensagens[0].lido, false);
  });

  test('reaproveita o contato existente e acumula mensagens', async () => {
    const cliente = new Cliente();
    const email = emailFake('recorrente');
    const telefone = telefoneFake();

    await cliente.postForm('/contato', {
      nome: 'Nome Antigo',
      email,
      telefone,
      texto: 'Primeira mensagem.',
      aceiteArmazenamento: 'on',
    });
    await cliente.postForm('/contato', {
      nome: 'Nome Novo',
      email,
      telefone,
      texto: 'Segunda mensagem.',
      aceiteArmazenamento: 'on',
    });

    const contatos = await prisma.contato.findMany({
      where: { email, telefone },
      include: { Mensagens: true },
    });
    assert.equal(contatos.length, 1, 'não deveria duplicar o contato');
    assert.equal(contatos[0].nome, 'Nome Novo', 'o nome deveria ser atualizado');
    assert.equal(contatos[0].Mensagens.length, 2);
  });

  test('GET em /contato com método não permitido não quebra', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.requisitar('/contato', { method: 'PUT' });
    assert.ok(resposta.status === 405 || resposta.status === 400, `status inesperado: ${resposta.status}`);
  });
});
