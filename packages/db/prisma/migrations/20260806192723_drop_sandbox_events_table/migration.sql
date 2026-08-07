/*
  Warnings:

  - You are about to drop the column `followers_count` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `following_count` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `is_private` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `posts_count` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `sandbox_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sandbox_events" DROP CONSTRAINT "sandbox_events_session_id_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "followers_count",
DROP COLUMN "following_count",
DROP COLUMN "is_private",
DROP COLUMN "posts_count";

-- DropTable
DROP TABLE "sandbox_events";

-- CreateIndex
CREATE INDEX "tool_invocations_session_id_status_tool_name_idx" ON "tool_invocations"("session_id", "status", "tool_name");
