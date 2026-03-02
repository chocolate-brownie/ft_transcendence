import type { Server, Socket } from "socket.io";
import {
  validateMessageContent,
  userExists,
  areFriends,
  saveMessage,
  getMessageWithSender,
  SendMessagePayload,
  ToggleTypingStatus,
} from "../../services/chat.service";

export function registerChatHandlers(io: Server, socket: Socket) {
  socket.on("send_message", async (payload: SendMessagePayload) => {
    try {
      const senderId = socket.data.user.id;

      if (!payload.receiverId || typeof payload.receiverId !== "number") {
        return socket.emit("message_error", { message: "Invalid receiverId" });
      }
      if (!payload.content || typeof payload.content !== "string") {
        return socket.emit("message_error", { message: "Invalid content" });
      }

      payload.content = payload.content
        .replace(/<[^>]*>/g, "")
        .replace(/[<>]/g, "")
        .trim();

      if (!validateMessageContent(payload.content)) {
        return socket.emit("message_error", {
          message: "Content must be 1-2000 characters",
        });
      }

      const receiverExists = await userExists(payload.receiverId);
      if (!receiverExists) {
        return socket.emit("message_error", { message: "Receiver does not exist" });
      }

      const friends = await areFriends(senderId, payload.receiverId);
      if (!friends) {
        return socket.emit("message_error", {
          message: "You can only send messages to friends",
        });
      }

      const message = await saveMessage(senderId, payload.receiverId, payload.content);

      const messageWithSender = await getMessageWithSender(message.id);
      if (!messageWithSender) {
        return socket.emit("message_error", { message: "Failed to retrieve message" });
      }

      io.to(`user:${payload.receiverId}`).emit("receive_message", messageWithSender);
      io.to(`user:${senderId}`).emit("receive_message", messageWithSender);
    } catch (error) {
      console.error("Error handling send_message:", error);
      socket.emit("message_error", { message: "Internal server error" });
    }
  });

  /* -------- Responsible for the typing effect in the chatbox ----------- */
  socket.on("typing", async (payload: ToggleTypingStatus) => {
    try {
      const senderId = socket.data.user.id;
      const senderUsername = socket.data.user.username;

      if (!payload.receiverId || typeof payload.receiverId !== "number") {
        return socket.emit("message_error", { message: "Invalid receiverId" });
      }

      if (typeof payload.isTyping !== "boolean") {
        return socket.emit("message_error", { message: "Invalid isTyping value" });
      }

      const receiverExists = await userExists(payload.receiverId);
      if (!receiverExists) {
        return socket.emit("message_error", { message: "Receiver does not exist" });
      }

      const friends = await areFriends(senderId, payload.receiverId);
      if (!friends) {
        return socket.emit("message_error", {
          message: "You can only send messages to friends",
        });
      }

      io.to(`user:${payload.receiverId}`).emit("user_typing", {
        userId: senderId,
        username: senderUsername,
        isTyping: payload.isTyping,
      });
    } catch (error) {
      console.error("Error handling send_typing:", error);
      socket.emit("message_error", { message: "Internal server error" });
    }
  });
}
