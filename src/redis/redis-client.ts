// common/src/redis/redis-client.ts
import { RedisConnection } from "./redis-connection";

type RedisClient = ReturnType<typeof import("redis").createClient>;

export class SimpleRedisClient {
  private redis: RedisClient | null = null;

  private async getConnection(): Promise<RedisClient> {
    if (!this.redis?.isReady) {
      this.redis = await RedisConnection.getInstance();
    }
    return this.redis;
  }

  // Basic operations
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      const redis = await this.getConnection();
      const options = ttlSeconds ? { EX: ttlSeconds } : undefined;
      const result = await redis.set(key, value, options);
      return result === "OK";
    } catch (error) {
      console.error("Redis SET error:", error);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const redis = await this.getConnection();
      return await redis.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const redis = await this.getConnection();
      const result = await redis.del(key);
      return result === 1;
    } catch (error) {
      console.error("Redis DEL error:", error);
      return false;
    }
  }

  // JSON helper methods
  async setJSON(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<boolean> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const result = await this.get(key);
    if (!result) return null;

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error("JSON parse error:", error);
      return null;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const redis = await this.getConnection();
      const result = await redis.ping();
      return result === "PONG";
    } catch (error) {
      console.error("Redis PING error:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const redisClient = new SimpleRedisClient();
