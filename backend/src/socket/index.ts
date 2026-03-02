import type { Server, Socket } from "socket.io";
import { registerPresenceHandlers, handlePresenceDisconnect } from "./handlers/presence.handlers";
import { registerChatHandlers } from "./handlers/chat.handlers";
import { registerMatchmakingHandlers } from "./handlers/matchmaking.handlers";
import { registerGameRoomHandlers, handleGameRoomDisconnect } from "./handlers/gameRoom.handlers";

export function registerSocketHandlers(io: Server, socket: Socket) {
  registerPresenceHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerMatchmakingHandlers(io, socket);
  registerGameRoomHandlers(io, socket);

  socket.on("disconnect", () => {
    handlePresenceDisconnect(io, socket);
    handleGameRoomDisconnect(io, socket);
  });
}
