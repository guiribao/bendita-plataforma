# Sistema de Gestão de Medicação

## Descrição
Sistema completo para gerenciamento de remessas de medicação e manifestação de interesses por parte dos associados.

## Modelos de Dados

### Tabela: `Remessa`
```prisma
model Remessa {
  id                    String      @id @default(uuid())
  nome                  String
  descricao             String?     @db.Text
  quantidade_total      Int
  quantidade_disponivel Int
  valor_unitario        Decimal?    @db.Decimal(10, 2)
  data_limite           DateTime    @db.Date
  ativa                 Boolean     @default(true)
  criado_por_id         Int
  criado_em             DateTime    @default(now()) @db.Timestamptz()
  atualizado_em         DateTime    @updatedAt @db.Timestamptz()
  
  Interesses            Interesse[]
  
  @@index([ativa])
  @@index([data_limite])
}
```

**Campos:**
- `id`: Identificador único da remessa
- `nome`: Nome/título da remessa
- `descricao`: Descrição detalhada (opcional)
- `quantidade_total`: Quantidade total de unidades disponíveis
- `quantidade_disponivel`: Quantidade ainda disponível (atualizada dinamicamente)
- `valor_unitario`: Valor por unidade (opcional, referência)
- `data_limite`: Data limite para manifestação de interesse
- `ativa`: Se a remessa está ativa
- `criado_por_id`: ID do usuário que criou (admin/secretaria/saúde)

### Tabela: `Interesse`
```prisma
model Interesse {
  id              String      @id @default(uuid())
  remessa         Remessa     @relation(fields: [remessaId], references: [id])
  remessaId       String
  associado       Associado   @relation(fields: [associadoId], references: [id])
  associadoId     String
  quantidade      Int
  observacao      String?     @db.Text
  aprovado        Boolean     @default(false)
  criado_em       DateTime    @default(now()) @db.Timestamptz()
  atualizado_em   DateTime    @updatedAt @db.Timestamptz()
  
  @@index([remessaId])
  @@index([associadoId])
  @@unique([remessaId, associadoId])
}
```

**Campos:**
- `id`: Identificador único do interesse
- `remessaId`: Referência à remessa
- `associadoId`: Referência ao associado (apenas responsáveis)
- `quantidade`: Quantidade de unidades solicitadas
- `observacao`: Observações do associado (opcional)
- `aprovado`: Status da aprovação (false = pendente, true = aprovado)

**Constraint:**
- `@@unique([remessaId, associadoId])`: Um associado pode demonstrar interesse apenas uma vez por remessa

## Fluxo de Trabalho

### 1. Criação de Remessa (Admin/Secretaria/Saúde)
1. Acessa `/app/medicacao`
2. Clica em "Nova Remessa"
3. Preenche:
   - Nome
   - Descrição (opcional)
   - Quantidade total
   - Valor unitário (opcional)
   - Data limite
4. Remessa criada com `quantidade_disponivel = quantidade_total`

### 2. Manifestação de Interesse (Associados Responsáveis)
1. Acessa `/app/medicacao`
2. Visualiza remessas ativas
3. Clica em "Demonstrar Interesse"
4. Preenche quantidade e observações
5. Interesse registrado com `aprovado = false`

### 3. Gerenciamento de Interesses (Admin/Secretaria/Saúde)
1. Acessa detalhes da remessa em `/app/medicacao/:id`
2. Visualiza todos os interesses manifestados
3. Pode:
   - **Aprovar**: Marca como aprovado e decrementa `quantidade_disponivel`
   - **Reprovar**: Remove o interesse
   - **Cancelar aprovação**: Volta status para pendente e incrementa `quantidade_disponivel`

## Rotas Criadas

### `app.medicacao._index.tsx`
- **Acesso**: Todos os usuários autenticados
- **Funcionalidades**:
  - **Admin/Secretaria/Saúde**: 
    - Estatísticas (total remessas, interesses, aprovados, etc)
    - Listagem de remessas com cards
    - Botão "Nova Remessa"
    - Link para gerenciar cada remessa
  - **Associados**:
    - "Meus Interesses" (tabela com interesses manifestados)
    - Listagem de remessas disponíveis
    - Botão "Demonstrar Interesse"

