/*
  Warnings:

  - You are about to drop the column `github_repo_url` on the `agent_sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "agent_sessions" DROP COLUMN "github_repo_url";
