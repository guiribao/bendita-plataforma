# Relatório da suíte de testes de integração

Data da execução: 27/08/2026 · ambiente local (`bendita_local`)

## O que foi feito

Foi criada uma suíte de integração que sobe o build do Remix dentro do processo
de teste e dispara requisições HTTP reais contra o handler da aplicação —
documentos, submits de formulário e uploads multipart, com jar de cookies por
sessão. Cada teste percorre a rota inteira: loader, action, autenticação,
autorização, gravação de arquivo e persistência no Postgres.

Não há browser envolvido. O que é validado é o servidor inteiro, que é onde
moram as regras de cadastro, pagamento, documento e permissão.

```
181 testes · 170 passando · 11 falhando
```

As 11 falhas não são instabilidade da suíte: são **4 defeitos reais** da
aplicação, descritos abaixo. Os testes descrevem o comportamento correto e
seguem vermelhos de propósito até que os defeitos sejam corrigidos.

## Cobertura

| Suíte | O que cobre |
| --- | --- |
| `01-paginas-publicas` | Home, sobre, serviços, conhecimento, contato, login, 404; formulário de contato (validação, gravação, reaproveitamento de contato) |
| `02-cadastro` | Fluxo associativo completo: básico → responsável → documentos → saúde → termos; menor de idade, duplicidade de e-mail/CPF, data inválida, proteção contra chaves cruzadas entre etapas, formatos e tamanhos de arquivo |
| `03-autenticacao` | Login, senha errada, e-mail inexistente, logout, recuperação de senha (token, expiração, reuso, troca efetiva), guarda da área restrita, trava do termo associativo |
| `04-area-associado` | Termo associativo, dashboard, perfil, edição de perfil (pessoal, endereço, redes, saúde), upload de documentos, interesse em remessas, financeiro |
| `05-area-administrativa` | Pessoas: listagem, detalhe, criação, edição, exclusão em cascata; pagamentos (mensalidade, taxa, tarifa social, bloqueio no mês), aprovação de associado, exportação PDF, importação XLSX |
| `06-documentos-medicacao-contatos` | Links privados de documento (emissão, expiração, vínculo com usuário, matriz de permissão), remessas, aprovação/reprovação de interesses, contatos e respostas, painel IMAP |
| `07-permissoes` | Matriz de acesso por papel declarada em `app/secure/permissions.ts` |

## Defeitos encontrados

### 1. Guarda de autorização por papel nunca bloqueia — crítico

**8 testes falhando** em `07-permissoes`.

