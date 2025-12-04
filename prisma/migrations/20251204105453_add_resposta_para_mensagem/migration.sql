-- AlterTable
ALTER TABLE "Mensagem" ADD COLUMN     "respostaParaId" TEXT;

-- CreateIndex
CREATE INDEX "Mensagem_respostaParaId_idx" ON "Mensagem"("respostaParaId");
