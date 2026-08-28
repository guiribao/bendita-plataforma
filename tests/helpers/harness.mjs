/**
 * Harness de testes de integração.
 *
 * Sobe o build do Remix em processo e dispara requisições HTTP reais
 * (documentos e submits de formulário) contra o handler, com jar de cookies
 * por cliente. Isso exercita loaders, actions, sessão, autorização,
 * upload de arquivos e persistência no Postgres — sem depender de browser.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function carregarEnv() {
  const arquivo = path.join(ROOT, '.env');
  if (!existsSync(arquivo)) throw new Error('.env não encontrado na raiz do projeto');

  for (const linha of readFileSync(arquivo, 'utf8').split('\n')) {
    const match = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, chave, bruto] = match;
    process.env[chave] = bruto.replace(/^["']|["']$/g, '');
  }
}

carregarEnv();

// SMTP não é configurado no ambiente local: aponta para uma porta fechada para
// que o envio falhe imediatamente (ECONNREFUSED) em vez de pendurar o teste.
if (!process.env.SMTP_HOST) process.env.SMTP_HOST = '127.0.0.1';
process.env.DISABLE_IMAP = 'true';

if (!existsSync(path.join(ROOT, 'build/index.js'))) {
  throw new Error('build/index.js não encontrado. Rode `npm run build` antes dos testes.');
}

const build = await import(path.join(ROOT, 'build/index.js'));
const { createRequestHandler } = await import('@remix-run/node');
const { PrismaClient, Papel, AssociacaoStatus, TipoAssociado, TipoDocumento } = await import('@prisma/client');

// serverMode 'development' faz o Remix propagar a mensagem real do erro na
// resposta em vez de "Unexpected Server Error", o que dá diagnóstico útil.
const handler = createRequestHandler(build, 'development');

export const prisma = new PrismaClient();
export { Papel, AssociacaoStatus, TipoAssociado, TipoDocumento };

export const BASE = 'http://localhost:3002';

function cookieExpirado(atributos) {
  const maxAge = atributos.get('max-age');
  if (maxAge !== undefined && Number(maxAge) <= 0) return true;
  const expires = atributos.get('expires');
  if (expires && new Date(expires).getTime() <= Date.now()) return true;
  return false;
}

/** Cliente HTTP com jar de cookies — representa um browser/sessão. */
export class Cliente {
  constructor(rotulo = 'anônimo') {
    this.rotulo = rotulo;
    this.cookies = new Map();
  }

  get cabecalhoCookie() {
    return [...this.cookies].map(([n, v]) => `${n}=${v}`).join('; ');
  }

