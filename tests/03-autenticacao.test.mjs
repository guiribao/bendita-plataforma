import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  Cliente, prisma, entrar, criarUsuarioDireto, criarAssociadoCompleto,
  emailFake, Papel,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

describe('Login', () => {
  test('autentica com credenciais válidas e cria sessão', async () => {
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.ADMIN });

    const cliente = new Cliente();
    const resposta = await cliente.postForm('/autentica/entrar', { email, senha });

    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/dashboard');
    assert.ok(cliente.cookies.has('__chave'), 'cookie de sessão deveria ser emitido');
  });

  test('recusa senha incorreta', async () => {
    const { email } = await criarUsuarioDireto({ papel: Papel.ADMIN });

    const cliente = new Cliente();
    const resposta = await cliente.postForm('/autentica/entrar', { email, senha: 'senhaErrada123' });

    assert.equal(resposta.status, 200, 'deveria voltar ao formulário, não redirecionar');
    const html = await resposta.text();
    assert.ok(html.includes('Senha inválida'), 'deveria informar senha inválida');
  });

  test('recusa e-mail inexistente', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.postForm('/autentica/entrar', {
      email: emailFake('fantasma'),
      senha: 'qualquer12345',
    });

    assert.equal(resposta.status, 200);
    const html = await resposta.text();
    assert.ok(html.includes('nenhum usuário com este e-mail'), 'deveria informar usuário não encontrado');
  });

  test('usuário autenticado é redirecionado ao acessar a tela de login', async () => {
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.ADMIN });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/autentica/entrar');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/dashboard');
  });

  test('usuário autenticado não volta para o cadastro', async () => {
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.ADMIN });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/cadastro/basico');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/dashboard');
  });
});

describe('Logout', () => {
  test('encerra a sessão e derruba o acesso à área restrita', async () => {
    const { email, senha } = await criarUsuarioDireto({ papel: Papel.ADMIN });
    const cliente = await entrar(email, senha);

    const antes = await cliente.get('/app/dashboard');
    assert.equal(antes.status, 200, 'antes do logout o dashboard deveria abrir');

    const saida = await cliente.get('/autentica/sair');
    assert.equal(saida.status, 302);
    assert.equal(saida.headers.get('location'), '/autentica/entrar');

    const depois = await cliente.get('/app/dashboard');
    assert.equal(depois.status, 302, 'após o logout deveria exigir login');
    assert.equal(depois.headers.get('location'), '/autentica/entrar');
  });
});

