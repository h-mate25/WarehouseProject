/**
 * Example test suite for the Warehouse Management System
 */

describe('WMS Basic Functionality', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
  });

  test('object assignment', () => {
    const data = { one: 1 };
    data['two'] = 2;
    expect(data).toEqual({ one: 1, two: 2 });
  });

  test('null is falsy', () => {
    const n = null;
    expect(n).toBeFalsy();
    expect(n).not.toBeTruthy();
    expect(n).toBeNull();
  });
});

describe('DOM Manipulation', () => {
  beforeEach(() => {
    // Setup a basic DOM element for testing
    document.body.innerHTML = `
      <div id="container">
        <button id="testButton">Click Me</button>
        <span id="result"></span>
      </div>
    `;
  });

  test('can interact with DOM elements', () => {
    const button = document.getElementById('testButton');
    const result = document.getElementById('result');
    
    // Mock a click handler
    button.addEventListener('click', () => {
      result.textContent = 'Button clicked';
    });
    
    // Simulate a click
    button.click();
    
    // Verify the result
    expect(result.textContent).toBe('Button clicked');
  });
}); 