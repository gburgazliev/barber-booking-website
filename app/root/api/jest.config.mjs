// jest.config.mjs
export default {
  projects: [
    {
      // Backend tests (CommonJS)
      displayName: 'backend',
      testMatch: [
        '<rootDir>/routes/**/?(*.)+(spec|test).js',
        '<rootDir>/models/**/?(*.)+(spec|test).js',
        '<rootDir>/middleware/**/?(*.)+(spec|test).js',
        '<rootDir>/helpers/**/?(*.)+(spec|test).js',
        '<rootDir>/__tests__/**/*.js'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/src/'
      ],
      transform: {
        '^.+\\.js$': 'babel-jest'
      },
      transformIgnorePatterns: [
        '/node_modules/'
      ],
      moduleFileExtensions: ['js', 'json'],
      testEnvironment: 'node'
    },
    {
      // Frontend tests (ES Modules)
      displayName: 'frontend',
      testMatch: [
        '<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)',
        '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)'
      ],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
      },
      transformIgnorePatterns: [
        '/node_modules/',
        '\\.pnp\\.[^\\/]+$'
      ],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
        '\\.(gif|ttf|eot|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
      },
      setupFilesAfterEnv: [
        '<rootDir>/src/setupTests.js'
      ],
      testEnvironment: 'jsdom'
    }
  ]
};