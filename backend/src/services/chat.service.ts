// Chat service — business logic for messaging
// Store messages, retrieve chat history

import prisma from "../lib/prisma";

// #region Interfaces
export interface SendMessagePayload {
  receiverId: number;
  content: string;
}

export interface ReceiveMessagePayload {
  id: number;
  senderId: number;
  senderUsername: string;
  senderAvatar: string | null;
  content: string;
  timestamp: string;
}

export interface MessageData {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export interface MessageWithSender {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    username: string;
    avatarUrl: string | null;
  };
}

export interface ChatHistoryResponse {
  messages: MessageWithSender[];
  hasMore: boolean;
  nextCursor: number | null;
}

// #endregion

// #region Checks
export function validateMessageContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= 2000;
}

export async function userExists(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return !!user;
}

export async function areFriends(senderId: number, receiverId: number): Promise<boolean> {
  const friendship = await prisma.friend.findFirst({
    where: {
      OR: [
        { requesterId: senderId, addresseeId: receiverId },
        { requesterId: receiverId, addresseeId: senderId },
      ],
      status: "ACCEPTED",
    },
  });
  return !!friendship;
}

// #endregion

export async function saveMessage(senderId: number, receiverId: number, content: string): Promise<MessageData> {
  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content: content.trim(),
    },
  });

  return {
    id: message.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function getMessageWithSender(messageId: number): Promise<ReceiveMessagePayload | null> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!message) return null;

  return {
    id: message.id,
    senderId: message.senderId,
    senderUsername: message.sender.username,
    senderAvatar: message.sender.avatarUrl,
    content: message.content,
    timestamp: message.createdAt.toISOString(),
  };
}

export async function getChatHistoryPaginated(
  currentUserId: number,
  otherUserId: number,
  limit: number = 50,
  beforeId?: number,
): Promise<ChatHistoryResponse> {
  // Validate limit (max 100, min 1)
  const validLimit = Math.max(1, Math.min(limit, 100));

  // Build the query filter
  const where = {
    OR: [
      { senderId: currentUserId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: currentUserId },
    ],
  };

  // If beforeId is provided, only get messages before this ID
  let cursorFilter = where;
  if (beforeId) {
    cursorFilter = {
      ...where,
      id: { lt: beforeId },
    };
  }

  // Fetch one more than needed to determine if there are more messages
  const messages = await prisma.message.findMany({
    where: cursorFilter,
    include: {
      sender: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" }, // Newest first
    take: validLimit + 1, // Fetch one extra to check if there are more
  });

  // Determine if there are more messages
  const hasMore = messages.length > validLimit;
  const pageMessages = hasMore ? messages.slice(0, validLimit) : messages;

  // Mark messages as read if current user is the receiver
  const messagesToMarkAsRead = pageMessages
    .filter(msg => msg.receiverId === currentUserId && !msg.read)
    .map(msg => msg.id);

  if (messagesToMarkAsRead.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: messagesToMarkAsRead } },
      data: { read: true },
    });
  }

  // Format response
  const formattedMessages: MessageWithSender[] = pageMessages.map(msg => ({
    id: msg.id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    read: msg.read || messagesToMarkAsRead.includes(msg.id), // Include those we just marked
    sender: {
      username: msg.sender.username,
      avatarUrl: msg.sender.avatarUrl,
    },
  }));

  return {
    messages: formattedMessages,
    hasMore,
    nextCursor: hasMore ? pageMessages[pageMessages.length - 1].id : null,
  };
}