describe('Recuperação de senha', () => {
  test('recusa e-mail não cadastrado', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.postForm('/autentica/senha', { email: emailFake('inexistente') });
    const html = await resposta.text();
    assert.ok(html.includes('Usuário não encontrado'), 'deveria informar usuário inexistente');
  });

  test('gera token ativo para e-mail cadastrado', async () => {
    const { usuario, email } = await criarUsuarioDireto({ papel: Papel.ASSOCIADO });

    const cliente = new Cliente();
    const resposta = await cliente.postForm('/autentica/senha', { email });
    assert.equal(resposta.status, 200);

    const tokens = await prisma.usuario_Esqueci_Senha.findMany({ where: { usuarioId: usuario.id } });
    assert.equal(tokens.length, 1, 'deveria criar exatamente um token');
    assert.equal(tokens[0].ativo, true);
  });

  test('nova solicitação desativa o token anterior', async () => {
    const { usuario, email } = await criarUsuarioDireto({ papel: Papel.ASSOCIADO });

    const cliente = new Cliente();
    await cliente.postForm('/autentica/senha', { email });
    await cliente.postForm('/autentica/senha', { email });

    const tokens = await prisma.usuario_Esqueci_Senha.findMany({ where: { usuarioId: usuario.id } });
    assert.equal(tokens.length, 2);
    assert.equal(tokens.filter((t) => t.ativo).length, 1, 'apenas o último token deve seguir ativo');
  });

  test('token expirado redireciona de volta para o login', async () => {
    const { usuario } = await criarUsuarioDireto({ papel: Papel.ASSOCIADO });
    const token = await prisma.usuario_Esqueci_Senha.create({
      data: { usuarioId: usuario.id, valido_ate: new Date(Date.now() - 60_000) },
    });

    const cliente = new Cliente();
    const resposta = await cliente.get(`/autentica/senha/${token.token}`);
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/autentica/entrar');
  });

  test('token inexistente redireciona de volta para o login', async () => {
    const cliente = new Cliente();
    const resposta = await cliente.get('/autentica/senha/00000000-0000-0000-0000-000000000000');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/autentica/entrar');
  });

  test('troca a senha com token válido e permite login com a nova senha', async () => {
    const { usuario, email } = await criarUsuarioDireto({ papel: Papel.ASSOCIADO, senha: 'senhaAntiga1' });
    const token = await prisma.usuario_Esqueci_Senha.create({
      data: { usuarioId: usuario.id, valido_ate: new Date(Date.now() + 3_600_000) },
    });

    const cliente = new Cliente();
    const tela = await cliente.get(`/autentica/senha/${token.token}`);
    assert.equal(tela.status, 200, 'a tela de troca deveria abrir com token válido');

    const troca = await cliente.postForm(`/autentica/senha/${token.token}`, {
      senha: 'senhaNova12345',
      senha_repetida: 'senhaNova12345',
      usuario_id: usuario.id,
    });
    // O loader roda novamente depois da action: como o token acabou de ser
    // invalidado, a app manda o usuário de volta para o login.
    assert.equal(troca.status, 302, 'após trocar a senha deveria voltar para o login');
    assert.equal(troca.headers.get('location'), '/autentica/entrar');

    const tokenDepois = await prisma.usuario_Esqueci_Senha.findUnique({ where: { id: token.id } });
    assert.equal(tokenDepois.ativo, false, 'o token deveria ser invalidado após o uso');

    const novoLogin = await entrar(email, 'senhaNova12345');
    assert.ok(novoLogin.cookies.has('__chave'), 'deveria logar com a nova senha');

    const loginAntigo = new Cliente();
    const respAntiga = await loginAntigo.postForm('/autentica/entrar', { email, senha: 'senhaAntiga1' });
    assert.equal(respAntiga.status, 200, 'a senha antiga não deveria mais funcionar');
  });

  test('recusa nova senha divergente ou curta', async () => {
    const { usuario } = await criarUsuarioDireto({ papel: Papel.ASSOCIADO });
    const token = await prisma.usuario_Esqueci_Senha.create({
      data: { usuarioId: usuario.id, valido_ate: new Date(Date.now() + 3_600_000) },
    });

    const cliente = new Cliente();

    const divergente = await cliente.postForm(`/autentica/senha/${token.token}`, {
      senha: 'senhaNova12345', senha_repetida: 'outraCoisa123', usuario_id: usuario.id,
    });
    assert.ok((await divergente.text()).includes('verificação de senha não confere'));

    const curta = await cliente.postForm(`/autentica/senha/${token.token}`, {
      senha: 'curta1', senha_repetida: 'curta1', usuario_id: usuario.id,
    });
    assert.ok((await curta.text()).includes('no minimo 8 caracteres'));
  });

  test('não permite reutilizar o token depois de trocar a senha', async () => {
    const { usuario } = await criarUsuarioDireto({ papel: Papel.ASSOCIADO, senha: 'senhaAntiga1' });
    const token = await prisma.usuario_Esqueci_Senha.create({
      data: { usuarioId: usuario.id, valido_ate: new Date(Date.now() + 3_600_000) },
    });
    const cliente = new Cliente();
    const campos = { senha: 'senhaNova12345', senha_repetida: 'senhaNova12345', usuario_id: usuario.id };

    const primeira = await cliente.postForm(`/autentica/senha/${token.token}`, campos);
    assert.equal(primeira.status, 302);
    const segunda = await cliente.postForm(`/autentica/senha/${token.token}`, campos);
    assert.equal(segunda.status, 302);
    assert.equal(segunda.headers.get('location'), '/autentica/entrar');
  });
});

describe('Guarda da área restrita', () => {
  const rotasRestritas = [
    '/app/dashboard', '/app/gente', '/app/documentos', '/app/financeiro',
    '/app/medicacao', '/app/perfil', '/app/contatos',
  ];

  for (const rota of rotasRestritas) {
    test(`${rota} exige autenticação`, async () => {
      const cliente = new Cliente();
      const resposta = await cliente.get(rota);
      assert.equal(resposta.status, 302, `${rota} deveria redirecionar visitante anônimo`);
      assert.equal(resposta.headers.get('location'), '/autentica/entrar');
    });
  }

  test('associado que ainda não aceitou o termo é levado ao termo associativo', async () => {
    const { email, senha } = await criarAssociadoCompleto({ aceitouTermo: false });
    const cliente = await entrar(email, senha);

    const resposta = await cliente.get('/app/dashboard');
    assert.equal(resposta.status, 302);
    assert.equal(resposta.headers.get('location'), '/app/termo-associativo');
  });
});
