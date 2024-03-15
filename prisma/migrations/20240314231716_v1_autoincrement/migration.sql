-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'USUARIO');

-- CreateEnum
CREATE TYPE "Grupo" AS ENUM ('FARDADO', 'VISITANTE');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTEIRO', 'CASADO', 'CONCUBINADO', 'VIUVO', 'DIVORCIADO');

-- CreateEnum
CREATE TYPE "Escolaridade" AS ENUM ('FUNDAMENTAL_INCOMPLETO', 'FUNDAMENTAL_COMPLETO', 'MEDIO_INCOMPLETO', 'MEDIO_COMPLETO', 'SUPERIOR_INCOMPLETO', 'SUPERIOR_COMPLETO', 'NAO_APLICA');

-- CreateEnum
CREATE TYPE "TipoOperacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('TRABALHO_ABERTO', 'TRABALHO_FECHADO', 'EVENTO_ABERTO');

-- CreateEnum
CREATE TYPE "TipoFarda" AS ENUM ('FARDA_AZUL', 'FARDA_BRANCA', 'ROUPA_BRANCA', 'NAO_APLICA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" VARCHAR(100) NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'USUARIO',
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

ALTER SEQUENCE "Usuario_id_seq" RESTART WITH 560960;

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
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "data_hora_nascimento" TIMESTAMPTZ NOT NULL,
    "cidade_nascimento" TEXT,
    "estado_nascimento" TEXT,
    "estado_civil" "EstadoCivil",
    "nome_conjuge" TEXT,
    "rg" VARCHAR(15),
    "cpf" VARCHAR(15),
    "email" TEXT,
    "celular" TEXT,
    "telefone_fixo" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "nome_referencia" TEXT,
    "email_referencia" TEXT,
    "telefone_referencia" TEXT,
    "endereco_referencia" TEXT,
    "parentesco_referencia" TEXT,
    "grupo" "Grupo" NOT NULL DEFAULT 'VISITANTE',
    "membro" BOOLEAN NOT NULL DEFAULT false,
    "data_fardamento" DATE,
    "local_fardamento" TEXT,
    "foto" VARCHAR(200),
    "bio" TEXT,
    "profissao" TEXT,
    "escolaridade" "Escolaridade",
    "usuarioId" INTEGER,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filhos" (
    "id" SERIAL NOT NULL,
    "perfilPaiId" INTEGER NOT NULL,
    "perfilFilhoId" INTEGER NOT NULL,

    CONSTRAINT "Filhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operacao" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(200),
    "tipo" "TipoOperacao" NOT NULL DEFAULT 'ENTRADA',
    "valor" MONEY NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perfilId" INTEGER,
    "criado_por" INTEGER NOT NULL,

    CONSTRAINT "Operacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eventos" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoEvento" NOT NULL,
    "vestimenta" "TipoFarda" NOT NULL,
    "data_hora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questionario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Questionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questionario_Perguntas" (
    "id" SERIAL NOT NULL,
    "pergunta" VARCHAR(200) NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,
    "questionarioId" INTEGER NOT NULL,

    CONSTRAINT "Questionario_Perguntas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_Esqueci_Senha_token_key" ON "Usuario_Esqueci_Senha"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_usuarioId_key" ON "Perfil"("usuarioId");

-- CreateIndex
CREATE INDEX "Operacao_perfilId_idx" ON "Operacao"("perfilId");

-- CreateIndex
CREATE INDEX "Operacao_criado_por_idx" ON "Operacao"("criado_por");

-- CreateIndex
CREATE INDEX "Questionario_Perguntas_questionarioId_idx" ON "Questionario_Perguntas"("questionarioId");
