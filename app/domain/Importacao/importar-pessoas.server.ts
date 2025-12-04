import * as XLSX from 'xlsx';
import { prisma } from '~/secure/db.server';
import { Papel, TipoAssociado, AssociacaoStatus } from '@prisma/client';
import { createRandomPassword } from '~/shared/Password.util';
import bcrypt from 'bcryptjs';
import { uploadGoogleDriveToS3 } from '~/storage/google-drive-to-s3.server';
import enviarEmailBoasVindas from '../Usuario/enviar-email-boas-vindas.server';

interface LinhaXLSX {
  'Associado': string;
  'Carimbo de data/hora': string;
  'Endereço de e-mail': string;
  'Nome': string;
  'CPF': string;
  'RG': string;
  'Anexar documento de identificação': string;
  'Data do nascimento': string;
  'SEXO': string;
  'Endereço completo (Endereço, bairro, cidade, estado e CEP)': string;
  'Comprovante de Residência (conta de água, luz ou telefone)': string;
  'Telefone/Whatsapp': string;
  'Email': string;
  'Quem indicou a Bendita Associação Canábica?': string;
  'Tipo de Associado': string;
  'Quadro geral de saúde - Descreva os diagnósticos de patologias existentes': string;
  'Usa alguma medicação?': string;
  'Se usa alguma medicação escreva aqui o(s) nome(s):': string;
  'Já fez uso terapêutico com a cannabis?': string;
  'Caso já tenha feito uso terapêutico faça um breve relato da sua experiência.': string;
  'É acompanhado por médico prescritor de cannabis?': string;
  'Se é acompanhado por médico prescritor, qual o nome  e CRM do profissional?': string;
  'Se você já tem receita médica para uso da cannabis medicinal anexe aqui.': string;
  'Se você possui autorização da ANVISA para importação anexe aqui.': string;
  'Nome do responsável - aplicável para o caso de pacientes menores de idade e com doenças neurodegenerativas': string;
  'CPF do Responsável': string;
  'RG do Responsável': string;
  'Anexe RG do responsável': string;
  'Sexo do Responsável': string;
  'Data de nascimento do responsável': string;
  'Endereço completo do responsável (Endereço, bairro, cidade, estado e CEP': string;
  'Telefone do responsável com DDD': string;
  'E-mail do responsável': string;
}

function parseDataNascimento(data: string): Date | null {
  if (!data) return null;
  
  try {
    // Tenta formato DD/MM/YYYY
    const partes = data.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }
    
    // Tenta número serial do Excel
    if (!isNaN(Number(data))) {
      const excelDate = XLSX.SSF.parse_date_code(Number(data));
      return new Date(excelDate.y, excelDate.m - 1, excelDate.d);
    }
    
    return new Date(data);
  } catch {
    return null;
  }
}

function parseEndereco(enderecoCompleto: string) {
  // Formato esperado: "Endereço, bairro, cidade, estado e CEP"
  const partes = enderecoCompleto.split(',').map(p => p.trim());
  
  return {
    endereco: partes[0] || '',
    bairro: partes[1] || '',
    cidade: partes[2] || '',
    estado: partes[3]?.split(' ')[0] || '',
    cep: partes[3]?.match(/\d{5}-?\d{3}/)?.[0] || '',
  };
}

function mapearTipoAssociado(tipo: string): TipoAssociado {
  const tipoLower = tipo?.toLowerCase() || '';
  
  if (tipoLower.includes('medicinal') || tipoLower.includes('paciente')) return TipoAssociado.MEDICINAL;
  if (tipoLower.includes('apoiador')) return TipoAssociado.APOIADOR;
  
  return TipoAssociado.MEDICINAL; // Default
}

export async function importarPessoas(arquivo: File) {
  const resultados = {
    total: 0,
    sucesso: 0,
    erros: [] as { linha: number; erro: string; dados?: any }[],
  };

  try {
    // Lê o arquivo XLSX
    const buffer = await arquivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];
    const linhas: LinhaXLSX[] = XLSX.utils.sheet_to_json(primeiraAba);

    resultados.total = linhas.length;

    // Processa cada linha
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const numeroLinha = i + 2; // +2 porque linha 1 é cabeçalho e índice começa em 0

      try {
        await processarLinha(linha, numeroLinha);
        resultados.sucesso++;
      } catch (erro: any) {
        console.error(`Erro ao processar linha ${numeroLinha}:`, erro);
        resultados.erros.push({
          linha: numeroLinha,
          erro: erro.message,
          dados: {
            nome: linha['Nome'],
            cpf: linha['CPF'],
            email: linha['Email'] || linha['Endereço de e-mail'],
          },
        });
      }
    }

    return resultados;
  } catch (erro: any) {
    throw new Error(`Erro ao processar arquivo: ${erro.message}`);
  }
}

