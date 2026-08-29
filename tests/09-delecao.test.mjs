import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, prisma, entrar, criarUsuarioDireto, criarAssociadoCompleto,
  arquivoPng, nomeFake, telefoneFake, emailFake, unico, Papel,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

async function clientePapel(papel) {
  const { email, senha, usuario, perfil } = await criarUsuarioDireto({ papel });
  const cliente = await entrar(email, senha, papel.toLowerCase());
  return { cliente, usuario, perfil };
}

/** Sobe um documento de verdade e devolve o registro criado. */
async function associadoComDocumento() {
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

  return { ...associado, cliente, documento };
}

/** Reproduz o link temporário que a listagem cria ao gerar a miniatura. */
async function criarLinkTemporario(documentoId, usuarioId) {
  return prisma.linkTemporarioDocumento.create({
    data: {
      token: `token-teste-${unico()}`,
      documentoId,
      usuarioId,
      expira_em: new Date(Date.now() + 60_000),
    },
  });
}

function destinoDe(resposta) {
  const location = resposta.headers.get('location');
  assert.ok(location, 'deveria redirecionar');
  return new URLSearchParams(location.split('?')[1] ?? '');
}

describe('Deleção de documento', () => {
  test('admin deleta documento com link temporário pendente', async () => {
    const { documento } = await associadoComDocumento();
    const { cliente, usuario: admin } = await clientePapel(Papel.ADMIN);

    // É este link que fazia a deleção estourar P2014 em produção.
    await criarLinkTemporario(documento.id, admin.id);

    const resposta = await cliente.postForm(`/app/documentos/${documento.id}/deletar`, {});

    assert.equal(resposta.status, 302);
    assert.ok(destinoDe(resposta).get('sucesso'));
    assert.equal(await prisma.documentos.count({ where: { id: documento.id } }), 0);
    assert.equal(
      await prisma.linkTemporarioDocumento.count({ where: { documentoId: documento.id } }),
      0,
      'o link temporário deveria sair junto',
    );
  });

  test('o arquivo físico some do storage', async () => {
    const { documento } = await associadoComDocumento();
    const caminho = path.join(ROOT, 'storage-private', documento.nome_arquivo);

    await fs.access(caminho);

    const { cliente } = await clientePapel(Papel.ADMIN);
    await cliente.postForm(`/app/documentos/${documento.id}/deletar`, {});

    await assert.rejects(() => fs.access(caminho), 'o arquivo deveria ter sido removido');
  });

  test('associado deleta o próprio documento', async () => {
    const { cliente, documento } = await associadoComDocumento();

    const resposta = await cliente.postForm(`/app/documentos/${documento.id}/deletar`, {});

    assert.equal(resposta.status, 302);
    assert.equal(await prisma.documentos.count({ where: { id: documento.id } }), 0);
  });

  test('associado não deleta documento de outra pessoa', async () => {
    const { documento } = await associadoComDocumento();
    const outro = await criarAssociadoCompleto();
    const cliente = await entrar(outro.email, outro.senha);

    const resposta = await cliente.postForm(`/app/documentos/${documento.id}/deletar`, {});

    assert.equal(resposta.status, 403);
    assert.equal(await prisma.documentos.count({ where: { id: documento.id } }), 1);
  });

  test('secretaria e saúde deletam documento de qualquer associado', async () => {
    for (const papel of [Papel.SECRETARIA, Papel.SAUDE]) {
      const { documento } = await associadoComDocumento();
      const { cliente } = await clientePapel(papel);

      const resposta = await cliente.postForm(`/app/documentos/${documento.id}/deletar`, {});

      assert.equal(resposta.status, 302, `${papel} deveria conseguir deletar`);
      assert.equal(await prisma.documentos.count({ where: { id: documento.id } }), 0);
    }
  });
});

