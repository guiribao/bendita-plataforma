# Sistema de Pagamentos

## Descrição
Sistema para controle de pagamentos mensais dos associados da Bendita Canábica.

## Modelo de Dados

### Tabela: `Pagamento`
```prisma
model Pagamento {
  id                 String   @id @default(uuid())
  associado          Associado @relation(fields: [associadoId], references: [id])
  associadoId        String
  data_pagamento     DateTime @default(now()) @db.Timestamptz()
  proximo_vencimento DateTime @db.Date
  valor              Decimal? @db.Decimal(10, 2)
  criado_em          DateTime @default(now()) @db.Timestamptz()
  atualizado_em      DateTime @updatedAt @db.Timestamptz()

  @@index([associadoId])
  @@index([proximo_vencimento])
}
```

**Campos:**
- `id`: Identificador único do pagamento
- `associadoId`: Referência ao associado que fez o pagamento
- `data_pagamento`: Data em que o pagamento foi registrado
- `proximo_vencimento`: Data do próximo vencimento (data atual + 30 dias)
- `valor`: Valor do pagamento (opcional)
- `criado_em`: Data de criação do registro
- `atualizado_em`: Data da última atualização

**Índices:**
- `associadoId`: Para buscar pagamentos por associado
- `proximo_vencimento`: Para buscar pagamentos por vencimento

## Fluxo de Trabalho

### 1. Criação de Associado
Quando um associado é criado (cadastro público, importação ou criação manual pelo admin):
- Status inicial: `AGUARDANDO_PAGAMENTO`
- Nenhum pagamento é criado automaticamente

### 2. Registro de Pagamento
**Quem pode registrar:** Apenas ADMIN e SECRETARIA

**Como funciona:**
1. Admin acessa a lista de pessoas em `/app/gente`
2. Para associados sem pagamento vigente: aparece botão com ícone de cifrão
3. Ao clicar no botão:
   - Cria um registro de pagamento com vencimento em 30 dias
   - O botão é substituído por um ícone de check verde

**Endpoint:** `POST /app/gente/:id/pagamento`

### 3. Visualização de Status
Na listagem de pessoas:
- **Pago (vigente)**: Ícone de check verde (`las la-check-circle`)
- **Vencido ou sem pagamento**: Botão para registrar pagamento (`las la-dollar-sign`)
- **Não associado**: Traço (`-`)

## Funções Disponíveis

### `registrarPagamento(associadoId)`
Registra um pagamento para um associado.

**Parâmetros:**
- `associadoId`: ID do associado

**Retorno:** Objeto Pagamento ou null em caso de erro

**Comportamento:**
- Define próximo vencimento como data atual + 30 dias
- Cria novo registro de pagamento

### `verificarPagamentoVigente(associadoId)`
Verifica se existe pagamento vigente para um associado.

**Parâmetros:**
- `associadoId`: ID do associado

**Retorno:** `boolean` (true se existe pagamento não vencido, false caso contrário)

## Permissões

| Ação | ADMIN | SECRETARIA | SAUDE | ASSOCIADO |
|------|-------|------------|-------|-----------|
| Registrar pagamento | ✅ | ✅ | ❌ | ❌ |
| Visualizar status | ✅ | ✅ | ❌ | ❌ |

## Migrações

Após criar ou modificar o schema, execute:

```bash
npx prisma migrate dev --name add-pagamento-table
npx prisma generate
```

## Exemplos de Uso

### Registrar pagamento
```typescript
import registrarPagamento from '~/domain/Pagamento/registrar-pagamento.server';

// Registra pagamento com vencimento em 30 dias
const pagamento = await registrarPagamento('associado-uuid-123');
```

### Verificar se está pago (vigente)
```typescript
import verificarPagamentoVigente from '~/domain/Pagamento/verificar-pagamento-mes.server';

const estaPago = await verificarPagamentoVigente('associado-uuid-123');
```
```typescript
import registrarPagamento from '~/domain/Pagamento/registrar-pagamento.server';

const janeiro2025 = new Date('2025-01-01');
const pagamento = await registrarPagamento('associado-uuid-123', janeiro2025);
```

## Observações

- O sistema normaliza automaticamente o mês de referência para o primeiro dia do mês
- Não é possível ter dois pagamentos para o mesmo associado no mesmo mês (constraint unique)
- O campo `valor` é opcional e pode ser usado futuramente para controle financeiro
- Todos os registros de pagamento ficam permanentemente armazenados
