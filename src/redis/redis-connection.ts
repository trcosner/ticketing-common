// common/src/redis/redis-connection.ts
import { createClient } from "redis";

// Use a simpler type approach
type RedisClient = ReturnType<typeof createClient>;

export class RedisConnection {
  private static instance: RedisClient | null = null;
  private static isConnecting = false;

  static async getInstance(): Promise<RedisClient> {
    if (RedisConnection.instance?.isReady) {
      return RedisConnection.instance;
    }

    if (RedisConnection.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (RedisConnection.instance?.isReady) {
            resolve(RedisConnection.instance);
          } else if (!RedisConnection.isConnecting) {
            reject(new Error("Redis connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    RedisConnection.isConnecting = true;

    try {
      const redisUrl = process.env.REDIS_URL || "redis://redis-srv:6379";

      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log("Redis reconnection failed after 10 attempts");
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Event handlers
      client.on("connect", () => {
        console.log("Redis connecting...");
      });

      client.on("ready", () => {
        console.log("Redis connection ready");
        RedisConnection.isConnecting = false;
      });

      client.on("error", (err) => {
        console.error("Redis connection error:", err);
        RedisConnection.isConnecting = false;
      });

      client.on("end", () => {
        console.log("Redis connection closed");
        RedisConnection.instance = null;
      });

      // Connect with timeout
      await client.connect();

      RedisConnection.instance = client;
      return client;
    } catch (error) {
      RedisConnection.isConnecting = false;
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (RedisConnection.instance) {
      await RedisConnection.instance.disconnect();
      RedisConnection.instance = null;
    }
  }

  static isConnected(): boolean {
    return RedisConnection.instance?.isReady || false;
  }
}
