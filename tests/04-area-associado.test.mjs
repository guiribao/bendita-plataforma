import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  prisma, entrar, criarAssociadoCompleto, arquivoPng, arquivoPdf,
  AssociacaoStatus, Papel, criarUsuarioDireto,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

async function remessaFake({ quantidade = 50, diasAteLimite = 30, ativa = true } = {}) {
  const criador = await criarUsuarioDireto({ papel: Papel.ADMIN });
  return prisma.remessa.create({
    data: {
      nome: `Remessa de teste ${Date.now()}`,
      descricao: 'Óleo full spectrum 20mg/ml',
      quantidade_total: quantidade,
      quantidade_disponivel: quantidade,
      valor_unitario: '180.00',
      data_limite: new Date(Date.now() + diasAteLimite * 86_400_000),
      ativa,
      criado_por_id: criador.usuario.id,
    },
  });
}

describe('Termo associativo', () => {
  test('abre para quem ainda não aceitou', async () => {
    const { email, senha } = await criarAssociadoCompleto({ aceitouTermo: false });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/app/termo-associativo');
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes('aceite'), 'a tela deveria pedir o aceite');
  });

  test('recusa envio sem marcar o aceite', async () => {
    const { email, senha, associado } = await criarAssociadoCompleto({ aceitouTermo: false });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/termo-associativo', {});
    assert.equal(resposta.status, 400);

    const depois = await prisma.associado.findUnique({ where: { id: associado.id } });
    assert.notEqual(depois.de_acordo_termo_associativo, true);
  });

  test('registra o aceite e libera o dashboard', async () => {
    const { email, senha, associado } = await criarAssociadoCompleto({ aceitouTermo: false });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/termo-associativo', { aceite: 'on' });
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/dashboard');

    const depois = await prisma.associado.findUnique({ where: { id: associado.id } });
    assert.equal(depois.de_acordo_termo_associativo, true);
    assert.ok(depois.de_acordo_termo_associativo_em instanceof Date);

    const dashboard = await cliente.get('/app/dashboard');
    assert.equal(dashboard.status, 200, 'depois do aceite o dashboard deveria abrir');
  });

  test('quem já aceitou é redirecionado para o dashboard', async () => {
    const { email, senha } = await criarAssociadoCompleto({ aceitouTermo: true });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/app/termo-associativo');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/dashboard');
  });
});

describe('Dashboard e perfil do associado', () => {
  test('dashboard mostra os dados do associado', async () => {
    const { email, senha, perfil } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/app/dashboard');
    assert.equal(resposta.status, 200);
    const html = await resposta.text();
    assert.ok(html.includes('Painel Inicial'));
    assert.ok(html.includes(perfil.nome_completo), 'deveria exibir o nome do associado');
  });

  test('página de perfil carrega dados, documentos e pagamentos', async () => {
    const { email, senha, perfil, associado } = await criarAssociadoCompleto();
    await prisma.pagamento.create({
      data: {
        associadoId: associado.id,
        proximo_vencimento: new Date(Date.now() + 30 * 86_400_000),
        valor: '20.00',
        observacao: 'Mensalidade',
      },
    });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/app/perfil');
    assert.equal(resposta.status, 200);
    const html = await resposta.text();
    assert.ok(html.includes(perfil.nome_completo));
    assert.ok(html.includes('Mensalidade'), 'deveria listar o pagamento registrado');
  });

  test('tela de edição de perfil abre', async () => {
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);
    const resposta = await cliente.get('/app/perfil/editar');
    assert.equal(resposta.status, 200);
  });
});

