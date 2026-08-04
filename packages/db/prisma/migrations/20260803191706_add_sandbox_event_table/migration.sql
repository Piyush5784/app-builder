-- CreateTable
CREATE TABLE "sandbox_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "tool_call" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sandbox_events_session_id_created_at_idx" ON "sandbox_events"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "sandbox_events" ADD CONSTRAINT "sandbox_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