`PaginasAbertas` em [app/secure/permissions.ts:8](../app/secure/permissions.ts#L8)
contém a entrada `"/"`, e o `canAccess` em
[app/secure/authorization.ts:22](../app/secure/authorization.ts#L22) compara com
`pathname.includes(e)`. Como todo caminho contém `"/"`, a busca sempre encontra
um resultado e `canAccess` **sempre retorna verdadeiro**:

```js
'/app/gente'.includes('/')   // true  → considerada "página aberta"
'/app/imap'.includes('/')    // true  → considerada "página aberta"
```

Consequência: o redirecionamento para `/app/autorizacao` no loader de
[app/root.tsx](../app/root.tsx) nunca dispara. Toda a matriz de
`PaginasPorPapel` é letra morta.

Verificado nos testes:

- `ASSOCIADO` abre `/app/gente` e `/app/contatos` — a base inteira de pessoas e
  as mensagens de contato.
- `ASSOCIADO` abre `/app/gente/novo` e `/app/gente/importar`.
- `ASSOCIADO` **exclui o perfil de outra pessoa** via `POST /app/gente/{id}/deletar`
  (a rota só checa autenticação, não papel).
- `ASSOCIADO` **edita o perfil de outra pessoa** via `POST /app/gente/{id}/editar`,
  incluindo trocar o campo `papel` — ou seja, escalar a si mesmo para `ADMIN`.
- `SAUDE` abre `/app/financeiro`; `SECRETARIA` abre `/app/medicacao`.

As rotas que também checam papel dentro da própria action seguem protegidas
(pagamentos, remessas, contatos, IMAP, upload de documento do associado) — isso
está coberto e passando. O buraco está nas rotas que confiavam apenas no guarda
central.

Correção sugerida: remover `"/"` de `PaginasAbertas` e trocar o
`pathname.includes(e)` por comparação exata (com tratamento à parte para a
home), além de repetir a checagem de papel nas actions de
`app.gente.$id.deletar` e `app.gente.$id.editar`.

### 2. Exportação de pessoas em PDF quebrada — alto

**1 teste falhando** em `05-area-administrativa`.

`GET /app/gente/exportar` devolve **500** sempre que existe alguém com data de
nascimento preenchida:

```
Erro ao gerar PDF: TypeError: perfil.data_nascimento.toISOString is not a function
```

A migração `20260311120000_change_perfil_data_nascimento_to_text` transformou
`Perfil.data_nascimento` em `String`, mas
[exportar-pessoas-pdf.server.ts:267](../app/domain/Exportacao/exportar-pessoas-pdf.server.ts#L267)
ainda trata o campo como `Date` (a tipagem local na linha 12 também segue `Date`).

### 3. Importação de planilha XLSX quebrada — alto

**1 teste falhando** em `05-area-administrativa`.

Mesma causa. `importar-pessoas.server.ts` monta `data_nascimento` como `Date` e
o Prisma rejeita linha a linha:

```
Argument `data_nascimento`: Invalid value provided. Expected String or Null, provided DateTime.
```

Ocorre em [linha 182](../app/domain/Importacao/importar-pessoas.server.ts#L182)
(associado) e [linha 322](../app/domain/Importacao/importar-pessoas.server.ts#L322)
(responsável). A rota responde 200 com "sucesso", mas **nenhuma pessoa é
importada** — a falha fica só no log.

### 4. Indicação não é gravada no cadastro público — médio

**1 teste falhando** em `02-cadastro`.

[cadastro.termos.tsx:65](../app/routes/cadastro.termos.tsx#L65) chama:

```js
await atualizarIndicacaoAssociado(nome_indicador, associadoId)
```

mas a assinatura da função é `(perfilId, indicadoPor, elegivelTarifaSocial?)`.
Os argumentos estão deslocados: o nome do indicador entra no lugar do `perfilId`,
a busca não encontra ninguém e a função sai silenciosamente:

```
Associado com perfilId Maria Indicadora não encontrado
```

Quem se cadastra pelo site informando quem indicou perde essa informação.
O mesmo erro está em [cadastro.concluido.tsx:67](../app/routes/cadastro.concluido.tsx#L67).
A chamada correta está em `app.gente.$id.editar.tsx:205`.

Vale notar que, além do argumento trocado, essa função sempre grava
`elegivel_tarifa_social: elegivelTarifaSocial ?? false` — então corrigir só a
ordem dos argumentos passaria a zerar a elegibilidade de tarifa social a cada
conclusão de cadastro. A correção precisa tratar os dois pontos.

## Observações que não viraram falha

- **`autentica.roles.tsx` referencia modelo inexistente.** A rota usa
  `Papel.FEIRANTE` e `prisma.evento_Feirante`, que não existem no schema atual.
  É código morto — nada na aplicação chama essa rota hoje — mas quebraria se
  fosse acionada.
- **`atualizarUsuarioDoPerfil` não existe.** `cadastro.tsx:95` chama uma função
  que nunca foi importada. O caminho é inalcançável na prática (o `if` anterior
  já retorna), mas é um `ReferenceError` esperando acontecer. O mesmo arquivo
  acessa `perfilSeExistir?.email` e `.usuario`, campos que o `Perfil` não tem.
- **`npx tsc` acusa ~30 erros** de tipagem pré-existentes. O build usa esbuild e
  não checa tipos, então isso não impede o deploy — mas foi por aí que os itens
  acima apareceram.
- **Troca de senha derruba para o login.** Depois de trocar a senha com sucesso,
  o loader roda de novo, encontra o token já invalidado e redireciona para
  `/autentica/entrar`. A tela de sucesso nunca aparece. Está coberto como
  comportamento atual em `03-autenticacao`.
- **Sem SMTP no ambiente local**, o envio de e-mail falha com `ECONNREFUSED`.
  A aplicação degrada bem em quase todos os pontos; a exceção é a resposta a
  contato, que devolve 500 mesmo tendo gravado a resposta no banco (coberto).

## Massa fake gerada

A suíte não limpa nada — os dados ficam em `bendita_local` para navegação.
Depois das execuções:

| Tabela | Registros |
| --- | --- |
| Usuario | 1103 |
| Perfil | 964 |
| Associado | 522 |
| Documentos | 114 |
| Pagamento | 40 |
| Remessa | 70 |
| Interesse | 40 |
| Contato | 35 |
| Mensagem | 45 |

Os arquivos de documento ficam em `storage-private/` (104 arquivos).

### Contas fixas para navegar

Criadas por `node scripts/seed-contas-locais.mjs`, senha `bendita123`:

| Papel | E-mail |
| --- | --- |
| ADMIN | `admin@bendita.test` |
| SECRETARIA | `secretaria@bendita.test` |
| SAUDE | `saude@bendita.test` |
| ASSOCIADO | `associado@bendita.test` |