describe('Edição de perfil', () => {
  test('atualiza informações pessoais', async () => {
    const { email, senha, perfil } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/perfil/editar', {
      tipo: 'pessoal',
      nome_completo: 'Nome Atualizado Silva',
      apelido: 'Novo Apelido',
      data_nascimento: '15/03/1988',
      sexo: 'Masculino',
      cpf: perfil.cpf,
      rg: '7654321',
      nacionalidade: 'Brasil',
      estado_civil: 'Casado(a)',
      telefone: '(47) 90000-0000',
    });
    assert.equal(resposta.status, 200);

    const atualizado = await prisma.perfil.findUnique({ where: { id: perfil.id } });
    assert.equal(atualizado.nome_completo, 'Nome Atualizado Silva');
    assert.equal(atualizado.apelido, 'Novo Apelido');
    assert.equal(atualizado.data_nascimento, '1988-03-15', 'a data BR deveria virar ISO');
    assert.equal(atualizado.estado_civil, 'Casado(a)');
  });

  test('aceita data de nascimento já em formato ISO', async () => {
    const { email, senha, perfil } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    await cliente.postForm('/app/perfil/editar', {
      tipo: 'pessoal',
      nome_completo: perfil.nome_completo,
      data_nascimento: '1975-12-01',
    });

    const atualizado = await prisma.perfil.findUnique({ where: { id: perfil.id } });
    assert.equal(atualizado.data_nascimento, '1975-12-01');
  });

  test('recusa data de nascimento inválida', async () => {
    const { email, senha, perfil } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/perfil/editar', {
      tipo: 'pessoal',
      nome_completo: 'Não Deve Salvar',
      data_nascimento: '31/02/1990',
    });
    assert.equal(resposta.status, 400);

    const atualizado = await prisma.perfil.findUnique({ where: { id: perfil.id } });
    assert.notEqual(atualizado.nome_completo, 'Não Deve Salvar');
  });

  test('atualiza endereço', async () => {
    const { email, senha, perfil } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/perfil/editar', {
      tipo: 'endereco',
      cep: '88010-100',
      endereco_rua: 'Avenida Beira Mar',
      endereco_numero: '4000',
      endereco_complemento: 'Apto 302',
      endereco_bairro: 'Centro',
      endereco_cidade: 'Florianópolis',
      endereco_estado: 'SC',
    });
    assert.equal(resposta.status, 200);

    const atualizado = await prisma.perfil.findUnique({ where: { id: perfil.id } });
    assert.equal(atualizado.endereco_cidade, 'Florianópolis');
    assert.equal(atualizado.endereco_numero, '4000');
    assert.equal(atualizado.cep, '88010-100');
  });

  test('atualiza redes sociais', async () => {
    const { email, senha, perfil } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    await cliente.postForm('/app/perfil/editar', {
      tipo: 'redes',
      redes_instagram: '@meu_insta',
      redes_linkedin: 'in/meu-linkedin',
    });

    const atualizado = await prisma.perfil.findUnique({ where: { id: perfil.id } });
    assert.equal(atualizado.redes_instagram, '@meu_insta');
    assert.equal(atualizado.redes_linkedin, 'in/meu-linkedin');
  });

  test('atualiza informações de saúde', async () => {
    const { email, senha, associado } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/perfil/editar', {
      tipo: 'saude',
      saude_quadro_geral: 'Ansiedade e insônia',
      saude_uso_medicacao: 'on',
      saude_uso_medicacao_nome: 'Sertralina',
      saude_uso_terapeutico_canabis: 'on',
      saude_uso_terapeutico_canabis_experiencia: 'Melhora do sono',
      saude_medico_prescritor: 'on',
      saude_medico_prescritor_nome: 'Dr. Carlos Prescritor',
      saude_medico_prescritor_crm: 'CRM/SC 99999',
    });
    assert.equal(resposta.status, 200);

    const atualizado = await prisma.associado.findUnique({ where: { id: associado.id } });
    assert.equal(atualizado.saude_quadro_geral, 'Ansiedade e insônia');
    assert.equal(atualizado.saude_uso_medicacao, true);
    assert.equal(atualizado.saude_medico_prescritor_nome, 'Dr. Carlos Prescritor');
  });

  test('recusa tipo de atualização desconhecido', async () => {
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);
    const resposta = await cliente.postForm('/app/perfil/editar', { tipo: 'inexistente' });
    assert.equal(resposta.status, 400);
  });

  test('bloqueia edição de saúde para quem não é associado', async () => {
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.SECRETARIA });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/perfil/editar', {
      tipo: 'saude',
      saude_quadro_geral: 'Nada',
    });
    assert.equal(resposta.status, 400);
  });
});

describe('Documentos do associado', () => {
  test('lista apenas os próprios documentos', async () => {
    const meu = await criarAssociadoCompleto();
    const outro = await criarAssociadoCompleto();

    await prisma.documentos.create({
      data: { tipo: 'IDENTIFICACAO', nome_arquivo: 'local/meu-rg.png', associadoId: meu.associado.id, criadoPorId: meu.perfil.id },
    });
    await prisma.documentos.create({
      data: { tipo: 'IDENTIFICACAO', nome_arquivo: 'local/outro-rg.png', associadoId: outro.associado.id, criadoPorId: outro.perfil.id },
    });

    const cliente = await entrar(meu.email, meu.senha);
    const resposta = await cliente.get('/app/documentos');
    assert.equal(resposta.status, 200);
  });

  test('associado envia documentos pela tela de upload', async () => {
    const { email, senha, associado } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const tela = await cliente.get('/app/documentos/novo');
    assert.equal(tela.status, 200);

    const resposta = await cliente.postMultipart('/app/documentos/novo', {}, {
      identificacao_1: arquivoPng('meu-rg.png'),
      comprovante_residencia: arquivoPdf('minha-conta.pdf'),
    });
    assert.equal(resposta.status, 200);

    const documentos = await prisma.documentos.findMany({ where: { associadoId: associado.id } });
    assert.equal(documentos.length, 2);
    assert.ok(documentos.some((d) => d.tipo === 'IDENTIFICACAO'));
    assert.ok(documentos.some((d) => d.tipo === 'COMPROVANTE_RESIDENCIA'));
  });

  test('associado dependente envia documentos para o próprio cadastro', async () => {
    const dependente = await criarAssociadoCompleto({ papel: Papel.ASSOCIADO_DEPENDENTE });
    const cliente = await entrar(dependente.email, dependente.senha);

    assert.equal((await cliente.get('/app/documentos/novo')).status, 200);
    const resposta = await cliente.postMultipart('/app/documentos/novo', {}, {
      identificacao_1: arquivoPng('dependente-rg.png'),
    });
    assert.equal(resposta.status, 200);

    const documentos = await prisma.documentos.findMany({ where: { associadoId: dependente.associado.id } });
    assert.equal(documentos.length, 1);
    assert.equal(documentos[0].tipo, 'IDENTIFICACAO');
  });

  test('quem não é associado não acessa a tela de upload', async () => {
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.SECRETARIA });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/app/documentos/novo');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/documentos');
  });
});

