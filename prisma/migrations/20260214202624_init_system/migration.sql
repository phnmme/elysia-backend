/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `JwtBlacklist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JwtBlacklist" DROP COLUMN "expiresAt";
