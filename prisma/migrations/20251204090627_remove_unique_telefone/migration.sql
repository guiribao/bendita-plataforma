-- DropIndex
DROP INDEX IF EXISTS "Contato_telefone_key";

-- AlterTable - Add unique constraint on (email, telefone)
ALTER TABLE "Contato" ADD CONSTRAINT "Contato_email_telefone_key" UNIQUE ("email", "telefone");
