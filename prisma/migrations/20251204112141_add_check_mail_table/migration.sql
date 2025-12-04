-- CreateTable
CREATE TABLE "CheckMail" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "emailFrom" TEXT NOT NULL,
    "emailTo" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "salvo" BOOLEAN NOT NULL DEFAULT false,
    "contatoId" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CheckMail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckMail_messageId_key" ON "CheckMail"("messageId");

-- CreateIndex
CREATE INDEX "CheckMail_messageId_idx" ON "CheckMail"("messageId");

-- CreateIndex
CREATE INDEX "CheckMail_inReplyTo_idx" ON "CheckMail"("inReplyTo");

-- CreateIndex
CREATE INDEX "CheckMail_emailFrom_idx" ON "CheckMail"("emailFrom");

-- CreateIndex
CREATE INDEX "CheckMail_contatoId_idx" ON "CheckMail"("contatoId");
