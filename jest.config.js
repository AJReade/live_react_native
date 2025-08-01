module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/js/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/example/',
    '<rootDir>/dist/',
    '<rootDir>/assets/',
    '<rootDir>/live_react_examples/',
    '<rootDir>/live_react_native_examples/',
    '<rootDir>/deps/',
    '<rootDir>/lib/',
    '<rootDir>/config/',
    '<rootDir>/guides/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/assets/',
    '<rootDir>/live_react_examples/',
    '<rootDir>/live_react_native_examples/',
    '<rootDir>/deps/',
    '<rootDir>/lib/',
  ],
  collectCoverageFrom: [
    'js/**/*.{ts,tsx}',
    '!js/**/*.d.ts',
    '!js/**/*.test.{ts,tsx}',
    '!js/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/js/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|phoenix)/)',
  ],
};