async function processarLinha(linha: LinhaXLSX, numeroLinha: number) {
  // Determina se é dependente (tem responsável)
  const temResponsavel = !!linha['Nome do responsável - aplicável para o caso de pacientes menores de idade e com doenças neurodegenerativas'];
  
  // Email principal
  const email = linha['Email'] || linha['Endereço de e-mail'];
  if (!email) {
    throw new Error('Email é obrigatório');
  }

  // Verifica se usuário já existe
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    throw new Error(`Email ${email} já está cadastrado`);
  }

  // Gera senha aleatória
  const senhaTemporaria = createRandomPassword(12);
  const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

  // Parse data de nascimento
  const dataNascimento = parseDataNascimento(linha['Data do nascimento']);
  if (!dataNascimento) {
    throw new Error('Data de nascimento inválida');
  }

  // Parse endereço
  const endereco = parseEndereco(linha['Endereço completo (Endereço, bairro, cidade, estado e CEP)']);

  // Cria usuário
  const usuario = await prisma.usuario.create({
    data: {
      email,
      senha: senhaHash,
      papel: Papel.ASSOCIADO,
    },
  });

  // Cria perfil
  const perfil = await prisma.perfil.create({
    data: {
      usuarioId: usuario.id,
      nome_completo: linha['Nome'],
      cpf: linha['CPF'],
      rg: linha['RG'],
      data_nascimento: dataNascimento,
      sexo: linha['SEXO']?.toUpperCase() === 'MASCULINO' ? 'M' : 'F',
      telefone: linha['Telefone/Whatsapp'],
      endereco_rua: endereco.endereco,
      endereco_bairro: endereco.bairro,
      endereco_cidade: endereco.cidade,
      endereco_estado: endereco.estado,
      cep: endereco.cep,
    },
  });

  // Cria associação
  const tipoAssociado = mapearTipoAssociado(linha['Tipo de Associado']);
  
  const associacao = await prisma.associado.create({
    data: {
      perfilId: perfil.id,
      tipo_associado: tipoAssociado,
      status: AssociacaoStatus.AGUARDANDO_PAGAMENTO,
      indicado_por: linha['Quem indicou a Bendita Associação Canábica?'] || null,
      de_acordo_termo_associativo: true,
      de_acordo_termo_associativo_em: new Date(),
      saude_quadro_geral: linha['Quadro geral de saúde - Descreva os diagnósticos de patologias existentes'] || null,
      saude_uso_medicacao: linha['Usa alguma medicação?']?.toLowerCase().includes('sim') || false,
      saude_uso_medicacao_nome: linha['Se usa alguma medicação escreva aqui o(s) nome(s):'] || null,
      saude_uso_terapeutico_canabis: linha['Já fez uso terapêutico com a cannabis?']?.toLowerCase().includes('sim') || false,
      saude_uso_terapeutico_canabis_experiencia: linha['Caso já tenha feito uso terapêutico faça um breve relato da sua experiência.'] || null,
      saude_medico_prescritor: linha['É acompanhado por médico prescritor de cannabis?']?.toLowerCase().includes('sim') || false,
      saude_medico_prescritor_nome: linha['Se é acompanhado por médico prescritor, qual o nome  e CRM do profissional?'] || null,
    },
  });

  // Processa documentos do Google Drive
  await processarDocumentos(perfil.id, linha);

  // Se tem responsável, cria o responsável como associado também
  if (temResponsavel) {
    await criarResponsavel(linha, perfil.id);
  }

  // Envia email de boas-vindas
  try {
    await enviarEmailBoasVindas(email, linha['Nome'], senhaTemporaria);
  } catch (erro) {
    console.error(`Erro ao enviar email para ${email}:`, erro);
    // Não falha a importação se o email não for enviado
  }
}

