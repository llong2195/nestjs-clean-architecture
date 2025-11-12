// @ts-ignore
module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['node_modules/(?!((\\.pnpm/)?uuid))'],
  transformIgnorePatterns: ['node_modules/(?!((\\.pnpm/)?uuid))'],
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.ts$': [
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
      },
      roots: ['<rootDir>/src/', '<rootDir>/test/'],
      transform: {
        '^.+\\.ts$': [
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
      },
      transform: {
        '^.+\\.ts$': [
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
