import { jest } from "@jest/globals";

/**
 * Mock Redis client for testing
 * This provides a consistent mock across all services
 */
export const createMockRedisClient = () => ({
  get: jest.fn().mockResolvedValue(null as any),
  set: jest.fn().mockResolvedValue(true as any),
  del: jest.fn().mockResolvedValue(true as any),
  exists: jest.fn().mockResolvedValue(false as any),
  expire: jest.fn().mockResolvedValue(true as any),
  setJSON: jest.fn().mockResolvedValue(true as any),
  getJSON: jest.fn().mockResolvedValue(null as any),
  sAdd: jest.fn().mockResolvedValue(1 as any),
  sMembers: jest.fn().mockResolvedValue([] as any),
  sRem: jest.fn().mockResolvedValue(1 as any),
  sCard: jest.fn().mockResolvedValue(0 as any),
  zAdd: jest.fn().mockResolvedValue(1 as any),
  zCard: jest.fn().mockResolvedValue(0 as any),
  zRemRangeByScore: jest.fn().mockResolvedValue(0 as any),
  incr: jest.fn().mockResolvedValue(1 as any),
  multi: jest.fn().mockResolvedValue([] as any),
  ping: jest.fn().mockResolvedValue(true as any),
  isReady: true,
  connect: jest.fn().mockResolvedValue(undefined as any),
  disconnect: jest.fn().mockResolvedValue(undefined as any),
});

/**
 * Mock Redis connection class to prevent actual connections during tests
 */
export const createMockRedisConnection = () => {
  const mockClient = createMockRedisClient();

  return class MockRedisConnection {
    static getInstance = jest.fn().mockResolvedValue(mockClient);
    static instance = mockClient;
  };
};

/**
 * Creates a complete mock of the common module for Jest
 * Use this in your jest.mock() calls
 */
export const createCommonModuleMock = (originalModule: any) => ({
  ...originalModule,
  redisClient: createMockRedisClient(),
  RedisConnection: createMockRedisConnection(),
  // Keep real JWT functions for authentication
  generateJWT: originalModule.generateJWT,
  verifyJWT: originalModule.verifyJWT,
});
