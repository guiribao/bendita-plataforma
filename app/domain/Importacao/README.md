# Importação de Pessoas via XLSX

## Funcionalidade

Este módulo permite a importação em massa de pessoas (usuários + perfis + associados) através de um arquivo XLSX.

## Como usar

1. Acesse `/app/gente` e clique no botão "Importar"
2. Selecione um arquivo XLSX com as colunas especificadas abaixo
3. Aguarde o processamento
4. Visualize o relatório de sucesso/erros

## Formato do Arquivo

O arquivo XLSX deve conter as seguintes colunas (na ordem exata):

### Dados Pessoais
- **Associado**: Identificador do associado
- **Carimbo de data/hora**: Data e hora do cadastro
- **Endereço de e-mail**: Email do usuário (será usado para login)
- **Nome**: Nome completo
- **CPF**: CPF do associado
- **RG**: RG do associado
- **Anexar documento de identificação**: URL do Google Drive com documento de identificação
- **Data do nascimento**: Data de nascimento (formato DD/MM/YYYY ou número serial do Excel)
- **SEXO**: Sexo (Masculino ou Feminino)
- **Endereço completo (Endereço, bairro, cidade, estado e CEP)**: Endereço completo separado por vírgulas
- **Comprovante de Residência (conta de água, luz ou telefone)**: URL do Google Drive com comprovante
- **Telefone/Whatsapp**: Telefone de contato
- **Email**: Email alternativo (se diferente do email de login)

### Dados da Associação
- **Quem indicou a Bendita Associação Canábica?**: Nome de quem indicou
- **Tipo de Associado**: MEDICINAL ou APOIADOR
- **Quadro geral de saúde - Descreva os diagnósticos de patologias existentes**: Descrição do quadro de saúde
- **Usa alguma medicação?**: Sim ou Não
- **Se usa alguma medicação escreva aqui o(s) nome(s)**: Nomes dos medicamentos
- **Já fez uso terapêutico com a cannabis?**: Sim ou Não
- **Caso já tenha feito uso terapêutico faça um breve relato da sua experiência**: Relato da experiência
- **É acompanhado por médico prescritor de cannabis?**: Sim ou Não
- **Se é acompanhado por médico prescritor, qual o nome e CRM do profissional?**: Nome e CRM do médico
- **Se você já tem receita médica para uso da cannabis medicinal anexe aqui**: URL do Google Drive com receita
- **Se você possui autorização da ANVISA para importação anexe aqui**: URL do Google Drive com autorização

### Dados do Responsável (opcional - para dependentes)
- **Nome do responsável - aplicável para o caso de pacientes menores de idade e com doenças neurodegenerativas**: Nome completo do responsável
- **CPF do Responsável**: CPF do responsável
- **RG do Responsável**: RG do responsável
- **Anexe RG do responsável**: URL do Google Drive com RG
- **Sexo do Responsável**: Masculino ou Feminino
- **Data de nascimento do responsável**: Data de nascimento (formato DD/MM/YYYY)
- **Endereço completo do responsável (Endereço, bairro, cidade, estado e CEP**: Endereço completo
- **Telefone do responsável com DDD**: Telefone do responsável
- **E-mail do responsável**: Email do responsável

## Processo de Importação

Para cada linha do XLSX, o sistema:

1. **Valida os dados obrigatórios** (Email, Nome, Data de nascimento)
2. **Cria o usuário** com papel ASSOCIADO e senha aleatória
3. **Cria o perfil** com todos os dados pessoais
4. **Cria a associação** com status ASSOCIADO e termo aceito
5. **Faz download dos documentos** do Google Drive e upload para S3
6. **Cria registros de documentos** vinculados ao associado
7. **Se houver responsável**, cria ou vincula o responsável
8. **Envia email de boas-vindas** com credenciais de acesso

## URLs do Google Drive

O sistema aceita URLs do Google Drive nos seguintes formatos:
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/open?id=FILE_ID`
- `https://drive.google.com/uc?id=FILE_ID`

Os arquivos serão automaticamente:
1. Baixados do Google Drive
2. Enviados para o bucket S3
3. Registrados no banco de dados com tipo apropriado

## Tipos de Documentos

Os documentos são classificados automaticamente como:
- **IDENTIFICACAO**: Documento de identificação (RG/CNH)
- **IDENTIFICACAO_RESPONSAVEL**: RG do responsável
- **COMPROVANTE_RESIDENCIA**: Comprovante de endereço
- **RECEITA_MEDICA**: Receita médica para cannabis
- **AUTORIZACAO_ANVISA**: Autorização da ANVISA

## Tratamento de Erros

O sistema continua processando mesmo em caso de erros individuais:
- Erros em documentos não impedem a criação do usuário
- Erros no envio de email não impedem a criação
- Cada erro é registrado com informações da linha

## Relatório de Importação

Ao final, é exibido:
- Total de registros processados
- Quantidade de sucessos
- Lista de erros com:
  - Número da linha
  - Descrição do erro
  - Dados relevantes (nome, CPF, email)

## Responsáveis e Dependentes

Se houver dados de responsável preenchidos:
- O sistema marca o associado como dependente
- Cria ou vincula um responsável existente (por email)
- O responsável recebe email com suas credenciais (se for novo)
- A relação é estabelecida no campo `responsavelId` do Associado

## Segurança

- Senhas são geradas aleatoriamente (12 caracteres)
- Senhas são enviadas por email
- Usuários devem alterar a senha no primeiro acesso
- Todas as credenciais são hashadas com bcrypt
- Documentos são armazenados no S3 privado

## Exemplos de Valores

### Data de Nascimento
- `15/03/1990`
- `44623` (número serial do Excel)

### Sexo
- `Masculino` ou `Feminino`
- `M` ou `F`

### Endereço Completo
- `Rua das Flores, 123, Centro, São Paulo, SP, 01234-567`

### Tipo de Associado
- `Medicinal` ou `MEDICINAL`
- `Apoiador` ou `APOIADOR`

### Sim/Não
- `Sim`, `sim`, `SIM`
- `Não`, `não`, `NÃO`
