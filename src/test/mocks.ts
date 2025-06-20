/**
 * Test utilities for mocking Redis and other common dependencies
 * These utilities are designed to work with Jest testing framework
 */

// Type for Jest mock function - defined here to avoid dependency on Jest types
type MockFunction = any;

/**
 * Creates a mock function that returns a resolved promise
 * This is equivalent to jest.fn().mockResolvedValue(value)
 */
const createMockResolvedValue = (value: any): MockFunction => {
  const mockFn = (() => Promise.resolve(value)) as any;
  mockFn.mockResolvedValue = (newValue: any) => {
    mockFn.mockImplementation(() => Promise.resolve(newValue));
    return mockFn;
  };
  mockFn.mockResolvedValueOnce = (newValue: any) => {
    let called = false;
    const originalImpl = mockFn;
    mockFn.mockImplementation((...args: any[]) => {
      if (!called) {
        called = true;
        return Promise.resolve(newValue);
      }
      return originalImpl(...args);
    });
    return mockFn;
  };
  return mockFn;
};

/**
 * Mock Redis client for testing
 * This provides a consistent mock across all services
 */
export const createMockRedisClient = () => ({
  get: createMockResolvedValue(null),
  set: createMockResolvedValue(true),
  del: createMockResolvedValue(true),
  exists: createMockResolvedValue(false),
  expire: createMockResolvedValue(true),
  setJSON: createMockResolvedValue(true),
  getJSON: createMockResolvedValue(null),
  sAdd: createMockResolvedValue(1),
  sMembers: createMockResolvedValue([]),
  sRem: createMockResolvedValue(1),
  sCard: createMockResolvedValue(0),
  zAdd: createMockResolvedValue(1),
  zCard: createMockResolvedValue(0),
  zRemRangeByScore: createMockResolvedValue(0),
  incr: createMockResolvedValue(1),
  multi: createMockResolvedValue([]),
  ping: createMockResolvedValue(true),
  isReady: true,
  connect: createMockResolvedValue(undefined),
  disconnect: createMockResolvedValue(undefined),
});

/**
 * Mock Redis connection class to prevent actual connections during tests
 * This will be used when TokenService tries to get a Redis instance
 */
export const createMockRedisConnection = () => {
  const mockClient = createMockRedisClient();

  return class MockRedisConnection {
    static getInstance = createMockResolvedValue(mockClient);
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
