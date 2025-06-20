import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redisClient } from "../redis/redis-client";

interface UserPayload {
  id: string;
  email: string;
  jti: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session?.jwt) {
    return next();
  }

  try {
    const payload = jwt.verify(
      req.session.jwt,
      process.env.JWT_KEY!
    ) as UserPayload;

    const isBlacklisted = await redisClient.get(`blacklist:${payload.jti}`);
    if (isBlacklisted === "1") {
      console.log(`Token ${payload.jti} is blacklisted`);
      req.session = null;
      return next();
    }

    req.currentUser = payload;
  } catch (err) {}

  next();
};
