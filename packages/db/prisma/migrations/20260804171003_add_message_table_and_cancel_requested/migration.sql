-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

-- AlterTable
ALTER TABLE "agent_runs" ADD COLUMN     "cancel_requested" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT,
    "tool_calls" JSONB,
    "tool_call_id" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messages_session_id_seq_key" ON "messages"("session_id", "seq");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
