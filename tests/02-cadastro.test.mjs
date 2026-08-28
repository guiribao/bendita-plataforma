import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  Cliente, prisma, emailFake, nomeFake, cpfFake, telefoneFake,
  nascimentoParaIdade, arquivoPng, arquivoPdf,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

function dadosBasicos(extra = {}) {
  return {
    email: emailFake('cadastro'),
    senha: 'senhaSegura1',
    senha_repetida: 'senhaSegura1',
    nome_completo: nomeFake(),
    apelido: 'Apelido',
    data_nascimento: nascimentoParaIdade(30),
    cpf: cpfFake(),
    rg: '3.456.789',
    nacionalidade: 'Brasil',
    estado_civil: 'Solteiro(a)',
    sexo: 'Feminino',
    telefone: telefoneFake(),
    cep: '89010-000',
    endereco_rua: 'Rua XV de Novembro',
    endereco_numero: '250',
    bairro: 'Centro',
    cidade: 'Blumenau',
    estado: 'SC',
    endereco_complemento: 'Sala 3',
    instagram: '@bendita',
    linkedin: 'in/bendita',
    ...extra,
  };
}

/** Executa a etapa 1 e devolve as chaves do cadastro recém-criado. */
async function etapaBasico(cliente, dados) {
  const resposta = await cliente.postForm('/cadastro/basico', dados);
  assert.equal(resposta.status, 200, 'etapa básico deveria responder 200');
  const perfil = await prisma.perfil.findFirst({
    where: { usuario: { email: dados.email } },
    include: { usuario: true, Associacao: true },
  });
  return { resposta, perfil };
}

describe('Cadastro — etapa 1 (informações básicas)', () => {
  test('recusa formulário vazio sem criar nada', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos({ nome_completo: '', cpf: '', telefone: '' });
    const resposta = await cliente.postForm('/cadastro/basico', { email: dados.email, senha: '' });
    assert.equal(resposta.status, 200);
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 0,
      'não deveria criar usuário');
  });

  test('recusa quando a confirmação de senha não confere', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos({ senha_repetida: 'outraSenha1' });
    const resposta = await cliente.postForm('/cadastro/basico', dados);
    const html = await resposta.text();
    assert.ok(html.includes('verificação de senha não confere'), 'deveria acusar divergência de senha');
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 0);
  });

  test('recusa senha com menos de 8 caracteres', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos({ senha: 'curta1', senha_repetida: 'curta1' });
    const resposta = await cliente.postForm('/cadastro/basico', dados);
    const html = await resposta.text();
    assert.ok(html.includes('no minimo 8 caracteres'), 'deveria acusar senha curta');
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 0);
  });

  test('cria usuário, perfil e associado para maior de idade', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos();
    const { perfil } = await etapaBasico(cliente, dados);

    assert.ok(perfil, 'perfil deveria existir');
    assert.equal(perfil.nome_completo, dados.nome_completo);
    assert.equal(perfil.cpf, dados.cpf);
    assert.equal(perfil.endereco_cidade, 'Blumenau');
    assert.equal(perfil.endereco_bairro, 'Centro');
    assert.equal(perfil.redes_instagram, '@bendita');
    assert.equal(perfil.usuario.papel, 'ASSOCIADO', 'maior de idade deve ser ASSOCIADO');
    assert.ok(perfil.Associacao, 'associado deveria ser criado junto');
    assert.equal(perfil.Associacao.status, 'AGUARDANDO_PAGAMENTO');
    assert.equal(perfil.Associacao.tipo_associado, 'APOIADOR');
    assert.match(perfil.data_nascimento, /^\d{4}-\d{2}-\d{2}$/, 'data deve ser normalizada para ISO');
  });

  test('menor de idade vira ASSOCIADO_DEPENDENTE', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos({ data_nascimento: nascimentoParaIdade(15) });
    const { perfil } = await etapaBasico(cliente, dados);
    assert.equal(perfil.usuario.papel, 'ASSOCIADO_DEPENDENTE');
  });

  test('bloqueia e-mail já cadastrado', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos();
    await etapaBasico(cliente, dados);

    const repetido = dadosBasicos({ email: dados.email });
    const resposta = await cliente.postForm('/cadastro/basico', repetido);
    const html = await resposta.text();
    assert.ok(html.includes('conta associada a este e-mail'), 'deveria bloquear e-mail duplicado');
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 1);
  });

  test('bloqueia CPF já cadastrado', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos();
    await etapaBasico(cliente, dados);

    const repetido = dadosBasicos({ cpf: dados.cpf });
    const resposta = await cliente.postForm('/cadastro/basico', repetido);
    const html = await resposta.text();
    assert.ok(html.includes('conta associada a este CPF'), 'deveria bloquear CPF duplicado');
    assert.equal(await prisma.perfil.count({ where: { cpf: dados.cpf } }), 1);
  });

  test('recusa data de nascimento inválida', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos({ data_nascimento: '32/13/1990' });
    const resposta = await cliente.postForm('/cadastro/basico', dados);
    assert.equal(resposta.status, 200);
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 0,
      'data inválida não deveria criar usuário');
  });
});

