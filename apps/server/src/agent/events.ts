import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { FRONTEND_URL } from "@/config";
import type { AgentEvent } from "@package/shared";

export type { AgentEvent };

let io: SocketIOServer | undefined;

/**
 * One socket.io room per agent session. Rooms are joined/left by socket.io
 * itself (on connect/disconnect) — no manual subscriber bookkeeping needed.
 */
export function attachAgentEventServer(server: HttpServer): void {
  io = new SocketIOServer(server, {
    path: "/ws/agent",
    cors: { origin: FRONTEND_URL, credentials: true },
  });

  io.on("connection", (socket) => {
    const sessionId = socket.handshake.query.sessionId;
    if (!sessionId || typeof sessionId !== "string") {
      socket.disconnect(true);
      return;
    }

    socket.join(sessionId);
  });
}

/**
 * Fire-and-forget: if nobody's connected for this session, the event is
 * simply dropped. Callers don't need to know whether anyone's watching.
 */
export function emitAgentEvent(sessionId: string, event: AgentEvent): void {
  io?.to(sessionId).emit("agent-event", event);
}
