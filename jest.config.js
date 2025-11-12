// @ts-ignore
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/modules/**/domain/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/modules/**/application/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
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