describe('Financeiro do associado', () => {
  test('associado dependente solicita o próprio aporte social', async () => {
    const dependente = await criarAssociadoCompleto({
      papel: Papel.ASSOCIADO_DEPENDENTE,
      elegivelTarifaSocial: true,
    });
    const cliente = await entrar(dependente.email, dependente.senha);

    const tela = await cliente.get('/app/financeiro');
    assert.equal(tela.status, 200);
    const resposta = await cliente.postForm('/app/financeiro', { action: 'solicitar_aporte' });
    assert.equal(resposta.status, 200);

    const pagamentos = await prisma.pagamento.findMany({ where: { associadoId: dependente.associado.id } });
    assert.equal(pagamentos.length, 1);
    assert.equal(Number(pagamentos[0].valor), 0);
    assert.match(pagamentos[0].observacao, /Mensalidade social/);
  });
});

describe('Medicação — visão do associado', () => {
  test('lista remessas ativas', async () => {
    const remessa = await remessaFake();
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/app/medicacao');
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes(remessa.nome), 'a remessa ativa deveria aparecer');
  });

  test('registra interesse em uma remessa', async () => {
    const remessa = await remessaFake({ quantidade: 10 });
    const { email, senha, associado } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const tela = await cliente.get(`/app/medicacao/${remessa.id}/interesse`);
    assert.equal(tela.status, 200);

    const resposta = await cliente.postForm(`/app/medicacao/${remessa.id}/interesse`, {
      quantidade: '3',
      observacao: 'Uso contínuo',
    });
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/medicacao');

    const interesse = await prisma.interesse.findFirst({ where: { remessaId: remessa.id, associadoId: associado.id } });
    assert.ok(interesse);
    assert.equal(interesse.quantidade, 3);
    assert.equal(interesse.observacao, 'Uso contínuo');
    assert.equal(interesse.aprovado, false, 'interesse novo entra pendente');
  });

  test('recusa quantidade acima da disponibilidade', async () => {
    const remessa = await remessaFake({ quantidade: 5 });
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm(`/app/medicacao/${remessa.id}/interesse`, { quantidade: '99' });
    assert.equal(resposta.status, 400);
    assert.ok((await resposta.text()).includes('excede a disponibilidade'));
  });

  test('recusa quantidade zerada ou negativa', async () => {
    const remessa = await remessaFake();
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const zero = await cliente.postForm(`/app/medicacao/${remessa.id}/interesse`, { quantidade: '0' });
    assert.equal(zero.status, 400);

    const negativa = await cliente.postForm(`/app/medicacao/${remessa.id}/interesse`, { quantidade: '-5' });
    assert.equal(negativa.status, 400);
  });

  test('não permite dois interesses na mesma remessa', async () => {
    const remessa = await remessaFake();
    const { email, senha, associado } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    await cliente.postForm(`/app/medicacao/${remessa.id}/interesse`, { quantidade: '1' });

    const tela = await cliente.get(`/app/medicacao/${remessa.id}/interesse`);
    assert.equal(tela.status, 302, 'quem já manifestou interesse deveria ser redirecionado');
    assert.equal(tela.headers.get('location'), '/app/medicacao');

    assert.equal(await prisma.interesse.count({ where: { remessaId: remessa.id, associadoId: associado.id } }), 1);
  });

  test('remessa fora do prazo não aceita novo interesse', async () => {
    const remessa = await remessaFake({ diasAteLimite: -1 });
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);

    const tela = await cliente.get(`/app/medicacao/${remessa.id}/interesse`);
    assert.equal(tela.status, 302);
    assert.equal(tela.headers.get('location'), '/app/medicacao');
  });

  test('remessa inexistente devolve 404', async () => {
    const { email, senha } = await criarAssociadoCompleto();
    const cliente = await entrar(email, senha);
    const resposta = await cliente.get('/app/medicacao/00000000-0000-0000-0000-000000000000/interesse');
    assert.equal(resposta.status, 404);
  });
});

describe('Financeiro — visão do associado', () => {
  test('lista os próprios pagamentos', async () => {
    const { email, senha, associado } = await criarAssociadoCompleto();
    await prisma.pagamento.create({
      data: {
        associadoId: associado.id,
        proximo_vencimento: new Date(Date.now() + 30 * 86_400_000),
        valor: '20.00',
        observacao: 'Mensalidade',
      },
    });

    const cliente = await entrar(email, senha);
    const resposta = await cliente.get('/app/financeiro');
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes('Mensalidade'));
  });
});
