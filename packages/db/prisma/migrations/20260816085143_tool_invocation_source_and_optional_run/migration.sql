-- CreateEnum
CREATE TYPE "InvocationSource" AS ENUM ('agent', 'user');

-- AlterTable
ALTER TABLE "tool_invocations" ADD COLUMN     "source" "InvocationSource" NOT NULL DEFAULT 'agent',
ALTER COLUMN "llm_call_id" DROP NOT NULL,
ALTER COLUMN "run_id" DROP NOT NULL;
