-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'ASSOCIADO', 'ASSOCIADO_DEPENDENTE', 'SECRETARIA', 'SAUDE');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('NAO_IDENTIFICADO', 'IDENTIFICACAO', 'IDENTIFICACAO_RESPONSAVEL', 'COMPROVANTE_RESIDENCIA', 'RECEITA_MEDICA', 'AUTORIZACAO_ANVISA');

-- CreateEnum
CREATE TYPE "TipoAssociado" AS ENUM ('APOIADOR', 'MEDICINAL');

-- CreateEnum
CREATE TYPE "AssociacaoStatus" AS ENUM ('AGUARDANDO_CADASTRO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_ASSINATURA', 'EM_ANALISE', 'ASSOCIADO');

-- CreateEnum
CREATE TYPE "TipoLogger" AS ENUM ('EMAIL');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" VARCHAR(100) NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'ASSOCIADO',
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario_Esqueci_Senha" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "valido_ate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Usuario_Esqueci_Senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "apelido" TEXT,
    "data_nascimento" DATE NOT NULL,
    "sexo" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "nacionalidade" TEXT,
    "estado_civil" TEXT,
    "cep" TEXT,
    "endereco_rua" TEXT,
    "endereco_numero" TEXT,
    "endereco_complemento" TEXT,
    "endereco_bairro" TEXT,
    "endereco_cidade" TEXT,
    "endereco_estado" TEXT,
    "telefone" TEXT,
    "redes_instagram" TEXT,
    "redes_linkedin" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Associado" (
    "id" TEXT NOT NULL,
    "saude_quadro_geral" TEXT,
    "saude_uso_medicacao" BOOLEAN NOT NULL DEFAULT false,
    "saude_uso_medicacao_nome" TEXT,
    "saude_uso_terapeutico_canabis" BOOLEAN NOT NULL DEFAULT false,
    "saude_uso_terapeutico_canabis_experiencia" TEXT,
    "saude_medico_prescritor" BOOLEAN NOT NULL DEFAULT false,
    "saude_medico_prescritor_nome" TEXT,
    "saude_medico_prescritor_crm" TEXT,
    "tipo_associado" "TipoAssociado" NOT NULL DEFAULT 'APOIADOR',
    "elegivel_tarifa_social" BOOLEAN NOT NULL DEFAULT false,
    "perfilId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "status" "AssociacaoStatus" NOT NULL DEFAULT 'AGUARDANDO_CADASTRO',
    "indicado_por" VARCHAR(64),
    "de_acordo_termo_associativo" BOOLEAN,
    "de_acordo_termo_associativo_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Associado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documentos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL DEFAULT 'NAO_IDENTIFICADO',
    "nome_arquivo" TEXT NOT NULL,
    "associadoId" TEXT NOT NULL,
    "criadoPorId" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "associadoId" TEXT NOT NULL,
    "data_pagamento" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proximo_vencimento" DATE NOT NULL,
    "valor" DECIMAL(10,2),
    "observacao" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remessa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "quantidade_total" INTEGER NOT NULL,
    "quantidade_disponivel" INTEGER NOT NULL,
    "valor_unitario" DECIMAL(10,2),
    "data_limite" DATE NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_por_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Remessa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interesse" (
    "id" TEXT NOT NULL,
    "remessaId" TEXT NOT NULL,
    "associadoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "observacao" TEXT,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Interesse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logger" (
    "id" SERIAL NOT NULL,
    "tipo_log" "TipoLogger" NOT NULL,
    "log" JSONB,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_Esqueci_Senha_token_key" ON "Usuario_Esqueci_Senha"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_usuarioId_key" ON "Perfil"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Associado_perfilId_key" ON "Associado"("perfilId");

-- CreateIndex
CREATE INDEX "Associado_responsavelId_idx" ON "Associado"("responsavelId");

-- CreateIndex
CREATE INDEX "Documentos_associadoId_idx" ON "Documentos"("associadoId");

-- CreateIndex
CREATE INDEX "Documentos_criadoPorId_idx" ON "Documentos"("criadoPorId");

-- CreateIndex
CREATE INDEX "Pagamento_associadoId_idx" ON "Pagamento"("associadoId");

-- CreateIndex
CREATE INDEX "Pagamento_proximo_vencimento_idx" ON "Pagamento"("proximo_vencimento");

-- CreateIndex
CREATE INDEX "Remessa_ativa_idx" ON "Remessa"("ativa");

-- CreateIndex
CREATE INDEX "Remessa_data_limite_idx" ON "Remessa"("data_limite");

-- CreateIndex
CREATE INDEX "Interesse_remessaId_idx" ON "Interesse"("remessaId");

-- CreateIndex
CREATE INDEX "Interesse_associadoId_idx" ON "Interesse"("associadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Interesse_remessaId_associadoId_key" ON "Interesse"("remessaId", "associadoId");
