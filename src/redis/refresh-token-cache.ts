import { redisClient } from "./redis-client";

export class RefreshTokenCache {
  private static readonly PREFIXES = {
    REFRESH_TOKEN: "refresh_token:",
    USER_SESSIONS: "user_sessions:",
    REFRESH_RATE_LIMIT: "refresh_rate_limit:",
  };

  // Cache refresh token metadata
  async cacheRefreshToken(
    token: string,
    userId: string,
    expiresAt: Date,
    deviceInfo?: string
  ): Promise<void> {
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (ttl > 0) {
      const tokenData = {
        userId,
        deviceInfo: deviceInfo || "Unknown Device",
        expiresAt: expiresAt.toISOString(),
      };

      await redisClient.setJSON(
        `${RefreshTokenCache.PREFIXES.REFRESH_TOKEN}${token}`,
        tokenData,
        ttl
      );
    }
  }

  // Get refresh token metadata
  async getRefreshTokenData(token: string): Promise<any> {
    return redisClient.getJSON(
      `${RefreshTokenCache.PREFIXES.REFRESH_TOKEN}${token}`
    );
  }

  // Invalidate refresh token
  async invalidateRefreshToken(token: string): Promise<void> {
    await redisClient.del(
      `${RefreshTokenCache.PREFIXES.REFRESH_TOKEN}${token}`
    );
  }

  // Add session to user's active sessions
  async addUserSession(
    userId: string,
    sessionId: string,
    deviceInfo: string,
    ttl = 2592000 // 30 days
  ): Promise<void> {
    const key = `${RefreshTokenCache.PREFIXES.USER_SESSIONS}${userId}`;

    // Store session with device info
    const sessionData = {
      sessionId,
      deviceInfo,
      createdAt: new Date().toISOString(),
    };

    await redisClient.setJSON(`${key}:${sessionId}`, sessionData, ttl);

    // Add to user's session set
    await redisClient.sAdd(key, sessionId);
    await redisClient.expire(key, ttl);
  }

  // Remove session from user's active sessions
  async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const key = `${RefreshTokenCache.PREFIXES.USER_SESSIONS}${userId}`;
    await redisClient.sRem(key, sessionId);
    await redisClient.del(`${key}:${sessionId}`);
  }

  // Get all user sessions with details
  async getUserSessions(userId: string): Promise<any[]> {
    const key = `${RefreshTokenCache.PREFIXES.USER_SESSIONS}${userId}`;
    const sessionIds = await redisClient.sMembers(key);

    const sessions = [];
    for (const sessionId of sessionIds) {
      const sessionData = await redisClient.getJSON(`${key}:${sessionId}`);
      if (sessionData) {
        sessions.push({ ...sessionData, sessionId });
      }
    }

    return sessions;
  }

  // Revoke all user sessions
  async revokeAllUserSessions(userId: string): Promise<void> {
    const key = `${RefreshTokenCache.PREFIXES.USER_SESSIONS}${userId}`;
    const sessionIds = await redisClient.sMembers(key);

    // Delete all session data
    const deleteOps = sessionIds.map(
      (sessionId) => () => redisClient.del(`${key}:${sessionId}`)
    );

    await redisClient.multi(deleteOps);

    // Clear the session set
    await redisClient.del(key);
  }

  // Rate limiting for token refresh attempts
  async checkRefreshRateLimit(
    identifier: string,
    limit = 10,
    windowMs = 300000 // 5 minutes
  ): Promise<boolean> {
    const key = `${RefreshTokenCache.PREFIXES.REFRESH_RATE_LIMIT}${identifier}`;
    return redisClient.checkRateLimit(key, limit, windowMs);
  }
}

export const refreshTokenCache = new RefreshTokenCache();
