/**
 * Jest configuration for Warehouse Management System
 */

module.exports = {
  // The root directory where Jest should scan for files
  rootDir: './',
  
  // The test environment to use
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/wwwroot/js/tests/**/*.test.js"
  ],
  
  // Setup file to run before each test
  setupFilesAfterEnv: [
    "<rootDir>/wwwroot/js/tests/setup-jest.js"
  ],
  
  // Transform files with babel-jest
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected
  collectCoverage: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  
  // Ignore these directories
  transformIgnorePatterns: [
    "/node_modules/",
    "/lib/"
  ],
  
  // Verbose output
  verbose: true
}; 