import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  prisma, entrar, criarUsuarioDireto, criarAssociadoCompleto,
  emailFake, nomeFake, cpfFake, telefoneFake, nascimentoParaIdade,
  arquivoPng, arquivoPdf, Papel, AssociacaoStatus,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

async function clienteAdmin() {
  const { email, senha } = await criarUsuarioDireto({ papel: Papel.ADMIN });
  return entrar(email, senha, 'admin');
}

function dadosNovoPerfil(extra = {}) {
  return {
    email: emailFake('novo'),
    papel: Papel.ASSOCIADO,
    nome_completo: nomeFake(),
    apelido: 'Apelidinho',
    data_nascimento: nascimentoParaIdade(35),
    cpf: cpfFake(),
    rg: '1122334',
    nacionalidade: 'Brasil',
    estado_civil: 'Solteiro(a)',
    sexo: 'Feminino',
    telefone: telefoneFake(),
    cep: '89010-000',
    endereco_rua: 'Rua Nova',
    endereco_numero: '55',
    bairro: 'Vila Nova',
    cidade: 'Blumenau',
    estado: 'SC',
    ...extra,
  };
}

describe('Listagem de pessoas', () => {
  test('admin vê a lista com os associados cadastrados', async () => {
    const { perfil } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.get('/app/gente');
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes(perfil.nome_completo));
  });

  test('detalhe de uma pessoa carrega', async () => {
    const { perfil } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.get(`/app/gente/${perfil.id}`);
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes(perfil.nome_completo));
  });

  test('detalhe de pessoa inexistente volta para a listagem', async () => {
    const admin = await clienteAdmin();
    const resposta = await admin.get('/app/gente/00000000-0000-0000-0000-000000000000');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/gente');
  });
});

describe('Cadastro de pessoa pelo painel', () => {
  test('tela de novo perfil abre', async () => {
    const admin = await clienteAdmin();
    assert.equal((await admin.get('/app/gente/novo')).status, 200);
  });

  test('recusa cadastro sem os campos obrigatórios', async () => {
    const admin = await clienteAdmin();
    const dados = dadosNovoPerfil();

    const resposta = await admin.postMultipart('/app/gente/novo', {
      email: dados.email, papel: '', nome_completo: '',
    });
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes('preencha todos os campos obrigatórios'));
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 0);
  });

  test('cria associado completo com saúde e documentos', async () => {
    const admin = await clienteAdmin();
    const dados = dadosNovoPerfil({ elegivel_tarifa_social: 'on' });

    const resposta = await admin.postMultipart('/app/gente/novo', {
      ...dados,
      quadro_geral: 'Epilepsia refratária',
      usa_medicacao: 'true',
      medicacao_nome: 'Canabidiol',
      uso_terapeutico: 'true',
      relato_uso_terapeutico: 'Redução de crises',
      acompanhado_prescritor: 'true',
      nome_prescritor: 'Dra. Ana Neuro',
      crm_prescritor: 'CRM/SC 55555',
    }, {
      identificacao_1: arquivoPng('rg.png'),
      comprovante_residencia: arquivoPdf('residencia.pdf'),
      receita_uso_canabis: arquivoPdf('receita.pdf'),
    });
    assert.equal(resposta.status, 200);

    const perfil = await prisma.perfil.findFirst({
      where: { usuario: { email: dados.email } },
      include: { usuario: true, Associacao: { include: { Documentos: true } } },
    });
    assert.ok(perfil, 'perfil deveria ser criado');
    assert.equal(perfil.usuario.papel, Papel.ASSOCIADO);
    assert.equal(perfil.cpf, dados.cpf);
    assert.equal(perfil.endereco_cidade, 'Blumenau');
    assert.ok(perfil.Associacao, 'associação deveria ser criada');
    assert.equal(perfil.Associacao.elegivel_tarifa_social, true);
    assert.equal(perfil.Associacao.saude_quadro_geral, 'Epilepsia refratária');
    assert.equal(perfil.Associacao.saude_medico_prescritor_crm, 'CRM/SC 55555');
    assert.equal(perfil.Associacao.Documentos.length, 3);
  });

  test('cria usuário de equipe sem criar associação', async () => {
    const admin = await clienteAdmin();
    const dados = dadosNovoPerfil({ papel: Papel.SECRETARIA, cpf: '', data_nascimento: '' });

    const resposta = await admin.postMultipart('/app/gente/novo', dados);
    assert.equal(resposta.status, 200);

    const perfil = await prisma.perfil.findFirst({
      where: { usuario: { email: dados.email } },
      include: { usuario: true, Associacao: true },
    });
    assert.ok(perfil);
    assert.equal(perfil.usuario.papel, Papel.SECRETARIA);
    assert.equal(perfil.Associacao, null, 'equipe não deveria virar associado');
  });

  test('bloqueia e-mail duplicado', async () => {
    const admin = await clienteAdmin();
    const dados = dadosNovoPerfil();
    await admin.postMultipart('/app/gente/novo', dados);

    const resposta = await admin.postMultipart('/app/gente/novo', dadosNovoPerfil({ email: dados.email }));
    assert.ok((await resposta.text()).includes('conta associada a este e-mail'));
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 1);
  });

  test('bloqueia CPF duplicado', async () => {
    const admin = await clienteAdmin();
    const dados = dadosNovoPerfil();
    await admin.postMultipart('/app/gente/novo', dados);

    const resposta = await admin.postMultipart('/app/gente/novo', dadosNovoPerfil({ cpf: dados.cpf }));
    assert.ok((await resposta.text()).includes('conta associada a este CPF'));
    assert.equal(await prisma.perfil.count({ where: { cpf: dados.cpf } }), 1);
  });
});