describe('Deleção de perfil em cascata', () => {
  test('perfil com documento, link temporário, pagamento e interesse é removido inteiro', async () => {
    const { perfil, usuario, associado, documento } = await associadoComDocumento();
    const { cliente, usuario: admin } = await clientePapel(Papel.ADMIN);

    await criarLinkTemporario(documento.id, admin.id);
    await prisma.pagamento.create({
      data: { associadoId: associado.id, proximo_vencimento: new Date(), observacao: 'Mensalidade' },
    });
    const remessa = await prisma.remessa.create({
      data: {
        nome: `Remessa ${unico()}`,
        quantidade_total: 10,
        quantidade_disponivel: 6,
        data_limite: new Date(Date.now() + 86_400_000),
        criado_por_id: admin.id,
      },
    });
    await prisma.interesse.create({
      data: { remessaId: remessa.id, associadoId: associado.id, quantidade: 4, aprovado: true },
    });

    const resposta = await cliente.postForm(`/app/gente/${perfil.id}/deletar`, {});

    assert.equal(resposta.status, 302);
    assert.ok(destinoDe(resposta).get('sucesso'));

    assert.equal(await prisma.perfil.count({ where: { id: perfil.id } }), 0);
    assert.equal(await prisma.usuario.count({ where: { id: usuario.id } }), 0);
    assert.equal(await prisma.associado.count({ where: { id: associado.id } }), 0);
    assert.equal(await prisma.documentos.count({ where: { associadoId: associado.id } }), 0);
    assert.equal(await prisma.pagamento.count({ where: { associadoId: associado.id } }), 0);
    assert.equal(await prisma.interesse.count({ where: { associadoId: associado.id } }), 0);
    assert.equal(await prisma.linkTemporarioDocumento.count({ where: { documentoId: documento.id } }), 0);

    const remessaDepois = await prisma.remessa.findUnique({ where: { id: remessa.id } });
    assert.equal(remessaDepois.quantidade_disponivel, 10, 'o interesse aprovado deveria devolver a quantidade');
  });

  test('dependente é removido junto com o responsável', async () => {
    const responsavel = await criarAssociadoCompleto();

    const { usuario: usuarioDependente } = await criarUsuarioDireto({
      papel: Papel.ASSOCIADO_DEPENDENTE,
      email: emailFake('dependente'),
      comPerfil: false,
    });
    const perfilDependente = await prisma.perfil.create({
      data: {
        nome_completo: nomeFake(),
        data_nascimento: '2012-03-04',
        telefone: telefoneFake(),
        nacionalidade: 'Brasil',
        usuarioId: usuarioDependente.id,
      },
    });
    const associadoDependente = await prisma.associado.create({
      data: { perfilId: perfilDependente.id, responsavelId: responsavel.perfil.id },
    });

    const { cliente } = await clientePapel(Papel.ADMIN);
    const resposta = await cliente.postForm(`/app/gente/${responsavel.perfil.id}/deletar`, {});

    assert.equal(resposta.status, 302);
    assert.equal(await prisma.perfil.count({ where: { id: perfilDependente.id } }), 0);
    assert.equal(await prisma.usuario.count({ where: { id: usuarioDependente.id } }), 0);
    assert.equal(await prisma.associado.count({ where: { id: associadoDependente.id } }), 0);
  });

  test('documento enviado para outra pessoa sobrevive, só perde a autoria', async () => {
    // Uma secretaria subiu o documento de um associado; ao deletar a secretaria,
    // o documento é do associado e precisa continuar de pé.
    const { perfil: perfilSecretaria } = await clientePapel(Papel.SECRETARIA);
    const alvo = await criarAssociadoCompleto();

    const documento = await prisma.documentos.create({
      data: {
        tipo: 'IDENTIFICACAO',
        nome_arquivo: 'local/doc-de-terceiro.png',
        associadoId: alvo.associado.id,
        criadoPorId: perfilSecretaria.id,
      },
    });

    const { cliente } = await clientePapel(Papel.ADMIN);
    const resposta = await cliente.postForm(`/app/gente/${perfilSecretaria.id}/deletar`, {});
    assert.equal(resposta.status, 302);

    const depois = await prisma.documentos.findUnique({ where: { id: documento.id } });
    assert.ok(depois, 'o documento do outro associado deveria continuar existindo');
    assert.equal(depois.criadoPorId, null, 'a autoria deveria ser limpa');
  });
});