describe('Cadastro — etapas seguintes', () => {
  test('fluxo completo: básico → documentos → saúde → termos', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos();
    const { perfil } = await etapaBasico(cliente, dados);
    const chaves = { perfilId: perfil.id, associadoId: perfil.Associacao.id };

    // Etapa 3 — documentos (multipart com imagem e PDF)
    const respDocs = await cliente.postMultipart('/cadastro/documentos', chaves, {
      identificacao_1: arquivoPng('rg-frente.png'),
      identificacao_2: arquivoPng('rg-verso.png'),
      comprovante_residencia: arquivoPdf('conta-luz.pdf'),
    });
    assert.equal(respDocs.status, 200, 'upload de documentos deveria ser aceito');

    const documentos = await prisma.documentos.findMany({ where: { associadoId: chaves.associadoId } });
    assert.equal(documentos.length, 3, 'deveria registrar 3 documentos');
    assert.equal(documentos.filter((d) => d.tipo === 'IDENTIFICACAO').length, 2);
    assert.equal(documentos.filter((d) => d.tipo === 'COMPROVANTE_RESIDENCIA').length, 1);
    assert.ok(documentos.every((d) => d.nome_arquivo.includes('/documentos/')),
      'a chave de storage deveria apontar para a pasta de documentos');
    assert.ok(documentos.every((d) => d.criadoPorId === chaves.perfilId));

    // Etapa 4 — saúde
    const respSaude = await cliente.postMultipart('/cadastro/saude', {
      ...chaves,
      quadro_geral: 'Dores crônicas na lombar',
      usa_medicacao: 'true',
      medicacao_nome: 'Dipirona',
      uso_terapeutico: 'true',
      relato_uso_terapeutico: 'Uso de óleo full spectrum há 6 meses',
      acompanhado_prescritor: 'true',
      nome_prescritor: 'Dra. Helena Prado',
      crm_prescritor: 'CRM/SC 12345',
    }, {
      receita_uso_canabis: arquivoPdf('receita.pdf'),
      autorizacao_anvisa: arquivoPng('anvisa.png'),
    });
    assert.equal(respSaude.status, 200);

    const associadoSaude = await prisma.associado.findUnique({ where: { id: chaves.associadoId } });
    assert.equal(associadoSaude.saude_quadro_geral, 'Dores crônicas na lombar');
    assert.equal(associadoSaude.saude_uso_medicacao, true);
    assert.equal(associadoSaude.saude_uso_medicacao_nome, 'Dipirona');
    assert.equal(associadoSaude.saude_uso_terapeutico_canabis, true);
    assert.equal(associadoSaude.saude_medico_prescritor, true);
    assert.equal(associadoSaude.saude_medico_prescritor_crm, 'CRM/SC 12345');

    const todosDocs = await prisma.documentos.findMany({ where: { associadoId: chaves.associadoId } });
    assert.equal(todosDocs.length, 5, 'receita e autorização ANVISA deveriam ser anexadas');
    assert.equal(todosDocs.filter((d) => d.tipo === 'RECEITA_MEDICA').length, 1);
    assert.equal(todosDocs.filter((d) => d.tipo === 'AUTORIZACAO_ANVISA').length, 1);

    // Etapa 5 — termos
    const respTermos = await cliente.postForm('/cadastro/termos', {
      ...chaves,
      tipo_associacao: 'MEDICINAL',
      tem_indicacao: 'true',
      nome_indicador: 'Maria Indicadora',
    });
    assert.equal(respTermos.status, 200);

    const associadoFinal = await prisma.associado.findUnique({ where: { id: chaves.associadoId } });
    assert.equal(associadoFinal.tipo_associado, 'MEDICINAL');
    assert.equal(associadoFinal.indicado_por, 'Maria Indicadora');
    assert.equal(associadoFinal.status, 'AGUARDANDO_PAGAMENTO');
  });

  test('etapa responsável cria perfil do responsável e anexa documentos', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos({ data_nascimento: nascimentoParaIdade(14) });
    const { perfil } = await etapaBasico(cliente, dados);
    const chaves = { perfilId: perfil.id, associadoId: perfil.Associacao.id };

    const emailResponsavel = emailFake('responsavel');
    const cpfResponsavel = cpfFake();

    const resposta = await cliente.postMultipart('/cadastro/responsavel', {
      ...chaves,
      tem_responsavel: 'true',
      nome_responsavel: 'Responsável Legal',
      cpf_responsavel: cpfResponsavel,
      rg_responsavel: '9876543',
      sexo_responsavel: 'Masculino',
      data_nascimento: nascimentoParaIdade(40),
      telefone_responsavel: telefoneFake(),
      endereco_responsavel: 'Rua do Responsável, 10',
      email_responsavel: emailResponsavel,
    }, {
      identificacao_responsavel_1: arquivoPng('rg-resp-frente.png'),
      identificacao_responsavel_2: arquivoPng('rg-resp-verso.png'),
    });

    assert.equal(resposta.status, 200);

    const perfilResponsavel = await prisma.perfil.findFirst({
      where: { usuario: { email: emailResponsavel } },
      include: { usuario: true },
    });
    assert.ok(perfilResponsavel, 'perfil do responsável deveria ser criado');
    assert.equal(perfilResponsavel.nome_completo, 'Responsável Legal');
    assert.equal(perfilResponsavel.cpf, cpfResponsavel);
    assert.equal(perfilResponsavel.usuario.papel, 'ASSOCIADO');

    const docs = await prisma.documentos.findMany({
      where: { associadoId: chaves.associadoId, tipo: 'IDENTIFICACAO_RESPONSAVEL' },
    });
    assert.equal(docs.length, 2);
  });

  test('etapa responsável sem responsável apenas segue adiante', async () => {
    const cliente = new Cliente();
    const dados = dadosBasicos();
    const { perfil } = await etapaBasico(cliente, dados);
    const chaves = { perfilId: perfil.id, associadoId: perfil.Associacao.id };

    const resposta = await cliente.postMultipart('/cadastro/responsavel', {
      ...chaves,
      tem_responsavel: 'false',
    });
    assert.equal(resposta.status, 200);
    assert.equal(await prisma.documentos.count({ where: { associadoId: chaves.associadoId } }), 0);
  });
});

