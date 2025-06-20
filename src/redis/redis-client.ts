// common/src/redis/redis-client.ts
import { RedisConnection } from "./redis-connection";

type RedisClient = ReturnType<typeof import("redis").createClient>;

export class SimpleRedisClient {
  private redis: RedisClient | null = null;

  private async getConnection(): Promise<RedisClient> {
    // In test environment, return a mock Redis client to avoid connection attempts
    if (process.env.NODE_ENV === "test") {
      return {
        isReady: true,
        get: async () => null,
        set: async () => "OK",
        del: async () => 1,
        exists: async () => 0,
        expire: async () => 1,
        json: {
          set: async () => "OK",
          get: async () => null,
        },
        sAdd: async () => 1,
        sMembers: async () => [],
        sRem: async () => 1,
        sCard: async () => 0,
        zAdd: async () => 1,
        zCard: async () => 0,
        zRemRangeByScore: async () => 0,
        incr: async () => 1,
        multi: async () => [],
        ping: async () => "PONG",
      } as any;
    }

    if (!this.redis?.isReady) {
      this.redis = await RedisConnection.getInstance();
    }
    return this.redis;
  }

  // Safe operation wrapper with default fallback
  private async safeOperation<T>(
    operation: (redis: RedisClient) => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      const redis = await this.getConnection();
      return await operation(redis);
    } catch (error) {
      console.error("Redis operation failed:", error);
      return fallback;
    }
  }

  // Basic operations
  async set(
    key: string,
    value: string,
    options?: { EX?: number; PX?: number }
  ): Promise<boolean> {
    const result = await this.safeOperation(
      async (redis) => redis.set(key, value, options),
      null
    );
    return result === "OK";
  }

  async get(key: string): Promise<string | null> {
    return this.safeOperation(async (redis) => redis.get(key), null);
  }

  async del(key: string): Promise<boolean> {
    const result = await this.safeOperation(async (redis) => redis.del(key), 0);
    return result === 1;
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.safeOperation(
      async (redis) => redis.exists(key),
      0
    );
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.safeOperation(
      async (redis) => redis.expire(key, seconds),
      0 // Use 0 as fallback since redis.expire returns number
    );
    return result === 1; // Convert number to boolean (1 = true, 0 = false)
  }

  // JSON operations
  async setJSON(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<boolean> {
    const options = ttlSeconds ? { EX: ttlSeconds } : undefined;
    return this.set(key, JSON.stringify(value), options);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const result = await this.get(key);
    if (!result) return null;

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error("Failed to parse JSON from Redis:", error);
      return null;
    }
  }

  // Set operations
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.safeOperation(async (redis) => redis.sAdd(key, members), 0);
  }

  async sMembers(key: string): Promise<string[]> {
    return this.safeOperation(async (redis) => redis.sMembers(key), []);
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    return this.safeOperation(async (redis) => redis.sRem(key, members), 0);
  }

  async sCard(key: string): Promise<number> {
    return this.safeOperation(async (redis) => redis.sCard(key), 0);
  }

  // Sorted set operations for rate limiting
  async zAdd(key: string, score: number, member: string): Promise<number> {
    return this.safeOperation(
      async (redis) => redis.zAdd(key, { score, value: member }),
      0
    );
  }

  async zCard(key: string): Promise<number> {
    return this.safeOperation(async (redis) => redis.zCard(key), 0);
  }

  async zRemRangeByScore(
    key: string,
    min: number,
    max: number
  ): Promise<number> {
    return this.safeOperation(
      async (redis) => redis.zRemRangeByScore(key, min, max),
      0
    );
  }

  // Increment operations
  async incr(key: string): Promise<number> {
    return this.safeOperation(async (redis) => redis.incr(key), 0);
  }

  // Multi/Pipeline operations
  async multi(operations: Array<() => Promise<any>>): Promise<any[]> {
    return this.safeOperation(async (redis) => {
      const results = [];
      for (const operation of operations) {
        try {
          const result = await operation();
          results.push(result);
        } catch (error) {
          results.push(null);
        }
      }
      return results;
    }, []);
  }

  // Rate limiting with sliding window
  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    return this.safeOperation(async (redis) => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries
      await redis.zRemRangeByScore(key, 0, windowStart);
      // Add current request
      await redis.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      // Count current requests
      const count = await redis.zCard(key);
      // Set expiry
      await redis.expire(key, Math.ceil(windowMs / 1000));

      return count <= limit;
    }, false);
  }

  // Health check method
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

// Singleton instance
export const redisClient = new SimpleRedisClient();