describe('Edição de pessoa pelo painel', () => {
  test('tela de edição abre com os dados atuais', async () => {
    const { perfil } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.get(`/app/gente/${perfil.id}/editar`);
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes(perfil.nome_completo));
  });

  test('atualiza dados cadastrais, papel e saúde', async () => {
    const { perfil, usuario, associado } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();
    const novoEmail = emailFake('editado');

    const resposta = await admin.postMultipart(`/app/gente/${perfil.id}/editar`, {
      email: novoEmail,
      papel: Papel.ASSOCIADO,
      nome_completo: 'Nome Editado Pelo Painel',
      apelido: 'Editado',
      data_nascimento: '10/10/1980',
      cpf: perfil.cpf,
      rg: '5555555',
      nacionalidade: 'Brasil',
      estado_civil: 'Divorciado(a)',
      sexo: 'Feminino',
      telefone: '(47) 91234-5678',
      cep: '89020-000',
      endereco_rua: 'Rua Editada',
      endereco_numero: '999',
      bairro: 'Bairro Editado',
      cidade: 'Gaspar',
      estado: 'SC',
      indicado_por: 'Indicação Editada',
      elegivel_tarifa_social: 'on',
      quadro_geral: 'Quadro atualizado',
      usa_medicacao: 'true',
      medicacao_nome: 'Novo remédio',
      uso_terapeutico: 'false',
      acompanhado_prescritor: 'false',
    });
    assert.equal(resposta.status, 200);
    assert.ok((await resposta.text()).includes('atualizado com sucesso'));

    const atualizado = await prisma.perfil.findUnique({
      where: { id: perfil.id },
      include: { usuario: true, Associacao: true },
    });
    assert.equal(atualizado.nome_completo, 'Nome Editado Pelo Painel');
    assert.equal(atualizado.data_nascimento, '1980-10-10');
    assert.equal(atualizado.endereco_cidade, 'Gaspar');
    assert.equal(atualizado.usuario.email, novoEmail, 'o e-mail do usuário deveria mudar junto');
    assert.equal(atualizado.Associacao.saude_quadro_geral, 'Quadro atualizado');
    assert.equal(atualizado.Associacao.elegivel_tarifa_social, true);
    assert.equal(atualizado.Associacao.indicado_por, 'Indicação Editada');

    const usuarioDepois = await prisma.usuario.findUnique({ where: { id: usuario.id } });
    assert.equal(usuarioDepois.email, novoEmail);
    assert.ok(associado);
  });

  test('recusa edição sem campos obrigatórios', async () => {
    const { perfil } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.postMultipart(`/app/gente/${perfil.id}/editar`, {
      email: '', papel: '', nome_completo: '', cpf: '', telefone: '',
    });
    assert.ok((await resposta.text()).includes('preencha todos os campos obrigatórios'));
  });

  test('bloqueia troca para e-mail já usado por outra pessoa', async () => {
    const alvo = await criarAssociadoCompleto();
    const outro = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.postMultipart(`/app/gente/${alvo.perfil.id}/editar`, {
      email: outro.email,
      papel: Papel.ASSOCIADO,
      nome_completo: alvo.perfil.nome_completo,
      cpf: alvo.perfil.cpf,
      telefone: alvo.perfil.telefone,
    });
    assert.ok((await resposta.text()).includes('conta associada a este e-mail'));

    const inalterado = await prisma.usuario.findUnique({ where: { id: alvo.usuario.id } });
    assert.equal(inalterado.email, alvo.email);
  });

  test('bloqueia troca para CPF já usado por outra pessoa', async () => {
    const alvo = await criarAssociadoCompleto();
    const outro = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.postMultipart(`/app/gente/${alvo.perfil.id}/editar`, {
      email: alvo.email,
      papel: Papel.ASSOCIADO,
      nome_completo: alvo.perfil.nome_completo,
      cpf: outro.perfil.cpf,
      telefone: alvo.perfil.telefone,
    });
    assert.ok((await resposta.text()).includes('conta associada a este CPF'));
  });

  test('anexa novos documentos na edição', async () => {
    const { perfil, associado } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    await admin.postMultipart(`/app/gente/${perfil.id}/editar`, {
      email: (await prisma.usuario.findUnique({ where: { id: perfil.usuarioId } })).email,
      papel: Papel.ASSOCIADO,
      nome_completo: perfil.nome_completo,
      cpf: perfil.cpf,
      telefone: perfil.telefone,
    }, {
      autorizacao_anvisa: arquivoPdf('anvisa.pdf'),
    });

    const docs = await prisma.documentos.findMany({ where: { associadoId: associado.id } });
    assert.equal(docs.length, 1);
    assert.equal(docs[0].tipo, 'AUTORIZACAO_ANVISA');
  });
});

