// Auth middleware — JWT token verification
// Attach to any route that requires authentication
// Verifies the token from the Authorization header
// Sets req.user with the decoded user data

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
//We ned to extend the Request type to include our user property
export interface AuthRequest extends Request {
  user?: any;
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = auth.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}
