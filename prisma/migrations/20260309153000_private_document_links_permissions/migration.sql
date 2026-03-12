-- CreateEnum
CREATE TYPE "EscopoPermissaoDocumento" AS ENUM ('NENHUM', 'PROPRIOS', 'TODOS');

-- CreateTable
CREATE TABLE "PermissaoSolicitacaoLinkDocumento" (
    "id" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "tipoDocumento" "TipoDocumento",
    "escopo" "EscopoPermissaoDocumento" NOT NULL DEFAULT 'NENHUM',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PermissaoSolicitacaoLinkDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkTemporarioDocumento" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "expira_em" TIMESTAMPTZ NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkTemporarioDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissaoSolicitacaoLinkDocumento_papel_tipoDocumento_key" ON "PermissaoSolicitacaoLinkDocumento"("papel", "tipoDocumento");

-- CreateIndex
CREATE INDEX "PermissaoSolicitacaoLinkDocumento_papel_ativo_idx" ON "PermissaoSolicitacaoLinkDocumento"("papel", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "LinkTemporarioDocumento_token_key" ON "LinkTemporarioDocumento"("token");

-- CreateIndex
CREATE INDEX "LinkTemporarioDocumento_documentoId_usuarioId_idx" ON "LinkTemporarioDocumento"("documentoId", "usuarioId");

-- CreateIndex
CREATE INDEX "LinkTemporarioDocumento_expira_em_idx" ON "LinkTemporarioDocumento"("expira_em");

-- Seed default permissions
INSERT INTO "PermissaoSolicitacaoLinkDocumento" ("id", "papel", "tipoDocumento", "escopo", "ativo", "criado_em", "atualizado_em") VALUES
  ('perm-admin-all', 'ADMIN', NULL, 'TODOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-associado-own', 'ASSOCIADO', NULL, 'PROPRIOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-associado-dependente-own', 'ASSOCIADO_DEPENDENTE', NULL, 'PROPRIOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-saude-none', 'SAUDE', NULL, 'NENHUM', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-saude-receita', 'SAUDE', 'RECEITA_MEDICA', 'TODOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-saude-anvisa', 'SAUDE', 'AUTORIZACAO_ANVISA', 'TODOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-secretaria-none', 'SECRETARIA', NULL, 'NENHUM', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-secretaria-id', 'SECRETARIA', 'IDENTIFICACAO', 'TODOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-secretaria-id-resp', 'SECRETARIA', 'IDENTIFICACAO_RESPONSAVEL', 'TODOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm-secretaria-residencia', 'SECRETARIA', 'COMPROVANTE_RESIDENCIA', 'TODOS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
