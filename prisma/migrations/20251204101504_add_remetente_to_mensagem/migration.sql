-- CreateEnum
CREATE TYPE "Remetente" AS ENUM ('FROM_CONTACT', 'FROM_BENDITA');

-- AlterTable
ALTER TABLE "Mensagem" ADD COLUMN "remetente" "Remetente" NOT NULL DEFAULT 'FROM_CONTACT';