async function processarDocumentos(perfilId: string, linha: LinhaXLSX) {
  const documentos = [
    {
      url: linha['Anexar documento de identificação'],
      tipo: 'IDENTIFICACAO',
    },
    {
      url: linha['Comprovante de Residência (conta de água, luz ou telefone)'],
      tipo: 'COMPROVANTE_RESIDENCIA',
    },
    {
      url: linha['Se você já tem receita médica para uso da cannabis medicinal anexe aqui.'],
      tipo: 'RECEITA_MEDICA',
    },
    {
      url: linha['Se você possui autorização da ANVISA para importação anexe aqui.'],
      tipo: 'AUTORIZACAO_ANVISA',
    },
  ];

  for (const doc of documentos) {
    if (doc.url && doc.url.trim()) {
      try {
        // Faz upload do Google Drive para S3
        const s3Key = await uploadGoogleDriveToS3(doc.url, perfilId);
        
        // Busca o associado pelo perfil
        const associado = await prisma.associado.findUnique({
          where: { perfilId },
        });
        
        if (associado) {
          // Cria registro do documento
          await prisma.documentos.create({
            data: {
              associadoId: associado.id,
              tipo: doc.tipo as any,
              nome_arquivo: s3Key.split('/').pop() || 'documento',
            },
          });
        }
      } catch (erro) {
        console.error(`Erro ao processar documento ${doc.tipo}:`, erro);
        // Continua mesmo se houver erro no documento
      }
    }
  }
}

async function criarResponsavel(linha: LinhaXLSX, dependentePerfilId: string) {
  const emailResponsavel = linha['E-mail do responsável'];
  if (!emailResponsavel) {
    throw new Error('Email do responsável é obrigatório quando há responsável');
  }

  // Verifica se responsável já existe
  let usuarioResponsavel = await prisma.usuario.findUnique({
    where: { email: emailResponsavel },
    include: { perfil: true },
  });

  let perfilResponsavel;

  if (usuarioResponsavel && usuarioResponsavel.perfil) {
    // Responsável já existe
    perfilResponsavel = usuarioResponsavel.perfil;
  } else {
    // Cria novo responsável
    const senhaTemporaria = createRandomPassword(12);
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const dataNascimentoResp = parseDataNascimento(linha['Data de nascimento do responsável']);
    if (!dataNascimentoResp) {
      throw new Error('Data de nascimento do responsável inválida');
    }
    const enderecoResp = parseEndereco(linha['Endereço completo do responsável (Endereço, bairro, cidade, estado e CEP']);

    const novoUsuario = await prisma.usuario.create({
      data: {
        email: emailResponsavel,
        senha: senhaHash,
        papel: Papel.ASSOCIADO,
      },
    });

    perfilResponsavel = await prisma.perfil.create({
      data: {
        usuarioId: novoUsuario.id,
        nome_completo: linha['Nome do responsável - aplicável para o caso de pacientes menores de idade e com doenças neurodegenerativas'],
        cpf: linha['CPF do Responsável'],
        rg: linha['RG do Responsável'],
        data_nascimento: dataNascimentoResp,
        sexo: linha['Sexo do Responsável']?.toUpperCase() === 'MASCULINO' ? 'M' : 'F',
        telefone: linha['Telefone do responsável com DDD'],
        endereco_rua: enderecoResp.endereco,
        endereco_bairro: enderecoResp.bairro,
        endereco_cidade: enderecoResp.cidade,
        endereco_estado: enderecoResp.estado,
        cep: enderecoResp.cep,
      },
    });

    // Cria associação para o responsável
    await prisma.associado.create({
      data: {
        perfilId: perfilResponsavel.id,
        tipo_associado: TipoAssociado.APOIADOR,
        status: AssociacaoStatus.AGUARDANDO_PAGAMENTO,
        de_acordo_termo_associativo: true,
        de_acordo_termo_associativo_em: new Date(),
      },
    });

    // Processa documento do responsável
    if (linha['Anexe RG do responsável']) {
      try {
        const s3Key = await uploadGoogleDriveToS3(
          linha['Anexe RG do responsável'],
          perfilResponsavel.id
        );
        
        const associadoResp = await prisma.associado.findUnique({
          where: { perfilId: perfilResponsavel.id },
        });
        
        if (associadoResp) {
          await prisma.documentos.create({
            data: {
              associadoId: associadoResp.id,
              tipo: 'IDENTIFICACAO_RESPONSAVEL' as any,
              nome_arquivo: s3Key.split('/').pop() || 'rg-responsavel',
            },
          });
        }
      } catch (erro) {
        console.error('Erro ao processar RG do responsável:', erro);
      }
    }

    // Envia email para o responsável
    try {
      await enviarEmailBoasVindas(
        emailResponsavel,
        linha['Nome do responsável - aplicável para o caso de pacientes menores de idade e com doenças neurodegenerativas'],
        senhaTemporaria
      );
    } catch (erro) {
      console.error(`Erro ao enviar email para responsável ${emailResponsavel}:`, erro);
    }
  }

  // Atualiza o dependente com o ID do responsável
  await prisma.associado.update({
    where: { perfilId: dependentePerfilId },
    data: { responsavelId: perfilResponsavel.id },
  });
}
