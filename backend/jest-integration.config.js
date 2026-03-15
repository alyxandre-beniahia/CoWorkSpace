module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'tests/integration/.*\\.integration\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  globalSetup: '<rootDir>/tests/setup/env-test.setup.js',
  globalTeardown: '<rootDir>/tests/setup/teardown-test-db.js',
};
