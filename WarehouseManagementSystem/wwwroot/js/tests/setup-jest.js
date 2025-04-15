/**
 * Jest setup file for Warehouse Management System
 * This file runs before each test
 */

// Mock global browser objects that might not exist in Jest environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock DOM elements and browser APIs that might be used in tests
global.MutationObserver = class {
  constructor(callback) {}
  disconnect() {}
  observe(element, initObject) {}
};

// Mock window methods that might be used in our JS
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Suppress console errors during tests
console.error = jest.fn();

// Add custom matchers if needed
expect.extend({
  // Example custom matcher
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Log when tests are starting
console.log('Jest test environment setup complete');

// Add any custom matchers or global test setup here
beforeEach(() => {
  // Reset any mocks before each test
  jest.clearAllMocks();
  
  // Setup document body for DOM testing
  document.body.innerHTML = '';
});

// Clean up after tests
afterEach(() => {
  document.body.innerHTML = '';
}); 