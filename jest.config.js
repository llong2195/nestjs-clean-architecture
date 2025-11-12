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
        tsconfig: 'tsconfig.json',
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
  transformIgnorePatterns: ['node_modules/(?!((\\.pnpm/)?uuid))'],
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
          },
        ],
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
          },
        ],
      },
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
          },
        ],
      },
    },
  ],
};
