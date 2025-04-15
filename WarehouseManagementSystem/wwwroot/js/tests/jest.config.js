module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '../**/*.js',
    '!../**/node_modules/**',
    '!../**/dist/**',
    '!../**/vendor/**',
    '!../**/tests/**'
  ],
  testMatch: ['<rootDir>/**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../$1'
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],
  verbose: true
}; 