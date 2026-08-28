/**
 * Matriz de acesso por papel, conforme app/secure/permissions.ts.
 * O guarda vive no loader de app/root.tsx: quem não pode ver a página
 * deveria ser mandado para /app/autorizacao.
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  prisma, entrar, criarUsuarioDireto, criarAssociadoCompleto, Papel, Cliente,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

/** Cria um cliente logado com o papel pedido (associados já com termo aceito). */
async function clientePara(papel) {
  if (papel === Papel.ASSOCIADO) {
    const { email, senha } = await criarAssociadoCompleto();
    return entrar(email, senha, papel);
  }
  const { email, senha } = await criarUsuarioDireto({ papel });
  return entrar(email, senha, papel);
}

const MATRIZ = [
  { rota: '/app/dashboard', permitidos: [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE, Papel.SAUDE, Papel.SECRETARIA, Papel.ADMIN] },
  { rota: '/app/perfil', permitidos: [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE, Papel.SAUDE, Papel.SECRETARIA, Papel.ADMIN] },
  { rota: '/app/gente', permitidos: [Papel.SAUDE, Papel.SECRETARIA, Papel.ADMIN] },
  { rota: '/app/contatos', permitidos: [Papel.SAUDE, Papel.SECRETARIA, Papel.ADMIN] },
  { rota: '/app/financeiro', permitidos: [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE, Papel.SECRETARIA, Papel.ADMIN] },
  { rota: '/app/medicacao', permitidos: [Papel.ASSOCIADO, Papel.SAUDE, Papel.ADMIN] },
  { rota: '/app/documentos', permitidos: [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE, Papel.SAUDE, Papel.SECRETARIA, Papel.ADMIN] },
];

const PAPEIS = [Papel.ASSOCIADO, Papel.ASSOCIADO_DEPENDENTE, Papel.SAUDE, Papel.SECRETARIA, Papel.ADMIN];

describe('Acesso permitido por papel', () => {
  for (const { rota, permitidos } of MATRIZ) {
    for (const papel of permitidos) {
      test(`${papel} acessa ${rota}`, async () => {
        const cliente = await clientePara(papel);
        const resposta = await cliente.get(rota);
        assert.equal(resposta.status, 200, `${papel} deveria acessar ${rota}`);
      });
    }
  }
});

describe('Acesso negado por papel', () => {
  for (const { rota, permitidos } of MATRIZ) {
    for (const papel of PAPEIS.filter((p) => !permitidos.includes(p))) {
      test(`${papel} é barrado em ${rota}`, async () => {
        const cliente = await clientePara(papel);
        const resposta = await cliente.get(rota);
        assert.ok(
          resposta.status === 302 || resposta.status === 403,
          `${papel} não consta em PaginasPorPapel["${rota}"] e deveria ser barrado`
        );
        if (resposta.status === 302) {
          assert.equal(resposta.headers.get('location'), '/app/autorizacao');
        }
      });
    }
  }
});

describe('Página de não autorizado', () => {
  test('abre para qualquer usuário logado', async () => {
    const cliente = await clientePara(Papel.ASSOCIADO);
    const resposta = await cliente.get('/app/autorizacao');
    assert.equal(resposta.status, 200);
  });
});

describe('Rotas administrativas contra usuário sem privilégio', () => {
  test('POST anônimo não edita, exclui, importa ou exporta dados', async () => {
    const anonimo = new Cliente();
    const alvo = await criarAssociadoCompleto();

    const edicao = await anonimo.postMultipart(`/app/gente/${alvo.perfil.id}/editar`, {
      email: alvo.email,
      papel: Papel.ADMIN,
      nome_completo: 'Invadido',
      cpf: alvo.perfil.cpf,
      telefone: alvo.perfil.telefone,
    });
    const exclusao = await anonimo.postForm(`/app/gente/${alvo.perfil.id}/deletar`, {});
    const importacao = await anonimo.postMultipart('/app/gente/importar', {}, {
      arquivo: { conteudo: Buffer.from('arquivo'), nome: 'dados.xlsx', tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    });
    const exportacao = await anonimo.get('/app/gente/exportar');

    assert.equal(edicao.status, 302);
    assert.equal(exclusao.status, 302);
    assert.equal(importacao.status, 302);
    assert.equal(exportacao.status, 302);
    assert.equal((await prisma.perfil.findUnique({ where: { id: alvo.perfil.id } })).nome_completo, alvo.perfil.nome_completo);
  });

  test('associado não abre o cadastro de pessoas', async () => {
    const cliente = await clientePara(Papel.ASSOCIADO);
    const resposta = await cliente.get('/app/gente/novo');
    assert.ok([302, 403].includes(resposta.status), 'associado não deveria abrir /app/gente/novo');
  });

  test('associado não exporta o relatório de pessoas', async () => {
    const cliente = await clientePara(Papel.ASSOCIADO);
    const resposta = await cliente.get('/app/gente/exportar');
    assert.notEqual(resposta.status, 200, 'associado não deveria exportar a base de pessoas');
  });

  test('associado não abre a importação de pessoas', async () => {
    const cliente = await clientePara(Papel.ASSOCIADO);
    const resposta = await cliente.get('/app/gente/importar');
    assert.ok([302, 403].includes(resposta.status), 'associado não deveria abrir a importação');
  });

  test('associado não deleta o perfil de outra pessoa', async () => {
    const alvo = await criarAssociadoCompleto();
    const cliente = await clientePara(Papel.ASSOCIADO);

    const resposta = await cliente.postForm(`/app/gente/${alvo.perfil.id}/deletar`, {});
    assert.notEqual(resposta.status, 302, 'a exclusão não deveria ser executada');
    assert.equal(await prisma.perfil.count({ where: { id: alvo.perfil.id } }), 1,
      'o perfil alvo deveria continuar existindo');
  });

  test('associado não edita o perfil de outra pessoa', async () => {
    const alvo = await criarAssociadoCompleto();
    const cliente = await clientePara(Papel.ASSOCIADO);

    await cliente.postMultipart(`/app/gente/${alvo.perfil.id}/editar`, {
      email: alvo.email,
      papel: Papel.ADMIN,
      nome_completo: 'Invadido',
      cpf: alvo.perfil.cpf,
      telefone: alvo.perfil.telefone,
    });

    const depois = await prisma.perfil.findUnique({
      where: { id: alvo.perfil.id },
      include: { usuario: true },
    });
    assert.notEqual(depois.nome_completo, 'Invadido', 'o perfil não deveria ter sido alterado');
    assert.notEqual(depois.usuario.papel, Papel.ADMIN, 'o papel não deveria ter sido elevado');
  });

  test('visitante anônimo não acessa nada da área restrita', async () => {
    const anonimo = new Cliente();
    for (const { rota } of MATRIZ) {
      const resposta = await anonimo.get(rota);
      assert.equal(resposta.status, 302, `${rota} deveria exigir login`);
      assert.equal(resposta.headers.get('location'), '/autentica/entrar');
    }
  });
});
