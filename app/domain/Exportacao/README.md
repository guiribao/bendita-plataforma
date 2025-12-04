# Exportação de Pessoas em PDF

## Funcionalidade

Este módulo permite a exportação completa de todos os dados das pessoas cadastradas em um arquivo PDF profissional, legível e bem organizado.

## Como usar

1. Acesse `/app/gente`
2. Clique no botão "Exportar PDF"
3. O PDF será gerado e o download iniciará automaticamente

## Estrutura do PDF

### Página 1: Resumo Estatístico

Tabela centralizada com todas as métricas:
- Total de Pessoas Cadastradas
- Associados
- Dependentes
- Administradores
- Secretaria
- Saúde
- Com Associação Ativa
- Tipo Medicinal
- Tipo Apoiador

### Páginas Seguintes: Detalhamento Completo

**Uma página por pessoa** com layout em caixas organizadas:

#### 1. Dados Pessoais (Esquerda)
- Email
- Papel no Sistema
- CPF
- RG
- Data de Nascimento
- Sexo
- Apelido
- Nacionalidade
- Estado Civil

#### 2. Contato (Direita)
- Telefone
- Instagram
- LinkedIn

#### 3. Endereço (Largura Total)
- Endereço completo formatado

#### 4. Informações da Associação (Esquerda)
- Tipo de Associado
- Status
- Indicado por
- Termo Aceito (com data)

#### 5. Documentos (Direita)
- Total de documentos
- Lista completa com:
  - Tipo do documento
  - Nome do arquivo

#### 6. Informações de Saúde (Largura Total)
- Quadro Geral de Saúde
- Usa Medicação (Sim/Não)
- Medicações (se aplicável)
- Uso Terapêutico de Cannabis (Sim/Não)
- Experiência com Cannabis (se aplicável)
- Acompanhado por Prescritor (Sim/Não)
- Médico Prescritor (nome e CRM se aplicável)

## Características Visuais

### Layout
- **Orientação**: Horizontal (Landscape)
- **Tamanho**: A4
- **Margens**: 30pt (superior/inferior) e 40pt (laterais)
- **Design**: Caixas organizadas com cabeçalhos coloridos

### Cores
- **Primária**: #9932cc (roxo)
- **Cabeçalhos**: Fundo roxo com texto branco
- **Linhas Alternadas**: Fundo cinza claro (#f9f9f9)
- **Textos**: Preto (#333) para valores, cinza (#666) para labels

### Tipografia
- **Fonte**: Helvetica (sem serifa, profissional)
- **Tamanhos**:
  - Título principal: 22pt
  - Subtítulos: 14pt
  - Cabeçalhos de seção: 10pt
  - Conteúdo: 8pt
  - Rodapé: 8pt

### Organização
- Caixas com bordas sutis
- Cabeçalhos coloridos para cada seção
- Fundos alternados para facilitar leitura
- Espaçamento consistente
- Informações agrupadas logicamente

## Codificação UTF-8

- ✅ Acentuação correta (ã, á, é, í, ó, ú, â, ê, ô, ç)
- ✅ Caracteres especiais preservados
- ✅ Sem emojis (removidos para compatibilidade)
- ✅ Texto totalmente legível

## Dados Incluídos

### ✅ Dados do Usuário
- Email
- Papel/Função
- Data de cadastro

### ✅ Dados do Perfil
- Nome completo
- Apelido
- CPF
- RG
- Data de nascimento
- Sexo
- Nacionalidade
- Estado civil
- Telefone
- Endereço completo (rua, número, complemento, bairro, cidade, estado, CEP)
- Redes sociais (Instagram, LinkedIn)

### ✅ Dados da Associação
- Tipo de associado
- Status
- Indicação
- Termo associativo (aceite e data)

### ✅ Dados de Saúde
- Quadro geral
- Uso de medicação
- Nomes das medicações
- Uso terapêutico de cannabis
- Experiência com uso terapêutico
- Acompanhamento por prescritor
- Nome e CRM do prescritor

### ✅ Documentos
- Tipo de cada documento
- Nome do arquivo
- Quantidade total

### ❌ Dados Excluídos
- Senha do usuário (segurança)

## Nome do Arquivo

Formato: `relatorio-pessoas-YYYY-MM-DDTHH-MM-SS.pdf`

Exemplo: `relatorio-pessoas-2025-12-03T21-30-45.pdf`

## Performance

- Geração sob demanda
- Buffer de páginas para eficiência
- Otimizado para grandes volumes
- Uma página por pessoa para clareza

## Segurança

- ✅ Apenas usuários autenticados podem exportar
- ✅ Senha nunca é incluída
- ✅ Dados sensíveis formatados adequadamente
- ✅ Arquivo gerado dinamicamente (não armazenado)
