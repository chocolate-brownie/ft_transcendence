// Chat service — business logic for messaging
// Store messages, retrieve chat history

import prisma from "../lib/prisma";

export interface ToggleTypingStatus {
  receiverId: number;
  isTyping: boolean;
}

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

export interface ConversationSummary {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
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

export async function saveMessage(
  senderId: number,
  receiverId: number,
  content: string,
): Promise<MessageData> {
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

export async function getMessageWithSender(
  messageId: number,
): Promise<MessageWithSender | null> {
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
    receiverId: message.receiverId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    read: message.read,
    sender: {
      username: message.sender.username,
      avatarUrl: message.sender.avatarUrl,
    },
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

  // Fetch one extra to determine whether more pages exist
  const messages = await prisma.message.findMany({
    take: validLimit + 1,
    ...(beforeId && {
      skip: 1,
      cursor: { id: beforeId },
    }),
    where: {
      OR: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  const hasMore = messages.length > validLimit;
  if (hasMore) messages.pop();

  // Mark messages as read if current user is the receiver
  const unreadMessages = messages
    .filter((msg) => msg.receiverId === currentUserId && !msg.read)
    .map((msg) => msg.id);

  if (unreadMessages.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: unreadMessages } },
      data: { read: true },
    });
  }

  // Format response
  const formattedMessages: MessageWithSender[] = messages.map((msg) => ({
    id: msg.id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    read: msg.read || unreadMessages.includes(msg.id), // Include those we just marked
    sender: {
      username: msg.sender.username,
      avatarUrl: msg.sender.avatarUrl,
    },
  }));

  return {
    messages: formattedMessages,
    hasMore,
    nextCursor:
      formattedMessages.length > 0
        ? formattedMessages[formattedMessages.length - 1].id
        : null,
  };
}

export async function markConversationAsRead(
  currentUserId: number,
  otherUserId: number,
): Promise<void> {
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: currentUserId,
      read: false,
    },
    data: { read: true },
  });
}

export async function getConversations(currentUserId: number): Promise<ConversationSummary[]> {
  // Fetch all messages involving current user, newest first
  // Include both sides of the conversation for partner info
  const recentMessages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true } },
      receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true } },
    },
  });

  // Group by conversation partner — first occurrence is the most recent message
  const partnerLastMessage = new Map<number, typeof recentMessages[0]>();
  for (const msg of recentMessages) {
    const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
    if (!partnerLastMessage.has(partnerId)) {
      partnerLastMessage.set(partnerId, msg);
    }
  }

  const partnerIds = Array.from(partnerLastMessage.keys());
  if (partnerIds.length === 0) return [];

  // Bulk fetch unread counts per sender (2 queries total regardless of conversation count)
  const unreadGroups = await prisma.message.groupBy({
    by: ["senderId"],
    where: {
      receiverId: currentUserId,
      senderId: { in: partnerIds },
      read: false,
    },
    _count: { id: true },
  });

  const unreadMap = new Map(unreadGroups.map((u) => [u.senderId, u._count.id]));

  return partnerIds.map((partnerId) => {
    const lastMsg = partnerLastMessage.get(partnerId)!;
    const otherUser = lastMsg.senderId === currentUserId ? lastMsg.receiver : lastMsg.sender;

    return {
      user: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
        isOnline: otherUser.isOnline,
      },
      lastMessage: {
        content: lastMsg.content,
        createdAt: lastMsg.createdAt.toISOString(),
        senderId: lastMsg.senderId,
      },
      unreadCount: unreadMap.get(partnerId) ?? 0,
    };
  });
}