describe('Pagamentos e aprovação', () => {
  test('registra mensalidade pela listagem de pessoas', async () => {
    const { associado } = await criarAssociadoCompleto({ status: AssociacaoStatus.EM_ANALISE });
    const admin = await clienteAdmin();

    const resposta = await admin.postForm('/app/gente', {
      associadoId: associado.id,
      tipoPagamento: 'MENSALIDADE_INTEGRAL',
    });
    assert.equal(resposta.status, 200);

    const pagamentos = await prisma.pagamento.findMany({ where: { associadoId: associado.id } });
    assert.equal(pagamentos.length, 1);
    assert.equal(pagamentos[0].observacao, 'Mensalidade');
    assert.equal(Number(pagamentos[0].valor), 20);
  });

  test('bloqueia segunda mensalidade no mesmo mês', async () => {
    const { associado } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    await admin.postForm('/app/gente', { associadoId: associado.id, tipoPagamento: 'MENSALIDADE_INTEGRAL' });
    const segunda = await admin.postForm('/app/gente', { associadoId: associado.id, tipoPagamento: 'MENSALIDADE_INTEGRAL' });

    assert.equal(segunda.status, 400);
    assert.ok((await segunda.text()).includes('já possui mensalidade registrada neste mês'));
    assert.equal(await prisma.pagamento.count({ where: { associadoId: associado.id } }), 1);
  });

  test('taxa associativa move o associado para EM_ANALISE', async () => {
    const { associado } = await criarAssociadoCompleto({ status: AssociacaoStatus.AGUARDANDO_PAGAMENTO });
    const admin = await clienteAdmin();

    const resposta = await admin.postForm('/app/gente', {
      associadoId: associado.id,
      tipoPagamento: 'TAXA_ASSOCIATIVA',
    });
    assert.equal(resposta.status, 200);

    const depois = await prisma.associado.findUnique({ where: { id: associado.id } });
    assert.equal(depois.status, 'EM_ANALISE');
    const pagamento = await prisma.pagamento.findFirst({ where: { associadoId: associado.id } });
    assert.equal(Number(pagamento.valor), 50);
  });

  test('bloqueia tarifa social para quem não é elegível', async () => {
    const { associado } = await criarAssociadoCompleto({ elegivelTarifaSocial: false });
    const admin = await clienteAdmin();

    const resposta = await admin.postForm('/app/gente', {
      associadoId: associado.id,
      tipoPagamento: 'MENSALIDADE_SOCIAL',
    });
    assert.equal(resposta.status, 403);
    assert.ok((await resposta.text()).includes('não é elegível para tarifa social'));
    assert.equal(await prisma.pagamento.count({ where: { associadoId: associado.id } }), 0);
  });

  test('permite tarifa social para quem é elegível', async () => {
    const { associado } = await criarAssociadoCompleto({ elegivelTarifaSocial: true });
    const admin = await clienteAdmin();

    const resposta = await admin.postForm('/app/gente', {
      associadoId: associado.id,
      tipoPagamento: 'MENSALIDADE_SOCIAL',
    });
    assert.equal(resposta.status, 200);

    const pagamento = await prisma.pagamento.findFirst({ where: { associadoId: associado.id } });
    assert.equal(Number(pagamento.valor), 0);
    assert.equal(pagamento.observacao, 'Mensalidade Social');
  });

  test('recusa tipo de pagamento inválido', async () => {
    const { associado } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.postForm('/app/gente', {
      associadoId: associado.id,
      tipoPagamento: 'PIX_MISTERIOSO',
    });
    assert.equal(resposta.status, 400);
  });

  test('aprova associado', async () => {
    const { associado } = await criarAssociadoCompleto({ status: AssociacaoStatus.EM_ANALISE });
    const admin = await clienteAdmin();

    const resposta = await admin.postForm('/app/gente', { associadoId: associado.id, acao: 'aprovar' });
    assert.equal(resposta.status, 200);

    const depois = await prisma.associado.findUnique({ where: { id: associado.id } });
    assert.equal(depois.status, 'ASSOCIADO');
  });

  test('rota dedicada de pagamento registra mensalidade e volta para a listagem', async () => {
    const { associado } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.postForm(`/app/gente/${associado.id}/pagamento`, {});
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/gente');

    const pagamento = await prisma.pagamento.findFirst({ where: { associadoId: associado.id } });
    assert.ok(pagamento);
    assert.equal(pagamento.observacao, 'Mensalidade');
  });

  test('requisições concorrentes registram uma única mensalidade', async () => {
    const admin = await clienteAdmin();
    const { associado } = await criarAssociadoCompleto();
    const respostas = await Promise.all([
      admin.postForm(`/app/gente/${associado.id}/pagamento`, {}),
      admin.postForm(`/app/gente/${associado.id}/pagamento`, {}),
    ]);

    assert.equal(await prisma.pagamento.count({ where: { associadoId: associado.id } }), 1);
    assert.equal(respostas.filter((resposta) => resposta.status === 302).length, 1);
    assert.equal(respostas.filter((resposta) => resposta.status === 409).length, 1);
  });

  test('rota dedicada devolve 409 na segunda mensalidade do mês', async () => {
    const { associado } = await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    await admin.postForm(`/app/gente/${associado.id}/pagamento`, {});
    const segunda = await admin.postForm(`/app/gente/${associado.id}/pagamento`, {});

    assert.equal(segunda.status, 409);
    assert.equal(await prisma.pagamento.count({ where: { associadoId: associado.id } }), 1);
  });

  test('associado comum não consegue registrar pagamento', async () => {
    const alvo = await criarAssociadoCompleto();
    const intruso = await criarAssociadoCompleto();
    const cliente = await entrar(intruso.email, intruso.senha);

    const resposta = await cliente.postForm(`/app/gente/${alvo.associado.id}/pagamento`, {});
    assert.equal(resposta.status, 403);
    assert.equal(await prisma.pagamento.count({ where: { associadoId: alvo.associado.id } }), 0);
  });

  test('perfil de saúde não consegue registrar pagamento pela listagem', async () => {
    const { associado } = await criarAssociadoCompleto();
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.SAUDE });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.postForm('/app/gente', {
      associadoId: associado.id,
      tipoPagamento: 'MENSALIDADE_INTEGRAL',
    });
    assert.equal(resposta.status, 403);
  });
});

