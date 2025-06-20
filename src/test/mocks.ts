import { jest } from "@jest/globals";

/**
 * Mock Redis client for testing
 * This provides a consistent mock across all services
 */
export const createMockRedisClient = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockResolvedValue(false),
  expire: jest.fn().mockResolvedValue(true),
  setJSON: jest.fn().mockResolvedValue(true),
  getJSON: jest.fn().mockResolvedValue(null),
  sAdd: jest.fn().mockResolvedValue(1),
  sMembers: jest.fn().mockResolvedValue([]),
  sRem: jest.fn().mockResolvedValue(1),
  sCard: jest.fn().mockResolvedValue(0),
  zAdd: jest.fn().mockResolvedValue(1),
  zCard: jest.fn().mockResolvedValue(0),
  zRemRangeByScore: jest.fn().mockResolvedValue(0),
  incr: jest.fn().mockResolvedValue(1),
  multi: jest.fn().mockResolvedValue([]),
  ping: jest.fn().mockResolvedValue(true),
  isReady: true,
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
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