describe('Cadastro — proteção das etapas', () => {
  const etapas = ['/cadastro/documentos', '/cadastro/saude', '/cadastro/responsavel'];

  for (const etapa of etapas) {
    test(`${etapa} recusa envio sem as chaves do cadastro`, async () => {
      const cliente = new Cliente();
      const resposta = await cliente.postMultipart(etapa, {});
      assert.equal(resposta.status, 400, 'deveria recusar sessão de cadastro inválida');
    });

    test(`${etapa} recusa chaves que não pertencem ao mesmo cadastro`, async () => {
      const cliente = new Cliente();
      const a = await etapaBasico(new Cliente(), dadosBasicos());
      const b = await etapaBasico(new Cliente(), dadosBasicos());

      const resposta = await cliente.postMultipart(etapa, {
        perfilId: a.perfil.id,
        associadoId: b.perfil.Associacao.id,
      });
      assert.equal(resposta.status, 403, 'perfil de um cadastro com associado de outro deveria dar 403');
    });
  }

  test('/cadastro/termos recusa chaves cruzadas', async () => {
    const cliente = new Cliente();
    const a = await etapaBasico(new Cliente(), dadosBasicos());
    const b = await etapaBasico(new Cliente(), dadosBasicos());
    const resposta = await cliente.postForm('/cadastro/termos', {
      perfilId: a.perfil.id,
      associadoId: b.perfil.Associacao.id,
      tipo_associacao: 'APOIADOR',
    });
    assert.equal(resposta.status, 403);
  });

  test('rejeita upload de arquivo com formato não suportado', async () => {
    const cliente = new Cliente();
    const { perfil } = await etapaBasico(cliente, dadosBasicos());
    const resposta = await cliente.postMultipart('/cadastro/documentos', {
      perfilId: perfil.id,
      associadoId: perfil.Associacao.id,
    }, {
      identificacao_1: { conteudo: Buffer.from('executavel'), nome: 'virus.exe', tipo: 'application/octet-stream' },
    });
    assert.equal(resposta.status, 400, 'formato inválido deveria ser recusado');
    const html = await resposta.text();
    assert.ok(html.includes('inv') , 'deveria informar que o formato é inválido');
  });

  test('rejeita upload de arquivo vazio', async () => {
    const cliente = new Cliente();
    const { perfil } = await etapaBasico(cliente, dadosBasicos());
    const resposta = await cliente.postMultipart('/cadastro/documentos', {
      perfilId: perfil.id,
      associadoId: perfil.Associacao.id,
    }, {
      identificacao_1: { conteudo: Buffer.alloc(0), nome: 'vazio.png', tipo: 'image/png' },
    });
    assert.equal(resposta.status, 400, 'arquivo vazio deveria ser recusado');
  });
});
