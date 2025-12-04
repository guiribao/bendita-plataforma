# Mudanças na Constraint Única de Telefone em Contato

## Resumo das Mudanças

Foi removida a constraint única do campo `telefone` na tabela `Contato` e adicionada uma constraint composta de `(email, telefone)`. Isso permite que contatos com o mesmo telefone sejam adicionados se tiverem emails diferentes, enquanto mantém a unicidade da combinação.

## Alterações Realizadas

### 1. **Prisma Schema** (`prisma/schema.prisma`)

**Antes:**
```prisma
model Contato {
  id            String     @id @default(uuid())
  nome          String
  email         String?
  telefone      String     @unique  // ❌ Constraint única apenas em telefone
  criado_em     DateTime   @default(now()) @db.Timestamptz()
  atualizado_em DateTime   @updatedAt @db.Timestamptz()
  Mensagens     Mensagem[]
  CheckMails    CheckMail[]
}
```

**Depois:**
```prisma
model Contato {
  id            String     @id @default(uuid())
  nome          String
  email         String?
  telefone      String
  criado_em     DateTime   @default(now()) @db.Timestamptz()
  atualizado_em DateTime   @updatedAt @db.Timestamptz()
  Mensagens     Mensagem[]
  CheckMails    CheckMail[]

  @@unique([email, telefone])  // ✅ Constraint composta
}
```

### 2. **Migration SQL** (`prisma/migrations/20251204090627_remove_unique_telefone/migration.sql`)

```sql
-- DropIndex
DROP INDEX IF EXISTS "Contato_telefone_key";

-- AlterTable - Add unique constraint on (email, telefone)
ALTER TABLE "Contato" ADD CONSTRAINT "Contato_email_telefone_key" UNIQUE ("email", "telefone");
```

### 3. **Lógica de Criação de Contato** (`app/routes/contato.tsx`)

Atualizada a função `action` para implementar a seguinte lógica:

1. **Buscar contato existente** pela combinação email + telefone
2. **Se não existir:**
   - Tenta criar novo contato
   - Se falhar por duplicação (código P2002), busca o contato existente
   - Atualiza apenas o **nome** do contato existente
3. **Se já existir:**
   - Atualiza o **nome** do contato
4. **Em ambos os casos:**
   - Cria a mensagem vinculada ao contato

#### Benefícios:
- ✅ Permite múltiplos contatos com mesmo telefone (emails diferentes)
- ✅ Atualiza o nome automaticamente se for um contato duplicado
- ✅ Garante idempotência - múltiplos envios não causam erro
- ✅ Mantém a integridade dos dados com constraint composta

## Exemplos de Uso

### Antes (Bloqueado)
```
Contato 1: João Silva | 11987654321 | joao@email.com
Contato 2: Maria Silva | 11987654321 | maria@email.com ❌ Erro - telefone duplicado
```

### Depois (Permitido)
```
Contato 1: João Silva | 11987654321 | joao@email.com
Contato 2: Maria Silva | 11987654321 | maria@email.com ✅ Permitido

Contato 3: João Silva | 11987654321 | joao@email.com ❌ Erro - email + telefone duplicado (atualiza nome)
```

## Tabela de Testes

| Caso | Email | Telefone | Resultado |
|------|-------|----------|-----------|
| 1 | novo@email.com | 11987654321 | ✅ Cria novo |
| 2 | novo@email.com | 11987654321 | ✅ Atualiza nome, cria mensagem |
| 3 | outro@email.com | 11987654321 | ✅ Cria novo (mesmo telefone) |
| 4 | outro@email.com | 11987654321 | ✅ Atualiza nome, cria mensagem |

## Validação

- ✅ Build executado com sucesso
- ✅ Migration aplicada com sucesso
- ✅ Nenhum erro de TypeScript
- ✅ Lógica de duplicação implementada com tratamento de erro P2002
