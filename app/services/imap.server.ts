// @ts-ignore - imap não tem types oficiais
import Imap from 'imap';
// @ts-ignore - mailparser types não completos
import { simpleParser } from 'mailparser';
import { prisma } from '~/secure/db.server';
import { Remetente } from '@prisma/client';

interface ParsedEmail {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string;
}

/**
 * Remove o histórico de conversação do email, mantendo apenas a resposta atual
 * Busca por padrões comuns de separação de emails anteriores
 */
function extractCurrentReply(emailText: string): string {
  if (!emailText) return '';

  // Padrões comuns que indicam início de email anterior
  const separators = [
    /^Em .+ escreveu:$/m,                    // Gmail PT: "Em dom., 3 de dez. de 2024 às 10:00, Nome <email> escreveu:"
    /^On .+ wrote:$/m,                       // Gmail EN: "On Sun, Dec 3, 2024 at 10:00 AM, Name <email> wrote:"
    /^De: .+$/m,                             // Outlook: "De: Nome"
    /^From: .+$/m,                           // "From: Name"
    /^-{3,}/m,                               // Linha de separação: "---" ou mais
    /^_{3,}/m,                               // Linha de underline: "___"
    /^>{1,}/m,                               // Citação: "> texto citado"
    /^Enviado do meu .+$/m,                  // "Enviado do meu iPhone"
    /^Sent from my .+$/m,                    // "Sent from my iPhone"
    /^-------- Mensagem original --------$/m, // Thunderbird PT
    /^-------- Original Message --------$/m,  // Thunderbird EN
  ];

  let cleanText = emailText.trim();
  let earliestPosition = cleanText.length;

  // Encontrar o primeiro separador que aparece
  for (const pattern of separators) {
    const match = cleanText.match(pattern);
    if (match && match.index !== undefined) {
      earliestPosition = Math.min(earliestPosition, match.index);
    }
  }

  // Se encontrou algum separador, pegar apenas o texto antes dele
  if (earliestPosition < cleanText.length) {
    cleanText = cleanText.substring(0, earliestPosition).trim();
  }

  // Remover linhas que começam com ">" (citações)
  const lines = cleanText.split('\n');
  const nonQuotedLines = lines.filter(line => !line.trim().startsWith('>'));
  cleanText = nonQuotedLines.join('\n').trim();

  // Remover múltiplas quebras de linha consecutivas
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n');

  return cleanText;
}

/**
 * Verifica novos emails no servidor IMAP
 * Processa emails não lidos
 */
export async function checkNewEmails(): Promise<void> {
  const startTime = Date.now();
  console.log(`[IMAP] 🚀 Iniciando verificação de emails... [${new Date().toLocaleString('pt-BR')}]`);

  const imapConfig = {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST || 'smtp.titan.email',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  };

  // Validar configuração
  if (!imapConfig.user || !imapConfig.password) {
    console.error('[IMAP] ❌ Credenciais IMAP não configuradas no .env');
    console.error('[IMAP]    Necessário: IMAP_USER e IMAP_PASSWORD');
    return;
  }

  console.log(`[IMAP] 📧 Host: ${imapConfig.host}:${imapConfig.port}`);
  console.log(`[IMAP] 👤 Usuário: ${imapConfig.user}`);

  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      console.log('[IMAP] ✅ Conectado ao servidor IMAP');

      imap.openBox('INBOX', false, (err: any, box: any) => {
        if (err) {
          console.error('[IMAP] ❌ Erro ao abrir INBOX:', err);
          imap.end();
          reject(err);
          return;
        }

        console.log('[IMAP] ✅ INBOX aberta');

        // Buscar apenas emails não lidos (UNSEEN)
        // Emails processados são marcados como lidos automaticamente
        imap.search(['UNSEEN'], (err: any, results: any) => {
          if (err) {
            console.error('[IMAP] ❌ Erro ao buscar emails:', err);
            imap.end();
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('[IMAP] 📭 Nenhum email novo encontrado');
            imap.end();
            const duration = Date.now() - startTime;
            console.log(`[IMAP] ⏱️  Verificação concluída em ${duration}ms`);
            resolve();
            return;
          }

          console.log(`[IMAP] 📨 Encontrados ${results.length} emails não lidos`);

          const fetch = imap.fetch(results, { bodies: '', markSeen: true });
          let processedCount = 0;
          const emailPromises: Promise<void>[] = [];

          fetch.on('message', (msg: any) => {
            msg.on('body', (stream: any) => {
              const emailPromise = simpleParser(stream).then(async (parsed: any) => {
                try {
                  const email: ParsedEmail = {
                    messageId: parsed.messageId || `no-id-${Date.now()}`,
                    from: parsed.from?.value?.[0]?.address || '',
                    to: parsed.to?.value?.[0]?.address || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    inReplyTo: parsed.inReplyTo || undefined,
                  };

                  console.log(`[IMAP] 📧 Processando email:`);
                  console.log(`[IMAP]    De: ${email.from}`);
                  console.log(`[IMAP]    Para: ${email.to}`);
                  console.log(`[IMAP]    Assunto: ${email.subject}`);
                  console.log(`[IMAP]    Message-ID: ${email.messageId}`);
                  if (email.inReplyTo) {
                    console.log(`[IMAP]    In-Reply-To: ${email.inReplyTo}`);
                  }

                  await processEmail(email);
                  processedCount++;
                  console.log(`[IMAP]    ✅ Email marcado como lido no servidor`);
                } catch (error) {
                  console.error('[IMAP] ❌ Erro ao processar email:', error);
                }
              });

              emailPromises.push(emailPromise);
            });
          });

          fetch.once('error', (err: any) => {
            console.error('[IMAP] ❌ Erro no fetch:', err);
            reject(err);
          });

          fetch.once('end', async () => {
            console.log('[IMAP] ⏳ Aguardando processamento de todos os emails...');
            
            try {
              await Promise.all(emailPromises);
              console.log(`[IMAP] ✅ Processados ${processedCount} emails`);
            } catch (error) {
              console.error('[IMAP] ❌ Erro ao processar emails:', error);
            }

            imap.end();
            const duration = Date.now() - startTime;
            console.log(`[IMAP] ⏱️  Verificação concluída em ${duration}ms`);
            resolve();
          });
        });
      });
    });

    imap.once('error', (err: any) => {
      console.error('[IMAP] ❌ Erro de conexão IMAP:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('[IMAP] 🔌 Conexão IMAP encerrada');
    });

    imap.connect();
  });
}

