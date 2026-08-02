/*
  Warnings:

  - Made the column `email` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "agent_sessions" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;
