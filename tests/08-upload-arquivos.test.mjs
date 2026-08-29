import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Jimp from 'jimp';
import {
  ROOT, prisma, entrar, criarAssociadoCompleto, corpo, contem, PDF_MINIMO,
} from './helpers/harness.mjs';

after(() => prisma.$disconnect());

/** PNG com ruído — não comprime no formato, então o arquivo fica realmente grande. */
async function pngGrande(largura, altura) {
  const imagem = new Jimp(largura, altura);
  for (let x = 0; x < largura; x += 1) {
    for (let y = 0; y < altura; y += 1) {
      imagem.setPixelColor(Math.floor(Math.random() * 0xffffff) * 256 + 255, x, y);
    }
  }
  return imagem.getBufferAsync('image/png');
}

async function enviarDocumento(arquivo) {
  const associado = await criarAssociadoCompleto();
  const cliente = await entrar(associado.email, associado.senha);
  const resposta = await cliente.postMultipart('/app/documentos/novo', {}, {
    identificacao_1: arquivo,
  });
  const documento = await prisma.documentos.findFirst({
    where: { associadoId: associado.associado.id },
    orderBy: { criado_em: 'desc' },
  });
  return { resposta, documento };
}

describe('Upload de documentos — limite e compressão', () => {
  test('imagem grande é aceita e gravada comprimida', async () => {
    const conteudo = await pngGrande(2400, 1200);
    assert.ok(conteudo.length > 5 * 1024 * 1024,
      'a massa do teste precisa passar do antigo limite de 5MB');

    const { resposta, documento } = await enviarDocumento({
      conteudo, nome: 'identidade.png', tipo: 'image/png',
    });

    assert.equal(resposta.status, 200, (await corpo(resposta)).slice(0, 300));
    assert.ok(documento, 'o upload deveria gerar um documento');

    const gravado = await fs.readFile(path.join(ROOT, 'storage-private', documento.nome_arquivo));
    assert.ok(gravado.length < conteudo.length,
      `o arquivo gravado (${gravado.length}) deveria ser menor que o enviado (${conteudo.length})`);

    const imagem = await Jimp.read(gravado);
    assert.ok(imagem.getWidth() <= 2000 && imagem.getHeight() <= 2000,
      'a imagem deveria ser redimensionada para no máximo 2000px');
  });

  test('arquivo acima de 15MB é recusado com mensagem', async () => {
    const conteudo = Buffer.concat([PDF_MINIMO, Buffer.alloc(16 * 1024 * 1024, 0x20)]);

    const { resposta, documento } = await enviarDocumento({
      conteudo, nome: 'identidade.pdf', tipo: 'application/pdf',
    });

    assert.equal(resposta.status, 400);
    assert.equal(documento, null, 'nenhum documento deveria ser criado');
    contem(await corpo(resposta), '15MB');
  });

  test('PDF entre 5MB e 15MB é aceito', async () => {
    const conteudo = Buffer.concat([PDF_MINIMO, Buffer.alloc(8 * 1024 * 1024, 0x20)]);

    const { resposta, documento } = await enviarDocumento({
      conteudo, nome: 'identidade.pdf', tipo: 'application/pdf',
    });

    assert.equal(resposta.status, 200);
    assert.ok(documento, 'o upload deveria gerar um documento');
    assert.ok(documento.nome_arquivo.endsWith('.pdf'));
  });
});
