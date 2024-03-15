/*
  Warnings:

  - The values [CONCUBINADO] on the enum `EstadoCivil` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `nome` on the `Perfil` table. All the data in the column will be lost.
  - You are about to drop the column `nome_completo` on the `Perfil` table. All the data in the column will be lost.
  - You are about to drop the column `sobrenome` on the `Perfil` table. All the data in the column will be lost.
  - Added the required column `primeiro_nome` to the `Perfil` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ultimo_nome` to the `Perfil` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoCivil_new" AS ENUM ('SOLTEIRO', 'CASADO', 'VIUVO', 'DIVORCIADO');
ALTER TABLE "Perfil" ALTER COLUMN "estado_civil" TYPE "EstadoCivil_new" USING ("estado_civil"::text::"EstadoCivil_new");
ALTER TYPE "EstadoCivil" RENAME TO "EstadoCivil_old";
ALTER TYPE "EstadoCivil_new" RENAME TO "EstadoCivil";
DROP TYPE "EstadoCivil_old";
COMMIT;

-- AlterTable
ALTER TABLE "Perfil" DROP COLUMN "nome",
DROP COLUMN "nome_completo",
DROP COLUMN "sobrenome",
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "primeiro_nome" TEXT NOT NULL,
ADD COLUMN     "ultimo_nome" TEXT NOT NULL;