describe('Exclusão de pessoa', () => {
  test('remove perfil, usuário e registros vinculados', async () => {
    const { perfil, usuario, associado } = await criarAssociadoCompleto();
    await prisma.documentos.create({
      data: { tipo: 'IDENTIFICACAO', nome_arquivo: 'local/doc-a-remover.png', associadoId: associado.id, criadoPorId: perfil.id },
    });
    await prisma.pagamento.create({
      data: { associadoId: associado.id, proximo_vencimento: new Date(), observacao: 'Mensalidade' },
    });

    const admin = await clienteAdmin();
    const resposta = await admin.postForm(`/app/gente/${perfil.id}/deletar`, {});
    assert.equal(resposta.status, 302);
    const destino = resposta.headers.get('location');
    assert.ok(destino.startsWith('/app/gente?'), `redirecionou para ${destino}`);
    assert.ok(new URLSearchParams(destino.split('?')[1]).get('sucesso').includes('deletado com sucesso'));

    assert.equal(await prisma.perfil.count({ where: { id: perfil.id } }), 0, 'perfil deveria sumir');
    assert.equal(await prisma.usuario.count({ where: { id: usuario.id } }), 0, 'usuário deveria sumir');
    assert.equal(await prisma.associado.count({ where: { id: associado.id } }), 0, 'associação deveria sumir');
    assert.equal(await prisma.documentos.count({ where: { associadoId: associado.id } }), 0);
    assert.equal(await prisma.pagamento.count({ where: { associadoId: associado.id } }), 0);
  });

  test('exclusão de perfil inexistente devolve erro tratado', async () => {
    const admin = await clienteAdmin();
    const resposta = await admin.postForm('/app/gente/00000000-0000-0000-0000-000000000000/deletar', {});

    // A rota não tem componente: devolver 500 deixava a tela em branco. O erro
    // volta na URL da listagem, que sabe exibi-lo.
    assert.equal(resposta.status, 302);
    const destino = resposta.headers.get('location');
    assert.ok(destino.startsWith('/app/gente?'), `redirecionou para ${destino}`);
    assert.ok(new URLSearchParams(destino.split('?')[1]).get('erro').includes('não encontrado'));
  });
});

