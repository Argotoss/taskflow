import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.(spec|test)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: './tsconfig.json' }]
  },
  coverageDirectory: '../../coverage/backend/unit',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};

export default config;