### `app.medicacao.nova-remessa.tsx`
- **Acesso**: ADMIN, SECRETARIA, SAUDE
- **Funcionalidades**:
  - Formulário de criação de remessa
  - Validações de campos obrigatórios
  - Painel informativo lateral

### `app.medicacao.$id.interesse.tsx`
- **Acesso**: ASSOCIADO (apenas responsáveis)
- **Funcionalidades**:
  - Visualização detalhada da remessa
  - Formulário para manifestar interesse
  - Validações:
    - Quantidade máxima = `quantidade_disponivel`
    - Não pode demonstrar interesse duas vezes
    - Data limite não pode estar vencida

### `app.medicacao.$id.tsx`
- **Acesso**: ADMIN, SECRETARIA, SAUDE
- **Funcionalidades**:
  - Informações completas da remessa
  - Estatísticas dos interesses
  - Tabela de interesses com:
    - Dados do associado (nome, CPF, telefone)
    - Quantidade solicitada
    - Observações
    - Status (aprovado/pendente)
    - Ações (aprovar/reprovar/cancelar)

## Permissões

| Ação | ADMIN | SECRETARIA | SAUDE | ASSOCIADO |
|------|-------|------------|-------|-----------|
| Criar remessa | ✅ | ✅ | ✅ | ❌ |
| Ver detalhes remessa | ✅ | ✅ | ✅ | ❌ |
| Gerenciar interesses | ✅ | ✅ | ✅ | ❌ |
| Demonstrar interesse | ❌ | ❌ | ❌ | ✅ (apenas responsáveis) |
| Ver próprios interesses | ❌ | ❌ | ❌ | ✅ |

## Recursos Visuais

### Cards de Remessas
- Nome e descrição
- Badge de status (Ativa/Encerrada)
- Barra de progresso de disponibilidade
- Data limite com contador de dias
- Valor unitário (se informado)
- Contador de interesses
- Botões contextuais por perfil

### Estatísticas (Gestores)
- Total de remessas ativas
- Total de interesses
- Interesses aprovados
- Unidades disponíveis

### Meus Interesses (Associados)
- Tabela com todos os interesses manifestados
- Status de aprovação
- Quantidade solicitada
- Data de manifestação

## Validações Implementadas

### Criação de Remessa
- Nome obrigatório
- Quantidade total > 0
- Data limite obrigatória

### Manifestação de Interesse
- Quantidade > 0
- Quantidade ≤ `quantidade_disponivel`
- Associado não pode ter interesse duplicado na mesma remessa
- Data limite não pode estar vencida
- Apenas associados responsáveis (não dependentes)

### Aprovação de Interesse
- Verifica disponibilidade antes de aprovar
- Atualiza `quantidade_disponivel` automaticamente
- Transações atômicas (Prisma `$transaction`)

## Migrações Necessárias

Após criar/modificar o schema, execute:

```bash
npx prisma migrate dev --name add-remessa-interesse-tables
npx prisma generate
```

## Exemplos de Uso

### Buscar remessas ativas com interesses
```typescript
const remessas = await prisma.remessa.findMany({
  where: { ativa: true },
  include: {
    Interesses: {
      include: {
        associado: {
          include: {
            perfil: true,
          },
        },
      },
    },
  },
});
```

### Aprovar interesse e atualizar quantidade
```typescript
await prisma.$transaction([
  prisma.interesse.update({
    where: { id: interesseId },
    data: { aprovado: true },
  }),
  prisma.remessa.update({
    where: { id: remessaId },
    data: {
      quantidade_disponivel: {
        decrement: quantidade,
      },
    },
  }),
]);
```

## Melhorias Futuras

- Sistema de notificações para associados quando interesse for aprovado/reprovado
- Histórico de remessas encerradas
- Relatórios de distribuição de medicação
- Exportação de dados em Excel/PDF
- Campo para rastreamento de lote/validade
- Sistema de filas quando houver mais interesses que disponibilidade
- Integração com sistema de pagamentos (cobrar valor da remessa)
