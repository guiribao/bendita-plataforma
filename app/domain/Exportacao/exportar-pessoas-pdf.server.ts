import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { prisma } from '~/secure/db.server';
import { brDataFromIsoString } from '~/shared/DateTime.util';

interface PerfilCompleto {
  id: string;
  nome_completo: string;
  apelido: string | null;
  cpf: string | null;
  rg: string | null;
  data_nascimento: Date;
  sexo: string | null;
  telefone: string | null;
  nacionalidade: string | null;
  estado_civil: string | null;
  cep: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_complemento: string | null;
  redes_instagram: string | null;
  redes_linkedin: string | null;
  usuario: {
    email: string;
    papel: string;
    criado_em: Date;
  };
  Associacao: {
    tipo_associado: string;
    status: string;
    indicado_por: string | null;
    saude_quadro_geral: string | null;
    saude_uso_medicacao: boolean;
    saude_uso_medicacao_nome: string | null;
    saude_uso_terapeutico_canabis: boolean;
    saude_uso_terapeutico_canabis_experiencia: string | null;
    saude_medico_prescritor: boolean;
    saude_medico_prescritor_nome: string | null;
    saude_medico_prescritor_crm: string | null;
    de_acordo_termo_associativo: boolean | null;
    de_acordo_termo_associativo_em: Date | null;
    Documentos: {
      tipo: string;
      nome_arquivo: string;
      criado_em: Date;
    }[];
  } | null;
}

export async function gerarPDFPessoas(): Promise<Buffer> {
  // Busca todos os perfis com dados relacionados
  const perfis = await prisma.perfil.findMany({
    include: {
      usuario: {
        select: {
          email: true,
          papel: true,
          criado_em: true,
        },
      },
      Associacao: {
        include: {
          Documentos: {
            select: {
              tipo: true,
              nome_arquivo: true,
              criado_em: true,
            },
          },
        },
      },
    },
    orderBy: {
      nome_completo: 'asc',
    },
  });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 50, left: 30, right: 30 },
        bufferPages: true,
        info: {
          Title: 'Relatorio de Pessoas - Bendita Canabica',
          Author: 'Associacao Bendita Canabica',
          Subject: 'Exportacao de dados de pessoas cadastradas',
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Página de resumo
      adicionarCabecalho(doc);
      adicionarTabelaResumo(doc, perfis);

      // Lista detalhada de pessoas (uma por página)
      perfis.forEach((perfil, index) => {
        doc.addPage();
        adicionarPessoaDetalhada(doc, perfil as PerfilCompleto, index + 1);
      });

      // Rodapé em todas as páginas
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        adicionarRodape(doc, i + 1, range.count);
      }

      doc.end();
    } catch (erro) {
      reject(erro);
    }
  });
}

function adicionarCabecalho(doc: PDFKit.PDFDocument) {
  doc
    .fontSize(22)
    .fillColor('#9932cc')
    .font('Helvetica-Bold')
    .text('Associacao Bendita Canabica', { align: 'center' })
    .moveDown(0.3);

  doc
    .fontSize(14)
    .fillColor('#666')
    .font('Helvetica')
    .text('Relatorio de Pessoas Cadastradas', { align: 'center' })
    .moveDown(0.2);

  doc
    .fontSize(9)
    .fillColor('#999')
    .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
    .moveDown(0.8);

  doc
    .strokeColor('#9932cc')
    .lineWidth(1.5)
    .moveTo(30, doc.y)
    .lineTo(doc.page.width - 30, doc.y)
    .stroke()
    .moveDown(0.8);
}

