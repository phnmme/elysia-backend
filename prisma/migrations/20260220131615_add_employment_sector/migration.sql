/*
  Warnings:

  - You are about to drop the column `jobPosition` on the `StudentProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EmploymentSector" AS ENUM ('PRIVATE', 'GOVERNMENT');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "jobPosition",
ADD COLUMN     "continued_from_coop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "employment_sector" "EmploymentSector";
