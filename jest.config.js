module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: [],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