function adicionarTabelaResumo(doc: PDFKit.PDFDocument, perfis: any[]) {
  const totalPessoas = perfis.length;
  const totalAssociados = perfis.filter(p => p.usuario.papel === 'ASSOCIADO').length;
  const totalAdmins = perfis.filter(p => p.usuario.papel === 'ADMIN').length;
  const totalSecretaria = perfis.filter(p => p.usuario.papel === 'SECRETARIA').length;
  const totalSaude = perfis.filter(p => p.usuario.papel === 'SAUDE').length;
  const totalDependentes = perfis.filter(p => p.usuario.papel === 'ASSOCIADO_DEPENDENTE').length;
  const totalComAssociacao = perfis.filter(p => p.Associacao).length;
  const totalMedicinal = perfis.filter(p => p.Associacao?.tipo_associado === 'MEDICINAL').length;
  const totalApoiador = perfis.filter(p => p.Associacao?.tipo_associado === 'APOIADOR').length;

  doc
    .fontSize(13)
    .fillColor('#9932cc')
    .font('Helvetica-Bold')
    .text('Resumo Estatistico', { align: 'center' })
    .moveDown(0.8);

  const startX = 200;
  const startY = doc.y;
  const cellHeight = 22;
  const col1Width = 300;
  const col2Width = 120;

  const dados = [
    ['Metrica', 'Quantidade'],
    ['Total de Pessoas Cadastradas', totalPessoas.toString()],
    ['Associados', totalAssociados.toString()],
    ['Dependentes', totalDependentes.toString()],
    ['Administradores', totalAdmins.toString()],
    ['Secretaria', totalSecretaria.toString()],
    ['Saude', totalSaude.toString()],
    ['Com Associacao Ativa', totalComAssociacao.toString()],
    ['Tipo Medicinal', totalMedicinal.toString()],
    ['Tipo Apoiador', totalApoiador.toString()],
  ];

  let currentY = startY;

  dados.forEach((linha, index) => {
    const isHeader = index === 0;
    
    if (isHeader) {
      doc.fillColor('#9932cc').rect(startX, currentY, col1Width + col2Width, cellHeight).fill();
    } else if (index % 2 === 0) {
      doc.fillColor('#f8f8f8').rect(startX, currentY, col1Width + col2Width, cellHeight).fill();
    }

    doc
      .strokeColor('#dddddd')
      .lineWidth(0.5)
      .rect(startX, currentY, col1Width, cellHeight)
      .stroke()
      .rect(startX + col1Width, currentY, col2Width, cellHeight)
      .stroke();

    const fontSize = isHeader ? 10 : 9;
    const textColor = isHeader ? '#ffffff' : '#333333';
    const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';

    doc
      .fontSize(fontSize)
      .fillColor(textColor)
      .font(font)
      .text(linha[0], startX + 8, currentY + 6, {
        width: col1Width - 16,
        align: 'left',
      })
      .text(linha[1], startX + col1Width + 8, currentY + 6, {
        width: col2Width - 16,
        align: 'center',
      });

    currentY += cellHeight;
  });

  doc.y = currentY + 20;
}

