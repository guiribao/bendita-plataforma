# Sistema de Sincronização de Emails IMAP

## 📧 Overview

Sistema de cron job que monitora uma caixa de email (IMAP) para sincronizar automaticamente as respostas de clientes com a plataforma. Quando um cliente responde a um email, a resposta é automaticamente criada como mensagem na conversa dentro da plataforma.

## 🏗️ Arquitetura

### Componentes

1. **`app/services/imap.server.ts`** - Serviço IMAP
   - Conecta à caixa de email via IMAP
   - Busca emails não lidos dos últimas 24h
   - Faz parse dos emails com `mailparser`
   - Extrai Message-ID, In-Reply-To, From, To
   - Registra na tabela `CheckMail`
   - Cria mensagens de resposta se `In-Reply-To` for encontrado

2. **`app/services/email-cron.server.ts`** - Cron Job
   - Usa `node-cron` para agendar execução
   - Schedule padrão: a cada 5 minutos (configurável)
   - Executa `checkNewEmails()` periodicamente
   - Logs com timestamp para debug

3. **`prisma/schema.prisma`** - Modelos
   - **CheckMail** - Registra todos os emails verificados
   - Campos: messageId (único), emailFrom, emailTo, inReplyTo, salvo, contatoId

4. **`app/root.tsx`** - Inicialização
   - Inicia o cron job no primeiro load
   - Garante que roda apenas uma vez

## 🗄️ Banco de Dados

### Tabela CheckMail

```sql
CREATE TABLE "CheckMail" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "messageId" TEXT NOT NULL UNIQUE,
  "emailFrom" TEXT NOT NULL,
  "emailTo" TEXT NOT NULL,
  "inReplyTo" TEXT,
  "salvo" BOOLEAN NOT NULL DEFAULT false,
  "contatoId" TEXT,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CheckMail_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "Contato" ("id")
);
```

## 🔧 Configuração

### Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Email IMAP Configuration
IMAP_USER=seu_email@benditacanabica.com.br
IMAP_PASSWORD=sua_senha_imap
IMAP_HOST=smtp.titan.email
IMAP_PORT=993

# Cron Schedule (padrão: a cada 5 minutos)
CRON_EMAIL_SCHEDULE=*/5 * * * *
```

### Formatos de Cron Comuns

- `* * * * *` - A cada minuto
- `*/5 * * * *` - A cada 5 minutos (padrão)
- `*/15 * * * *` - A cada 15 minutos
- `0 * * * *` - A cada hora
- `0 0 * * *` - Diariamente à meia-noite

## 🔄 Fluxo de Funcionamento

```
1. Servidor Remix inicia
   ↓
2. root.tsx executa loader
   ↓
3. startEmailCron() é chamado
   ↓
4. node-cron agenda execução periódica
   ↓
5. A cada 5 minutos (ou conforme CRON_EMAIL_SCHEDULE):
   ├─ Conecta ao IMAP
   ├─ Busca emails não lidos (últimas 24h)
   ├─ Para cada email:
   │  ├─ Faz parse (Subject, From, Body, Headers)
   │  ├─ Extrai Message-ID e In-Reply-To
   │  ├─ Registra em CheckMail
   │  ├─ Se In-Reply-To:
   │  │  ├─ Busca contato pelo email
   │  │  ├─ Busca mensagem original
   │  │  ├─ Cria resposta no banco
   │  │  └─ Marca salvo = true
   │  └─ Marca email como lido
   └─ Encerra conexão
```

## 📊 Tabela CheckMail

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único |
| messageId | String | Message-ID do email (único) |
| emailFrom | String | Email do remetente |
| emailTo | String | Email destinatário |
| inReplyTo | String? | Message-ID que está respondendo |
| salvo | Boolean | Se foi processado como mensagem |
| contatoId | String? | FK para Contato |
| criado_em | DateTime | Quando foi registrado |
| atualizado_em | DateTime | Última atualização |

## 📝 Exemplo de Uso

### 1. Cliente recebe resposta

```
Email enviado via Bendita:
├─ To: cliente@email.com
├─ Subject: Resposta sua solicitação
├─ Message-ID: <bendita-12345@benditacanabica.com.br>
└─ Body: Sua resposta aqui...
```

### 2. Cliente responde

```
Email do cliente:
├─ From: cliente@email.com
├─ To: contato@benditacanabica.com.br
├─ Subject: Re: Resposta sua solicitação
├─ In-Reply-To: <bendita-12345@benditacanabica.com.br>
└─ Body: Obrigado, isso resolveu!
```

### 3. Sistema processa

```
Cron job executa:
1. Conecta IMAP
2. Encontra email do cliente
3. Extrai In-Reply-To = <bendita-12345@benditacanabica.com.br>
4. Registra em CheckMail com salvo = false
5. Busca contato pelo email (cliente@email.com)
6. Busca mensagem original (Message-ID = bendita-12345)
7. Cria Mensagem com respostaParaId
8. Marca salvo = true
9. Na plataforma, aparece a resposta do cliente
```

## 🐛 Logs

O sistema gera logs detalhados:

```
[CRON] Iniciando verificação de emails às 2025-12-04T08:30:00Z
[IMAP] Conectando ao servidor...
[IMAP] Encontrados 3 emails não lidos
[IMAP] Email <msg-123> é uma resposta para <bendita-12345>
[IMAP] Mensagem criada para contato abc-def-ghi
[IMAP] Email msg-123 registrado (salvo: true)
[CRON] Verificação de emails concluída
```

## 🔐 Segurança

- Credenciais IMAP no `.env` (nunca commitar!)
- TLS ativado por padrão
- Conexão encerrada após cada verificação
- Emails marcados como lidos após processamento

## ⚙️ Troubleshooting

### "Credenciais IMAP não configuradas"
- Verificar `.env`
- Garantir que `IMAP_USER` e `IMAP_PASSWORD` existem
- Não deixar comentários na mesma linha

### "Erro ao conectar IMAP"
- Verificar credenciais
- Verificar IMAP_HOST e IMAP_PORT
- Testar conexão manualmente
- Verificar firewall/proxy

### "Email não está sendo sincronizado"
- Verificar logs do servidor
- Verificar se In-Reply-To está sendo enviado pelo cliente
- Verificar se contato existe no banco
- Verificar tabela CheckMail

## 🚀 Próximos Passos

- [ ] Adicionar retry automático para falhas
- [ ] Adicionar sincronização de anexos
- [ ] Webhook para Sendgrid/Mailgun (mais robusto)
- [ ] Interface de admin para visualizar CheckMail
- [ ] Alertas de falha de sincronização
