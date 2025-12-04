# Exemplos de Limpeza de Texto de Email

## Função: `extractCurrentReply()`

Esta função remove o histórico de conversação de emails, mantendo apenas a resposta atual do usuário.

## Padrões Detectados

A função identifica e remove:

1. **Citações do Gmail (PT/EN)**
   - `Em dom., 3 de dez. de 2024 às 10:00, Nome <email> escreveu:`
   - `On Sun, Dec 3, 2024 at 10:00 AM, Name <email> wrote:`

2. **Cabeçalhos de Email Anterior**
   - `De: Nome <email@exemplo.com>`
   - `From: Name <email@example.com>`

3. **Linhas de Separação**
   - `---` (três ou mais hífens)
   - `___` (três ou mais underlines)

4. **Citações com ">"**
   - `> Texto citado da mensagem anterior`
   - `>> Texto citado aninhado`

5. **Assinaturas de Dispositivos Móveis**
   - `Enviado do meu iPhone`
   - `Sent from my iPhone`

6. **Marcadores de Email Encaminhado**
   - `-------- Mensagem original --------`
   - `-------- Original Message --------`

## Exemplos de Uso

### Exemplo 1: Gmail PT

**Entrada:**
```
Obrigado pela resposta! Vou providenciar os documentos.

Em dom., 3 de dez. de 2024 às 10:00, Bendita Canábica <contato@benditacanabica.com.br> escreveu:
> Olá! Para prosseguir com sua associação, precisamos dos seguintes documentos:
> - RG
> - CPF
> - Comprovante de residência
```

**Saída:**
```
Obrigado pela resposta! Vou providenciar os documentos.
```

### Exemplo 2: Outlook

**Entrada:**
```
Sim, posso enviar ainda hoje.

Atenciosamente,
João Silva

De: Bendita Canábica <contato@benditacanabica.com.br>
Enviado: quarta-feira, 4 de dezembro de 2024 09:00
Para: João Silva
Assunto: Re: Documentação pendente

Você consegue enviar os documentos até amanhã?
```

**Saída:**
```
Sim, posso enviar ainda hoje.

Atenciosamente,
João Silva
```

### Exemplo 3: Citações com ">"

**Entrada:**
```
Entendi, vou verificar essas informações.

> Em 03/12/2024, você escreveu:
> > Precisamos confirmar seus dados cadastrais.
> > Por favor, verifique se estão corretos.
```

**Saída:**
```
Entendi, vou verificar essas informações.
```

### Exemplo 4: iPhone

**Entrada:**
```
Perfeito! Obrigado pelo esclarecimento.

Enviado do meu iPhone
```

**Saída:**
```
Perfeito! Obrigado pelo esclarecimento.
```

## Benefícios

1. **Interface Limpa**: Conversas mais legíveis sem repetição
2. **Economia de Espaço**: Menos dados armazenados no banco
3. **Melhor UX**: Foco apenas na mensagem nova do usuário
4. **Compatibilidade**: Funciona com Gmail, Outlook, Apple Mail, Thunderbird, etc.

## Logs de Debug

Quando um email é processado, você verá nos logs:

```
[IMAP]    🧹 Texto original: 450 caracteres
[IMAP]    ✨ Texto limpo: 87 caracteres
[IMAP]    📝 Mensagem criada e vinculada a: abc-123-xyz
```

Isso mostra quantos caracteres foram removidos do histórico.