function adicionarPessoaDetalhada(doc: PDFKit.PDFDocument, perfil: PerfilCompleto, numero: number) {
  let currentY = 40;
  const leftMargin = 40;
  const rightMargin = doc.page.width - 40;
  const columnWidth = (rightMargin - leftMargin - 20) / 2;

  // Título com nome
  doc
    .fontSize(16)
    .fillColor('#9932cc')
    .font('Helvetica-Bold')
    .text(`${numero}. ${perfil.nome_completo}`, leftMargin, currentY)
    .moveDown(0.5);

  currentY = doc.y;

  // Linha separadora
  doc
    .strokeColor('#9932cc')
    .lineWidth(1)
    .moveTo(leftMargin, currentY)
    .lineTo(rightMargin, currentY)
    .stroke();

  currentY += 15;

  // SEÇÃO 1: DADOS PESSOAIS E CONTATO
  currentY = adicionarSecaoBox(doc, 'DADOS PESSOAIS', leftMargin, currentY, columnWidth, [
    ['Email', perfil.usuario.email],
    ['Papel no Sistema', formatarPapel(perfil.usuario.papel)],
    ['CPF', perfil.cpf || 'Nao informado'],
    ['RG', perfil.rg || 'Nao informado'],
    ['Data de Nascimento', perfil.data_nascimento ? brDataFromIsoString(perfil.data_nascimento.toISOString()) : 'Nao informado'],
    ['Sexo', perfil.sexo === 'M' ? 'Masculino' : perfil.sexo === 'F' ? 'Feminino' : 'Nao informado'],
    ['Apelido', perfil.apelido || 'Nao informado'],
    ['Nacionalidade', perfil.nacionalidade || 'Nao informado'],
    ['Estado Civil', perfil.estado_civil || 'Nao informado'],
  ]);

  // SEÇÃO 2: CONTATO (lado direito)
  adicionarSecaoBox(doc, 'CONTATO', leftMargin + columnWidth + 20, 40 + 50, columnWidth, [
    ['Telefone', perfil.telefone || 'Nao informado'],
    ['Instagram', perfil.redes_instagram || 'Nao informado'],
    ['LinkedIn', perfil.redes_linkedin || 'Nao informado'],
  ]);

  currentY += 10;

  // SEÇÃO 3: ENDEREÇO
  const enderecoCompleto = [
    perfil.endereco_rua,
    perfil.endereco_numero,
    perfil.endereco_complemento,
    perfil.endereco_bairro,
    perfil.endereco_cidade,
    perfil.endereco_estado,
    perfil.cep,
  ].filter(Boolean).join(', ') || 'Nao informado';

  currentY = adicionarSecaoBox(doc, 'ENDERECO', leftMargin, currentY, rightMargin - leftMargin, [
    ['Endereco Completo', enderecoCompleto],
  ]);

  currentY += 10;

  // SEÇÃO 4: INFORMAÇÕES DA ASSOCIAÇÃO
  if (perfil.Associacao) {
    currentY = adicionarSecaoBox(doc, 'INFORMACOES DA ASSOCIACAO', leftMargin, currentY, columnWidth, [
      ['Tipo de Associado', formatarTipoAssociado(perfil.Associacao.tipo_associado)],
      ['Status', formatarStatus(perfil.Associacao.status)],
      ['Indicado por', perfil.Associacao.indicado_por || 'Nao informado'],
      ['Termo Aceito', perfil.Associacao.de_acordo_termo_associativo 
        ? `Sim (${perfil.Associacao.de_acordo_termo_associativo_em ? brDataFromIsoString(perfil.Associacao.de_acordo_termo_associativo_em.toISOString()) : 'data nao informada'})` 
        : 'Nao'],
    ]);

    // SEÇÃO 5: DOCUMENTOS (lado direito)
    const startDocY = currentY - (4 * 18 + 35);
    const docTexts: [string, string][] = [];
    if (perfil.Associacao.Documentos.length > 0) {
      docTexts.push(['Total de Documentos', perfil.Associacao.Documentos.length.toString()]);
      perfil.Associacao.Documentos.forEach((doc, idx) => {
        docTexts.push([
          `${idx + 1}. ${formatarTipoDocumento(doc.tipo)}`,
          truncateText(doc.nome_arquivo, 25)
        ]);
      });
    } else {
      docTexts.push(['Documentos', 'Nenhum documento anexado']);
    }
    
    adicionarSecaoBox(doc, 'DOCUMENTOS', leftMargin + columnWidth + 20, startDocY, columnWidth, docTexts);

    currentY += 10;

    // SEÇÃO 6: INFORMAÇÕES DE SAÚDE
    if (perfil.Associacao.saude_quadro_geral || perfil.Associacao.saude_uso_medicacao || 
        perfil.Associacao.saude_uso_terapeutico_canabis || perfil.Associacao.saude_medico_prescritor) {
      
      const saudeInfos: [string, string][] = [
        ['Quadro Geral', truncateText(perfil.Associacao.saude_quadro_geral || 'Nao informado', 100)],
        ['Usa Medicacao', perfil.Associacao.saude_uso_medicacao ? 'Sim' : 'Nao'],
      ];

      if (perfil.Associacao.saude_uso_medicacao && perfil.Associacao.saude_uso_medicacao_nome) {
        saudeInfos.push(['Medicacoes', truncateText(perfil.Associacao.saude_uso_medicacao_nome, 80)]);
      }

      saudeInfos.push(['Uso Terapeutico de Cannabis', perfil.Associacao.saude_uso_terapeutico_canabis ? 'Sim' : 'Nao']);

      if (perfil.Associacao.saude_uso_terapeutico_canabis && perfil.Associacao.saude_uso_terapeutico_canabis_experiencia) {
        saudeInfos.push(['Experiencia com Cannabis', truncateText(perfil.Associacao.saude_uso_terapeutico_canabis_experiencia, 100)]);
      }

      saudeInfos.push(['Acompanhado por Prescritor', perfil.Associacao.saude_medico_prescritor ? 'Sim' : 'Nao']);

      if (perfil.Associacao.saude_medico_prescritor && perfil.Associacao.saude_medico_prescritor_nome) {
        saudeInfos.push(['Medico Prescritor', perfil.Associacao.saude_medico_prescritor_nome]);
      }

      if (perfil.Associacao.saude_medico_prescritor_crm) {
        saudeInfos.push(['CRM do Medico', perfil.Associacao.saude_medico_prescritor_crm]);
      }

      currentY = adicionarSecaoBox(doc, 'INFORMACOES DE SAUDE', leftMargin, currentY, rightMargin - leftMargin, saudeInfos);
    }
  }

  // Data de cadastro no rodapé da página
  doc
    .fontSize(8)
    .fillColor('#999')
    .font('Helvetica')
    .text(
      `Cadastrado em: ${brDataFromIsoString(perfil.usuario.criado_em.toISOString())}`,
      leftMargin,
      doc.page.height - 65,
      { align: 'right', width: rightMargin - leftMargin }
    );
}