/**
 * Processa um email individual
 * - Verifica se já foi processado
 * - Busca contato correspondente
 * - Se for resposta, vincula à mensagem original
 * - Salva no CheckMail
 */
async function processEmail(email: ParsedEmail): Promise<void> {
  try {
    // Verificar se já foi processado
    const existente = await prisma.checkMail.findUnique({
      where: { messageId: email.messageId },
    });

    if (existente) {
      console.log(`[IMAP]    ⏭️  Email já processado anteriormente`);
      return;
    }

    // Extrair domínio do email para buscar contato
    const emailDomain = email.from.split('@')[1];
    
    // Buscar contato pelo email
    let contato = await prisma.contato.findFirst({
      where: { email: email.from },
    });

    if (!contato) {
      console.log(`[IMAP]    ⚠️  Contato não encontrado para: ${email.from}`);
    } else {
      console.log(`[IMAP]    ✅ Contato encontrado: ${contato.nome}`);
    }

    let salvo = false;
    let contatoId: string | null = null;

    // Se é uma resposta (tem In-Reply-To)
    if (email.inReplyTo) {
      console.log(`[IMAP]    ↩️  Email é uma resposta`);

      // Se encontrou contato, criar mensagem
      if (contato) {
        try {
          // Buscar a mensagem original pelo Message-ID
          // Como pode ser que o Message-ID não esteja armazenado, usar heurística
          // Buscar últimas mensagens do contato
          const mensagensRecentes = await prisma.mensagem.findMany({
            where: {
              contatoId: contato.id,
              respostaParaId: null, // Apenas mensagens originais
            },
            orderBy: { criado_em: 'desc' },
            take: 5,
          });

          if (mensagensRecentes.length > 0) {
            // Vincular à mensagem mais recente
            const mensagemOriginal = mensagensRecentes[0];
            
            // Limpar o texto da resposta, removendo histórico de conversação
            const textoLimpo = extractCurrentReply(email.text);
            console.log(`[IMAP]    🧹 Texto original: ${email.text.length} caracteres`);
            console.log(`[IMAP]    ✨ Texto limpo: ${textoLimpo.length} caracteres`);
            
            await prisma.mensagem.create({
              data: {
                contatoId: contato.id,
                assunto: email.subject,
                texto: textoLimpo,
                respostaParaId: mensagemOriginal.id,
                remetente: Remetente.FROM_CONTACT,
                lido: false,
              },
            });

            console.log(`[IMAP]    📝 Mensagem criada e vinculada a: ${mensagemOriginal.id}`);
            salvo = true;
            contatoId = contato.id;
          } else {
            console.log(`[IMAP]    ⚠️  Nenhuma mensagem original encontrada para vincular`);
          }
        } catch (error) {
          console.error('[IMAP]    ❌ Erro ao criar mensagem:', error);
        }
      }
    }

    // Registrar no CheckMail
    await prisma.checkMail.create({
      data: {
        messageId: email.messageId,
        emailFrom: email.from,
        emailTo: email.to,
        inReplyTo: email.inReplyTo || null,
        salvo,
        contatoId: contatoId,
      },
    });

    if (salvo) {
      console.log(`[IMAP]    ✅ Salvo no CheckMail (vinculado ao contato)`);
    } else {
      console.log(`[IMAP]    ⚠️  Salvo no CheckMail (não processado como mensagem)`);
    }
  } catch (error) {
    console.error('[IMAP]    ❌ Erro ao processar email:', error);
    throw error;
  }
}