  #guardarCookies(resposta) {
    for (const bruto of resposta.headers.getSetCookie()) {
      const [par, ...resto] = bruto.split(';');
      const idx = par.indexOf('=');
      const nome = par.slice(0, idx).trim();
      const valor = par.slice(idx + 1).trim();
      const atributos = new Map(
        resto.map((a) => {
          const i = a.indexOf('=');
          return i === -1
            ? [a.trim().toLowerCase(), '']
            : [a.slice(0, i).trim().toLowerCase(), a.slice(i + 1).trim()];
        })
      );
      if (cookieExpirado(atributos)) this.cookies.delete(nome);
      else this.cookies.set(nome, valor);
    }
  }

  async requisitar(caminho, init = {}) {
    const url = caminho.startsWith('http') ? caminho : `${BASE}${caminho}`;
    const headers = new Headers(init.headers || {});
    if (this.cookies.size) headers.set('cookie', this.cabecalhoCookie);
    if (!headers.has('user-agent')) headers.set('user-agent', 'teste-integracao');

    const resposta = await handler(new Request(url, { ...init, headers }));
    this.#guardarCookies(resposta);
    return resposta;
  }

  async get(caminho, init) {
    return this.requisitar(caminho, { method: 'GET', ...init });
  }

  /** GET seguindo redirects internos, devolvendo a resposta final. */
  async getSeguindo(caminho, maxSaltos = 5) {
    let resposta = await this.get(caminho);
    let saltos = 0;
    while (resposta.status >= 300 && resposta.status < 400 && saltos++ < maxSaltos) {
      resposta = await this.get(resposta.headers.get('location'));
    }
    return resposta;
  }

  /** POST application/x-www-form-urlencoded. */
  async postForm(caminho, campos) {
    const body = new URLSearchParams();
    for (const [chave, valor] of Object.entries(campos)) {
      if (valor === undefined || valor === null) continue;
      body.append(chave, String(valor));
    }
    return this.requisitar(caminho, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

  /**
   * POST multipart/form-data. `arquivos` é um mapa campo -> {conteudo, nome, tipo}.
   * Necessário para as rotas que usam unstable_parseMultipartFormData.
   */
  async postMultipart(caminho, campos = {}, arquivos = {}) {
    const form = new FormData();
    for (const [chave, valor] of Object.entries(campos)) {
      if (valor === undefined || valor === null) continue;
      form.append(chave, String(valor));
    }
    for (const [chave, arquivo] of Object.entries(arquivos)) {
      if (!arquivo) continue;
      form.append(chave, new Blob([arquivo.conteudo], { type: arquivo.tipo }), arquivo.nome);
    }
    return this.requisitar(caminho, { method: 'POST', body: form });
  }
}

/** Autentica um cliente pelo formulário real de login. */
export async function entrar(email, senha, rotulo = email) {
  const cliente = new Cliente(rotulo);
  const resposta = await cliente.postForm('/autentica/entrar', { email, senha });
  if (resposta.status !== 302) {
    const corpo = await resposta.text();
    throw new Error(`Login de ${email} falhou (status ${resposta.status}): ${corpo.slice(0, 400)}`);
  }
  return cliente;
}

// ---------------------------------------------------------------- massa fake

const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Pereira', 'Almeida', 'Ferreira', 'Rodrigues', 'Costa'];
const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Heitor', 'Isabela', 'João'];

let contador = 0;
/** Sufixo único por execução, para a massa fake nunca colidir entre rodadas. */
export function unico() {
  return `${Date.now().toString(36)}${(contador++).toString(36).padStart(2, '0')}`;
}

export function emailFake(prefixo = 'teste') {
  return `${prefixo}.${unico()}@bendita.test`;
}

export function nomeFake() {
  const n = NOMES[Math.floor(Math.random() * NOMES.length)];
  const s = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
  const s2 = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
  return `${n} ${s} ${s2}`;
}

/** CPF sintético com dígitos verificadores válidos (formatado). */
export function cpfFake() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const digito = (nums) => {
    const peso = nums.length + 1;
    const soma = nums.reduce((acc, n, i) => acc + n * (peso - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(base);
  const d2 = digito([...base, d1]);
  const t = [...base, d1, d2].join('');
  return `${t.slice(0, 3)}.${t.slice(3, 6)}.${t.slice(6, 9)}-${t.slice(9)}`;
}

export function telefoneFake() {
  const n = () => Math.floor(Math.random() * 10);
  return `(47) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

/** Data de nascimento no formato dd/MM/yyyy para uma idade alvo. */
export function nascimentoParaIdade(idade) {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear() - idade, hoje.getMonth(), hoje.getDate());
  d.setDate(d.getDate() - 1); // garante que o aniversário já passou
  const pad = (v) => String(v).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// -------------------------------------------------------------- arquivos fake

/** PNG 1x1 válido — o pipeline de upload roda Jimp em imagens. */
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export const PDF_MINIMO = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF`,
  'utf8'
);

export const arquivoPng = (nome = 'documento.png') => ({ conteudo: PNG_1X1, nome, tipo: 'image/png' });
export const arquivoPdf = (nome = 'documento.pdf') => ({ conteudo: PDF_MINIMO, nome, tipo: 'application/pdf' });

// ------------------------------------------------------------------ auxiliares

/**
 * Cria um usuário direto no banco (atalho para cenários que não testam o cadastro).
 * Por padrão cria o perfil junto, como acontece em todos os fluxos reais da app.
 */
export async function criarUsuarioDireto({
  papel,
  senha = 'senha12345',
  email = emailFake(papel.toLowerCase()),
  comPerfil = true,
}) {
  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash(senha, Number(process.env.PASSWORD_SALT) || 10);
  const usuario = await prisma.usuario.create({ data: { email, senha: hash, papel } });

  let perfil = null;
  if (comPerfil) {
    perfil = await prisma.perfil.create({
      data: {
        nome_completo: nomeFake(),
        data_nascimento: '1985-01-20',
        cpf: cpfFake(),
        telefone: telefoneFake(),
        nacionalidade: 'Brasil',
        usuarioId: usuario.id,
      },
    });
  }

  return { usuario, email, senha, perfil };
}

/** Cria usuário + perfil + associado já ativos. */
export async function criarAssociadoCompleto({
  senha = 'senha12345',
  status = AssociacaoStatus.ASSOCIADO,
  aceitouTermo = true,
  papel = Papel.ASSOCIADO,
  elegivelTarifaSocial = false,
} = {}) {
  const { usuario, email } = await criarUsuarioDireto({ papel, senha, comPerfil: false });
  const perfil = await prisma.perfil.create({
    data: {
      nome_completo: nomeFake(),
      apelido: 'Fulano',
      data_nascimento: '1990-05-10',
      cpf: cpfFake(),
      rg: '1234567',
      sexo: 'Feminino',
      nacionalidade: 'Brasil',
      estado_civil: 'Solteiro(a)',
      telefone: telefoneFake(),
      cep: '89010-000',
      endereco_rua: 'Rua das Flores',
      endereco_numero: '100',
      endereco_bairro: 'Centro',
      endereco_cidade: 'Blumenau',
      endereco_estado: 'SC',
      usuarioId: usuario.id,
    },
  });
  const associado = await prisma.associado.create({
    data: {
      perfilId: perfil.id,
      status,
      elegivel_tarifa_social: elegivelTarifaSocial,
      de_acordo_termo_associativo: aceitouTermo || null,
      de_acordo_termo_associativo_em: aceitouTermo ? new Date() : null,
    },
  });
  return { usuario, email, senha, perfil, associado };
}

export async function corpo(resposta) {
  return await resposta.text();
}

export function contem(texto, trecho) {
  return texto.includes(trecho);
}
