/*
  Warnings:

  - Added the required column `run_id` to the `tool_invocations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tool_invocations" ADD COLUMN     "run_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "tool_invocations_run_id_created_at_idx" ON "tool_invocations"("run_id", "created_at");

-- AddForeignKey
ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
