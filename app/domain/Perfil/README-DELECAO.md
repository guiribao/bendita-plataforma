# Função de Deleção Completa de Perfil

## Descrição
Função robusta que deleta completamente um perfil e **todos** os seus dados relacionados do banco de dados e do storage local.

## Relacionamentos Tratados

### 1. **Perfil Principal**
- ✅ Usuário
- ✅ Perfil
- ✅ Associado (se existir)
- ✅ Tokens de recuperação de senha

### 2. **Dados do Associado**
- ✅ Documentos (arquivos locais + registros BD)
- ✅ Pagamentos
- ✅ Interesses em remessas
- ✅ Associação

### 3. **Dependentes**
Se o perfil for **responsável** por dependentes, deleta todos eles também:
- ✅ Perfis dos dependentes
- ✅ Usuários dos dependentes
- ✅ Associações dos dependentes
- ✅ Documentos dos dependentes (storage local + BD)
- ✅ Pagamentos dos dependentes
- ✅ Interesses dos dependentes

### 4. **Documentos Criados**
- ✅ Remove referência `criadoPorId` de documentos criados por este perfil

### 5. **Arquivos locais**
- ✅ Deleta todos os arquivos do próprio associado
- ✅ Deleta todos os arquivos dos dependentes
- ✅ Deleta arquivos criados por este perfil (evita duplicatas)

## Ordem de Deleção

A ordem é crucial para respeitar constraints de chave estrangeira:

```
1. Dependentes (se houver):
   ├─ Interesses do dependente
   ├─ Pagamentos do dependente
   ├─ Documentos do dependente
   ├─ Associação do dependente
   ├─ Perfil do dependente
   └─ Usuário do dependente

2. Associado Principal:
   ├─ Interesses
   ├─ Pagamentos
   ├─ Documentos
   └─ Associação

3. Referências:
   └─ Atualizar criadoPorId para null

4. Autenticação:
   └─ Tokens de recuperação de senha

5. Perfil e Usuário:
   ├─ Perfil
   └─ Usuário
```

## Logs Detalhados

A função registra cada etapa da deleção com timestamps:

```
[2025-12-04T10:30:00.000Z] Iniciando deleção do perfil: João Silva (uuid-123)
[2025-12-04T10:30:00.100Z] Total de arquivos locais a deletar: 5
[2025-12-04T10:30:01.200Z] Arquivos locais deletados: 5/5
[2025-12-04T10:30:01.300Z] Interesses deletados para dependente: uuid-456
[2025-12-04T10:30:01.400Z] Pagamentos deletados para dependente: uuid-456
...
```

## Retorno da Função

```typescript
{
  success: boolean,
  message: string
}
```

**Sucesso:**
```json
{
  "success": true,
  "message": "Perfil de João Silva e 2 dependente(s) foi deletado com sucesso, incluindo 8 arquivo(s)."
}
```

**Erro:**
```json
{
  "success": false,
  "message": "Erro ao deletar perfil: [detalhes do erro]"
}
```

## Uso

```typescript
import deletarPerfilCompleto from '~/domain/Perfil/deletar-perfil-completo.server';

const resultado = await deletarPerfilCompleto(perfilId);

if (resultado.success) {
  console.log(resultado.message);
  // Redirecionar para listagem
} else {
  console.error(resultado.message);
  // Mostrar erro ao usuário
}
```

## Segurança

### Interface do Usuário
Antes de chamar esta função, **sempre** confirmar com o usuário:

```typescript
if (!confirm(
  `Tem certeza que deseja deletar o perfil de ${nome}? ` +
  `Esta ação não pode ser desfeita e todos os dados, documentos e ` +
  `arquivos serão permanentemente removidos.`
)) {
  e.preventDefault();
  return;
}
```

### Permissões
- Apenas usuários autenticados
- Recomendado: Apenas ADMIN pode deletar perfis
- Adicionar validação de papel na rota se necessário

## Tratamento de Erros

A função captura e trata:
- ✅ Perfil não encontrado
- ✅ Erros de constraint de FK
- ✅ Erros de storage local
- ✅ Erros do Prisma são capturados e retornados ao chamador
- ✅ Logs detalhados para debugging

## Atomicidade e consistência

Esta operação **não é atômica**. As exclusões do banco são executadas em várias
chamadas sequenciais e a remoção dos arquivos locais ocorre antes delas. Se uma
etapa falhar, o banco pode ficar parcialmente excluído e pode haver arquivos
removidos sem registro correspondente, ou registros restantes sem arquivo.

Por isso, a função não oferece rollback. O chamador deve registrar a falha e
revisar os dados antes de repetir a operação. A remoção definitiva deve ser
tratada como uma operação administrativa irreversível.

## Melhorias Futuras

- [ ] Agrupar as exclusões do banco em uma transação do Prisma
- [ ] Soft delete (marcar como deletado ao invés de remover)
- [ ] Histórico de deleções
- [ ] Backup automático antes de deletar
- [ ] Fila assíncrona para deleções grandes
- [ ] Notificação por email ao usuário

## Notas Importantes

⚠️ **Esta ação é IRREVERSÍVEL**

- Todos os dados são permanentemente removidos
- Arquivos locais são deletados e não podem ser recuperados
- Dependentes também são deletados em cascata
- Não há backup automático

⚠️ **Performance**

- Para perfis com muitos dependentes/documentos, pode levar alguns segundos
- Considerar execução assíncrona para grandes volumes
- Monitorar logs do servidor para detectar problemas

⚠️ **Integridade de Dados**

- A ordem de deleção é crucial
- Constraints de FK são respeitadas
- Documentos de outros associados não são deletados (apenas a referência ao criador)
