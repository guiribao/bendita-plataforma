-- Align DB column type with Prisma schema (String)
ALTER TABLE "Perfil"
  ALTER COLUMN "data_nascimento" DROP NOT NULL,
  ALTER COLUMN "data_nascimento" TYPE TEXT USING "data_nascimento"::text;
