# Testes de integração

Suíte de integração que sobe o build do Remix **dentro do processo de teste** e
dispara requisições HTTP reais (documentos e submits de formulário) contra o
handler da aplicação. Cada teste exercita a rota de ponta a ponta: loader,
action, sessão, upload de arquivo e persistência no Postgres.

Não há browser envolvido — o que é validado é todo o servidor, que é onde
moram as regras de cadastro, pagamento e permissão.

## Como rodar

```sh
npm test          # build + suíte completa
npm run test:only # só a suíte (usa o build já existente)

node --test tests/02-cadastro.test.mjs                 # um arquivo
node --test --test-name-pattern="pagamento" tests/     # por nome
```

## Banco

Os testes rodam contra o banco apontado por `DATABASE_URL` no `.env`
(`bendita_local`). Eles **não limpam nada**: a massa criada fica no banco,
servindo como dados fake para navegar na aplicação. Todo registro usa e-mail e
CPF únicos por execução, então rodar a suíte várias vezes não gera colisão.

Pré-requisitos: Postgres no ar e migrações aplicadas (`npx prisma migrate deploy`).

## E-mail e IMAP

`SMTP_HOST` não é configurado no ambiente local. O harness aponta o SMTP para
`127.0.0.1`, de modo que o envio falha imediatamente com `ECONNREFUSED` em vez
de pendurar o teste — é o mesmo caminho de erro que a aplicação percorre hoje
em local. O IMAP é desligado via `DISABLE_IMAP=true`.

Os logs de erro de SMTP que aparecem no meio da execução são esperados.

## Arquivos

| Arquivo | Cobertura |
| --- | --- |
| `helpers/harness.mjs` | Handler da app, cliente HTTP com cookies, geradores de massa fake |
| `01-paginas-publicas` | Páginas abertas, 404, formulário de contato |
| `02-cadastro` | Fluxo de associação: básico, responsável, documentos, saúde, termos |
| `03-autenticacao` | Login, logout, recuperação de senha, guarda da área restrita |
| `04-area-associado` | Termo associativo, dashboard, perfil, documentos, medicação, financeiro |
| `05-area-administrativa` | Pessoas (CRUD), pagamentos, aprovação, exclusão, exportação, importação |
| `06-documentos-medicacao-contatos` | Links privados de documento, remessas, interesses, contatos, IMAP |
| `07-permissoes` | Matriz de acesso por papel declarada em `app/secure/permissions.ts` |
| `08-upload-arquivos` | Limite de 15MB por anexo e compressão das imagens no servidor |
| `09-delecao` | Deleção em cascata (perfil, documento, remessa, contato) e matriz de permissão |

## Testes vermelhos

Alguns testes falham de propósito: eles descrevem o comportamento correto e
apontam defeitos existentes na aplicação. Estão documentados em
`../docs/RELATORIO-TESTES.md`.
