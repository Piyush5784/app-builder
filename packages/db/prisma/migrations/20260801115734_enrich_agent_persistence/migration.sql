/*
  Warnings:

  - The primary key for the `agent_events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `arguments` on the `agent_events` table. All the data in the column will be lost.
  - You are about to drop the column `error_message` on the `agent_events` table. All the data in the column will be lost.
  - You are about to drop the column `llm_call_id` on the `agent_events` table. All the data in the column will be lost.
  - You are about to drop the column `session_id` on the `agent_events` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `agent_events` table. All the data in the column will be lost.
  - You are about to drop the column `tool_name` on the `agent_events` table. All the data in the column will be lost.
  - The primary key for the `agent_runs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `llm_calls` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `message` to the `agent_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `run_id` to the `agent_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `llm_calls` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('usage', 'topup', 'refund', 'system_adjustment');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('info', 'warning', 'error');

-- DropForeignKey
ALTER TABLE "agent_events" DROP CONSTRAINT "agent_events_llm_call_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_events" DROP CONSTRAINT "agent_events_session_id_fkey";

-- DropForeignKey
ALTER TABLE "llm_calls" DROP CONSTRAINT "llm_calls_run_id_fkey";

-- DropIndex
DROP INDEX "agent_events_llm_call_id_idx";

-- DropIndex
DROP INDEX "agent_events_session_id_id_idx";

-- DropIndex
DROP INDEX "agent_runs_session_id_id_idx";

-- DropIndex
DROP INDEX "llm_calls_run_id_id_idx";

-- AlterTable
ALTER TABLE "agent_events" DROP CONSTRAINT "agent_events_pkey",
DROP COLUMN "arguments",
DROP COLUMN "error_message",
DROP COLUMN "llm_call_id",
DROP COLUMN "session_id",
DROP COLUMN "status",
DROP COLUMN "tool_name",
ADD COLUMN     "level" "LogLevel" NOT NULL DEFAULT 'info',
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "run_id" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "agent_events_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "agent_events_id_seq";

-- AlterTable
ALTER TABLE "agent_runs" DROP CONSTRAINT "agent_runs_pkey",
ADD COLUMN     "total_cost" DECIMAL(65,30),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "agent_runs_id_seq";

-- AlterTable
ALTER TABLE "agent_sessions" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "llm_calls" DROP CONSTRAINT "llm_calls_pkey",
ADD COLUMN     "cost" DECIMAL(65,30),
ADD COLUMN     "pricing_id" TEXT,
ADD COLUMN     "prompt" JSONB NOT NULL,
ADD COLUMN     "response" JSONB,
ADD COLUMN     "tokens_in" INTEGER,
ADD COLUMN     "tokens_out" INTEGER,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "run_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "llm_calls_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "llm_calls_id_seq";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "credits" DECIMAL(65,30) NOT NULL DEFAULT 0,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "tool_invocations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "llm_call_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "output" TEXT,
    "status" "Status" NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_invocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_pricing" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_price_per_million" DECIMAL(65,30) NOT NULL,
    "output_price_per_million" DECIMAL(65,30) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "run_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tool_invocations_session_id_created_at_idx" ON "tool_invocations"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "tool_invocations_llm_call_id_idx" ON "tool_invocations"("llm_call_id");

-- CreateIndex
CREATE INDEX "model_pricing_provider_model_effective_from_effective_to_idx" ON "model_pricing"("provider", "model", "effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "credit_transactions_user_id_created_at_idx" ON "credit_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "credit_transactions_run_id_idx" ON "credit_transactions"("run_id");

-- CreateIndex
CREATE INDEX "agent_events_run_id_created_at_idx" ON "agent_events"("run_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_runs_session_id_started_at_idx" ON "agent_runs"("session_id", "started_at");

-- CreateIndex
CREATE INDEX "agent_sessions_user_id_idx" ON "agent_sessions"("user_id");

-- CreateIndex
CREATE INDEX "llm_calls_run_id_created_at_idx" ON "llm_calls"("run_id", "created_at");

-- AddForeignKey
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_calls" ADD CONSTRAINT "llm_calls_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_calls" ADD CONSTRAINT "llm_calls_pricing_id_fkey" FOREIGN KEY ("pricing_id") REFERENCES "model_pricing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_llm_call_id_fkey" FOREIGN KEY ("llm_call_id") REFERENCES "llm_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
