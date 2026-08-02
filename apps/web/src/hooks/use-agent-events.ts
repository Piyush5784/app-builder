import * as React from "react";
import { io, type Socket } from "socket.io-client";
import type { AgentEvent } from "@package/shared";
import { BACKEND_URL } from "@/config";

export function useAgentEvents(
  sessionId: string,
  onEvent: (event: AgentEvent) => void,
): void {
  const onEventRef = React.useRef(onEvent);
  React.useEffect(() => {
    onEventRef.current = onEvent;
  });

  React.useEffect(() => {
    const socket: Socket = io(BACKEND_URL, {
      path: "/ws/agent",
      query: { sessionId },
      transports: ["websocket"],
    });

    socket.on("agent-event", (event: AgentEvent) => onEventRef.current(event));

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);
}
