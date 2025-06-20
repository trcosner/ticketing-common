import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

    // Import redisClient dynamically to make it mockable
    const { redisClient } = await import("../redis/redis-client");

    const isBlacklisted = await redisClient.get(`blacklist:${payload.jti}`);
    if (isBlacklisted === "1") {
      console.log(`Token ${payload.jti} is blacklisted`);
      req.session = null;
      return next();
    }

    let cachedUser = await redisClient.getJSON(`user:${payload.id}`);

    if (cachedUser) {
      console.log(`User ${payload.id} loaded from cache`);
      req.currentUser = { ...payload, ...cachedUser };
    } else {
      console.log(`User ${payload.id} not in cache, using JWT payload`);
      req.currentUser = payload;

      // Cache the user data for next time (5 minute TTL)
      await redisClient.setJSON(`user:${payload.id}`, payload, 300);
    }
  } catch (err) {}

  next();
};
