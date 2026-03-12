-- AlterTable
ALTER TABLE "Contato" ADD COLUMN     "email" TEXT;

-- Add unique constraint after email exists
ALTER TABLE "Contato" ADD CONSTRAINT "Contato_email_telefone_key" UNIQUE ("email", "telefone");
