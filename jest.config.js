// @ts-ignore
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  transform: {
    '^.+\\.(ts|js)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.config.ts',
    '!src/**/migrations/*.ts',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 10,
      lines: 35,
      statements: 40,
    },
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
  },
  modulePathIgnorePatterns: [],
  transformIgnorePatterns: ['node_modules/(?!((\\.pnpm/)?uuid))'],
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
      },
      transform: {
        '^.+\\.(ts|js)$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.test.json',
          },
        ],
      },
      transformIgnorePatterns: ['node_modules/(?!((\\.pnpm/)?uuid))'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
      },
      roots: ['<rootDir>/src/', '<rootDir>/test/'],
      transform: {
        '^.+\\.(ts|js)$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.test.json',
          },
        ],
        '^.+\\.js$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.test.json',
          },
        ],
      },
      transformIgnorePatterns: ['node_modules/(?!((\\.pnpm/)?uuid))'],
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/e2e/**/*.(e2e-spec|spec).ts'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
      },
      transform: {
        '^.+\\.(ts|js)$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.test.json',
          },
        ],
        '^.+\\.js$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.test.json',
          },
        ],
      },
      transformIgnorePatterns: ['node_modules/(?!((\\.pnpm/)?uuid))'],
    },
  ],
};
