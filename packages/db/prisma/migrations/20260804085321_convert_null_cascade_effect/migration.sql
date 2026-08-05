/*
  Warnings:

  - Made the column `user_id` on table `agent_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `credit_transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `run_id` on table `credit_transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "agent_sessions" DROP CONSTRAINT "agent_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "credit_transactions" DROP CONSTRAINT "credit_transactions_run_id_fkey";

-- DropForeignKey
ALTER TABLE "credit_transactions" DROP CONSTRAINT "credit_transactions_user_id_fkey";

-- AlterTable
ALTER TABLE "agent_sessions" ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "credit_transactions" ALTER COLUMN "user_id" SET NOT NULL,
ALTER COLUMN "run_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