describe('Deleção de pagamento, remessa e contato', () => {
  test('admin deleta pagamento', async () => {
    const associado = await criarAssociadoCompleto();
    const pagamento = await prisma.pagamento.create({
      data: { associadoId: associado.associado.id, proximo_vencimento: new Date(), observacao: 'Mensalidade' },
    });

    const { cliente } = await clientePapel(Papel.ADMIN);
    const resposta = await cliente.postForm(`/app/financeiro/${pagamento.id}/deletar`, {});

    assert.equal(resposta.status, 302);
    assert.equal(await prisma.pagamento.count({ where: { id: pagamento.id } }), 0);
  });

  test('secretaria deleta pagamento, associado não', async () => {
    const associado = await criarAssociadoCompleto();
    const pagamento = await prisma.pagamento.create({
      data: { associadoId: associado.associado.id, proximo_vencimento: new Date() },
    });

    const clienteAssociado = await entrar(associado.email, associado.senha);
    const recusado = await clienteAssociado.postForm(`/app/financeiro/${pagamento.id}/deletar`, {});
    assert.equal(recusado.status, 403);
    assert.equal(await prisma.pagamento.count({ where: { id: pagamento.id } }), 1);

    const { cliente } = await clientePapel(Papel.SECRETARIA);
    const aceito = await cliente.postForm(`/app/financeiro/${pagamento.id}/deletar`, {});
    assert.equal(aceito.status, 302);
    assert.equal(await prisma.pagamento.count({ where: { id: pagamento.id } }), 0);
  });

  test('admin deleta remessa e os interesses vão junto', async () => {
    const associado = await criarAssociadoCompleto();
    const { cliente, usuario: admin } = await clientePapel(Papel.ADMIN);

    const remessa = await prisma.remessa.create({
      data: {
        nome: `Remessa ${unico()}`,
        quantidade_total: 5,
        quantidade_disponivel: 5,
        data_limite: new Date(Date.now() + 86_400_000),
        criado_por_id: admin.id,
      },
    });
    await prisma.interesse.create({
      data: { remessaId: remessa.id, associadoId: associado.associado.id, quantidade: 2 },
    });

    const resposta = await cliente.postForm(`/app/medicacao/${remessa.id}/deletar`, {});

    assert.equal(resposta.status, 302);
    assert.equal(await prisma.remessa.count({ where: { id: remessa.id } }), 0);
    assert.equal(await prisma.interesse.count({ where: { remessaId: remessa.id } }), 0);
  });

  test('admin deleta contato e as mensagens vão junto', async () => {
    const contato = await prisma.contato.create({
      data: { nome: nomeFake(), email: emailFake('contato'), telefone: telefoneFake() },
    });
    await prisma.mensagem.create({
      data: { contatoId: contato.id, texto: 'Olá, tenho uma dúvida.' },
    });

    const { cliente } = await clientePapel(Papel.ADMIN);
    const resposta = await cliente.postForm(`/app/contatos/${contato.id}/deletar`, {});

    assert.equal(resposta.status, 302);
    assert.equal(await prisma.contato.count({ where: { id: contato.id } }), 0);
    assert.equal(await prisma.mensagem.count({ where: { contatoId: contato.id } }), 0);
  });

  test('não-admin não deleta remessa nem contato', async () => {
    const { usuario: admin } = await clientePapel(Papel.ADMIN);
    const remessa = await prisma.remessa.create({
      data: {
        nome: `Remessa ${unico()}`,
        quantidade_total: 3,
        quantidade_disponivel: 3,
        data_limite: new Date(Date.now() + 86_400_000),
        criado_por_id: admin.id,
      },
    });
    const contato = await prisma.contato.create({
      data: { nome: nomeFake(), email: emailFake('contato'), telefone: telefoneFake() },
    });

    const { cliente } = await clientePapel(Papel.SECRETARIA);

    assert.equal((await cliente.postForm(`/app/medicacao/${remessa.id}/deletar`, {})).status, 403);
    assert.equal((await cliente.postForm(`/app/contatos/${contato.id}/deletar`, {})).status, 403);
    assert.equal(await prisma.remessa.count({ where: { id: remessa.id } }), 1);
    assert.equal(await prisma.contato.count({ where: { id: contato.id } }), 1);
  });
});