function adicionarSecaoBox(
  doc: PDFKit.PDFDocument,
  titulo: string,
  x: number,
  y: number,
  width: number,
  campos: [string, string][]
): number {
  const padding = 8;
  const lineHeight = 18;
  const headerHeight = 25;
  const boxHeight = headerHeight + (campos.length * lineHeight) + padding;

  // Fundo do cabeçalho
  doc
    .fillColor('#9932cc')
    .rect(x, y, width, headerHeight)
    .fill();

  // Título
  doc
    .fontSize(10)
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text(titulo, x + padding, y + 7, {
      width: width - (padding * 2),
      align: 'left',
    });

  // Corpo da caixa
  doc
    .strokeColor('#dddddd')
    .lineWidth(1)
    .rect(x, y + headerHeight, width, boxHeight - headerHeight)
    .stroke();

  // Fundo alternado e conteúdo
  let currentY = y + headerHeight + padding;

  campos.forEach((campo, index) => {
    if (index % 2 === 0) {
      doc
        .fillColor('#f9f9f9')
        .rect(x, currentY - 4, width, lineHeight)
        .fill();
    }

    doc
      .fontSize(8)
      .fillColor('#666')
      .font('Helvetica-Bold')
      .text(campo[0] + ':', x + padding, currentY, {
        width: width * 0.35,
        continued: true,
      })
      .fillColor('#333')
      .font('Helvetica')
      .text(' ' + campo[1], {
        width: width * 0.6,
      });

    currentY += lineHeight;
  });

  return y + boxHeight + padding;
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function adicionarRodape(doc: PDFKit.PDFDocument, pagina: number, total: number) {
  doc
    .fontSize(8)
    .fillColor('#999')
    .font('Helvetica')
    .text(
      `Pagina ${pagina} de ${total} | (c) ${new Date().getFullYear()} Associacao Bendita Canabica`,
      30,
      doc.page.height - 35,
      { align: 'center', width: doc.page.width - 60 }
    );
}

function formatarPapel(papel: string): string {
  const papeis: Record<string, string> = {
    ADMIN: 'Administrador',
    ASSOCIADO: 'Associado',
    ASSOCIADO_DEPENDENTE: 'Dependente',
    SECRETARIA: 'Secretaria',
    SAUDE: 'Saúde',
  };
  return papeis[papel] || papel;
}

function formatarTipoAssociado(tipo: string): string {
  const tipos: Record<string, string> = {
    MEDICINAL: 'Medicinal',
    APOIADOR: 'Apoiador',
  };
  return tipos[tipo] || tipo;
}

function formatarStatus(status: string): string {
  const statuses: Record<string, string> = {
    AGUARDANDO_CADASTRO: 'Aguardando Cadastro',
    AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
    AGUARDANDO_ASSINATURA: 'Aguardando Assinatura',
    EM_ANALISE: 'Em Análise',
    ASSOCIADO: 'Associado',
  };
  return statuses[status] || status;
}

function formatarTipoDocumento(tipo: string): string {
  const tipos: Record<string, string> = {
    NAO_IDENTIFICADO: 'Não Identificado',
    IDENTIFICACAO: 'Identificação',
    IDENTIFICACAO_RESPONSAVEL: 'Identificação do Responsável',
    COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
    RECEITA_MEDICA: 'Receita Médica',
    AUTORIZACAO_ANVISA: 'Autorização ANVISA',
  };
  return tipos[tipo] || tipo;
}
