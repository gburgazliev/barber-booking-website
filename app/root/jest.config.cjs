module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  // setupFilesAfterEnv: ['<rootDir>/setupTests.js']
};