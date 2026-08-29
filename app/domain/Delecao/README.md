# Deleção em cascata

O banco não tem foreign keys: o schema usa `relationMode = "prisma"`, então quem
garante integridade referencial é o Prisma Client. Isso tem duas consequências
práticas:

1. O schema declara `onDelete: Cascade` / `SetNull` e o Prisma emula o
   comportamento no client — é a rede de segurança.
2. Ainda assim a deleção precisa ser explícita neste módulo, porque só aqui dá
   para remover os **arquivos físicos** do `storage-private` e **devolver a
   quantidade** de remessa dos interesses aprovados.

## Ordem e transação

Toda deleção altera o banco dentro de `prisma.$transaction` e só depois apaga os
arquivos do disco. Se a transação falhar, nada sai do storage — o inverso deixaria
registros apontando para arquivos que não existem mais.

## O que cada função arrasta

| Função | Arrasta junto |
| --- | --- |
| `deletarDocumento` | links temporários + arquivo em disco |
| `deletarPagamento` | nada |
| `deletarInteresse` | devolve a quantidade à remessa se estava aprovado |
| `deletarRemessa` | interesses vinculados |
| `deletarContato` | mensagens; o `CheckMail` perde o vínculo mas é preservado |
| `deletarAssociado` | documentos (+ arquivos), pagamentos, interesses |
| `deletarPerfilCompleto` | associação, dependentes (perfil + usuário de cada um), tokens de senha, links temporários, perfil e usuário |

`deletarPerfilCompleto` **não** apaga os documentos que o perfil enviou para
outras pessoas: eles só perdem o `criadoPorId`.

## Por que o link temporário quebrava a deleção

`LinkTemporarioDocumento.documento` é relação obrigatória. Sem apagar os links
antes, o Prisma recusa com `P2014` e a deleção do perfil inteiro falha no meio.
É o que `apagarDocumentos` resolve.

## Permissões

A matriz de quem pode deletar o quê está em
[`app/secure/delete-permissions.server.ts`](../../secure/delete-permissions.server.ts).

## Deploy

O schema mudou (ganhou `onDelete`), mas **não há migration**: `relationMode = "prisma"`
não cria foreign keys, então o banco não muda. O que precisa acontecer no servidor
é regenerar o client:

```sh
npx prisma generate && npm run build
```

Sem isso a rede de segurança do schema não vale — as funções deste módulo continuam
funcionando, porque a deleção é explícita.
