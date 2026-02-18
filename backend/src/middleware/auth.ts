// Auth middleware — JWT token verification
// Attach to any route that requires authentication
// Verifies the token from the Authorization header
// Sets req.user with the decoded user data

import { Request  , Response, NextFunction } from "express";

const jwt = require("jsonwebtoken");

//We ned to extend the Request type to include our user property
interface AuthRequest extends Request {
	user?: any;
}

function auth(req: AuthRequest, res: Response, next: NextFunction) {
	const token = req.headers.authorization;
	if (!token) {
		return res.status(401).json({ message: 'No token provided' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err: any) {
		if (err.name === 'TokenExpiredError') {
		return res.status(401).json({ message: 'Token expired' });
	}
		return res.status(401).json({ message: 'Invalid token' });
	}
}

module.exports(auth);
