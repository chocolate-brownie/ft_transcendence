import type { Server, Socket } from "socket.io";
import { registerPresenceHandlers } from "./handlers/presence.handlers";
import { registerChatHandlers } from "./handlers/chat.handlers";
import { registerMatchmakingHandlers } from "./handlers/matchmaking.handlers";

export function registerSocketHandlers(io: Server, socket: Socket) {
  registerPresenceHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerMatchmakingHandlers(io, socket);
}
