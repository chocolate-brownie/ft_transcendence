import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";

type JwtSocketUser = {
  id: number;
  username: string;
  avatarUrl?: string;
};

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token;

  if (!token || !token.startsWith("Bearer ")) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET!);
    socket.data.user = decoded as JwtSocketUser;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }
    return next(new Error("Invalid token"));
  }
}