describe('Exportação e importação', () => {
  test('exporta relatório de pessoas em PDF', async () => {
    await criarAssociadoCompleto();
    const admin = await clienteAdmin();

    const resposta = await admin.get('/app/gente/exportar');
    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers.get('content-type'), 'application/pdf');
    assert.ok(resposta.headers.get('content-disposition').includes('.pdf'));

    const buffer = Buffer.from(await resposta.arrayBuffer());
    assert.ok(buffer.length > 500, 'o PDF deveria ter conteúdo');
    assert.equal(buffer.subarray(0, 4).toString(), '%PDF', 'deveria ser um PDF válido');
  });

  test('tela de importação abre', async () => {
    const admin = await clienteAdmin();
    assert.equal((await admin.get('/app/gente/importar')).status, 200);
  });

  test('importação recusa envio sem arquivo', async () => {
    const admin = await clienteAdmin();
    const resposta = await admin.postForm('/app/gente/importar', {});
    assert.equal(resposta.status, 400);
    assert.ok((await resposta.text()).includes('Nenhum arquivo'));
  });

  test('importação recusa arquivo que não é XLSX', async () => {
    const admin = await clienteAdmin();
    const resposta = await admin.postMultipart('/app/gente/importar', {}, {
      arquivo: { conteudo: Buffer.from('nome;cpf'), nome: 'planilha.csv', tipo: 'text/csv' },
    });
    assert.equal(resposta.status, 400);
    assert.ok((await resposta.text()).includes('Formato de arquivo inválido'));
  });

  test('importa uma planilha XLSX válida', async () => {
    const XLSX = await import('xlsx');
    const email = emailFake('importado');
    const cpf = cpfFake();

    const linha = {
      'Endereço de e-mail': email,
      'Email': email,
      'Nome': 'Pessoa Importada da Planilha',
      'CPF': cpf,
      'RG': '4433221',
      'Data do nascimento': '01/01/1985',
      'SEXO': 'Feminino',
      'Endereço completo (Endereço, bairro, cidade, estado e CEP)': 'Rua Importada, 12, Centro, Blumenau, SC, 89010-000',
      'Telefone/Whatsapp': '(47) 99999-1111',
      'Tipo de Associado': 'Apoiador',
      'Quadro geral de saúde - Descreva os diagnósticos de patologias existentes': 'Sem queixas',
      'Usa alguma medicação?': 'Não',
      'Já fez uso terapêutico com a cannabis?': 'Não',
      'É acompanhado por médico prescritor de cannabis?': 'Não',
    };

    const aba = XLSX.utils.json_to_sheet([linha]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, aba, 'Associados');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const admin = await clienteAdmin();
    const resposta = await admin.postMultipart('/app/gente/importar', {}, {
      arquivo: { conteudo: buffer, nome: 'associados.xlsx', tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    });

    assert.equal(resposta.status, 200, 'a importação deveria ser processada');
    const html = await resposta.text();
    assert.ok(!html.includes('Erro ao processar importação'), `importação falhou: ${html.slice(0, 300)}`);

    const importado = await prisma.perfil.findFirst({ where: { usuario: { email } } });
    assert.ok(importado, 'a pessoa da planilha deveria ser criada');
    assert.equal(importado.nome_completo, 'Pessoa Importada da Planilha');
  });
});
