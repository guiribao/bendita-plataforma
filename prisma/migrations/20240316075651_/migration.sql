/*
  Warnings:

  - The values [TRABALHO_ABERTO,TRABALHO_FECHADO,EVENTO_ABERTO] on the enum `TipoEvento` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoEvento_new" AS ENUM ('EVENTO', 'FEIRINHA', 'TRABALHO', 'TREINAMENTO');
ALTER TABLE "Eventos" ALTER COLUMN "tipo" TYPE "TipoEvento_new" USING ("tipo"::text::"TipoEvento_new");
ALTER TYPE "TipoEvento" RENAME TO "TipoEvento_old";
ALTER TYPE "TipoEvento_new" RENAME TO "TipoEvento";
DROP TYPE "TipoEvento_old";
COMMIT;

-- AlterTable
ALTER TABLE "Eventos" ADD COLUMN     "trabalho_fechado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trabalho_missa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trabalho_terco" BOOLEAN NOT NULL DEFAULT false;
