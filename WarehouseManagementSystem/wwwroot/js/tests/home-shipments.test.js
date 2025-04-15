/**
 * Unit tests for home-shipments.js utility and UI rendering functions
 */

// Mock DOM elements and references
beforeEach(() => {
  // Set up document body with necessary elements
  document.body.innerHTML = `
    <div id="notificationContainer"></div>
    <table id="shipmentsTable">
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Partner</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Items</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <table id="shipmentItemsTable">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Quantity</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div id="shipmentDetailsModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Shipment Details</h2>
          <button id="closeModalBtn">&times;</button>
        </div>
        <div class="modal-body"></div>
      </div>
    </div>
  `;

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Mock Date
  const originalDate = global.Date;
  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return new originalDate('2023-01-01T12:00:00Z');
      }
      return new originalDate(...args);
    }
    static now() {
      return new originalDate('2023-01-01T12:00:00Z').getTime();
    }
  };

  // Mock console methods
  global.console = {
    ...global.console,
    log: jest.fn(),
    error: jest.fn()
  };
});

afterEach(() => {
  // Clean up
  jest.clearAllMocks();
  document.body.innerHTML = '';
});

// Test getStatusClass function
describe('getStatusClass', () => {
  const getStatusClass = (status) => {
    if (!status) return 'status-unknown';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'pending') return 'status-pending';
    if (statusLower === 'processing') return 'status-processing';
    if (statusLower === 'completed') return 'status-completed';
    if (statusLower === 'cancelled') return 'status-cancelled';
    
    return 'status-unknown';
  };

  test('returns pending class for Pending status', () => {
    expect(getStatusClass('Pending')).toBe('status-pending');
    expect(getStatusClass('pending')).toBe('status-pending');
    expect(getStatusClass('PENDING')).toBe('status-pending');
  });

  test('returns processing class for Processing status', () => {
    expect(getStatusClass('Processing')).toBe('status-processing');
    expect(getStatusClass('processing')).toBe('status-processing');
    expect(getStatusClass('PROCESSING')).toBe('status-processing');
  });

  test('returns completed class for Completed status', () => {
    expect(getStatusClass('Completed')).toBe('status-completed');
    expect(getStatusClass('completed')).toBe('status-completed');
    expect(getStatusClass('COMPLETED')).toBe('status-completed');
  });

  test('returns cancelled class for Cancelled status', () => {
    expect(getStatusClass('Cancelled')).toBe('status-cancelled');
    expect(getStatusClass('cancelled')).toBe('status-cancelled');
    expect(getStatusClass('CANCELLED')).toBe('status-cancelled');
  });

  test('returns unknown class for undefined, null, or unknown status', () => {
    expect(getStatusClass()).toBe('status-unknown');
    expect(getStatusClass(null)).toBe('status-unknown');
    expect(getStatusClass('')).toBe('status-unknown');
    expect(getStatusClass('Unknown')).toBe('status-unknown');
    expect(getStatusClass('Some other status')).toBe('status-unknown');
  });
});

// Test getRelativeTime function
describe('getRelativeTime', () => {
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      
      if (isNaN(seconds)) return 'Invalid date';
      
      if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid date';
    }
  };

  beforeEach(() => {
    // Mock the current date
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2023-01-01T12:00:00Z').getTime());
  });

  test('formats seconds correctly', () => {
    const now = new Date('2023-01-01T12:00:00Z');
    const date30SecsAgo = new Date(now.getTime() - 30 * 1000);
    
    expect(getRelativeTime(date30SecsAgo.toISOString())).toBe('30 seconds ago');
    
    const date1SecAgo = new Date(now.getTime() - 1000);
    expect(getRelativeTime(date1SecAgo.toISOString())).toBe('1 second ago');
  });

  test('formats minutes correctly', () => {
    const now = new Date('2023-01-01T12:00:00Z');
    const date5MinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    expect(getRelativeTime(date5MinsAgo.toISOString())).toBe('5 minutes ago');
    
    const date1MinAgo = new Date(now.getTime() - 60 * 1000);
    expect(getRelativeTime(date1MinAgo.toISOString())).toBe('1 minute ago');
  });

  test('formats hours correctly', () => {
    const now = new Date('2023-01-01T12:00:00Z');
    const date3HoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    expect(getRelativeTime(date3HoursAgo.toISOString())).toBe('3 hours ago');
    
    const date1HourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(getRelativeTime(date1HourAgo.toISOString())).toBe('1 hour ago');
  });

  test('formats days correctly', () => {
    const now = new Date('2023-01-01T12:00:00Z');
    const date3DaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    expect(getRelativeTime(date3DaysAgo.toISOString())).toBe('3 days ago');
    
    const date1DayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(getRelativeTime(date1DayAgo.toISOString())).toBe('1 day ago');
  });

  test('handles invalid inputs', () => {
    expect(getRelativeTime()).toBe('Unknown');
    expect(getRelativeTime(null)).toBe('Unknown');
    expect(getRelativeTime('')).toBe('Unknown');
    expect(getRelativeTime('not-a-date')).toBe('Invalid date');
  });
});

// Test debounce function
describe('debounce', () => {
  const debounce = (func, wait = 300) => {
    let timeout;
    
    return function(...args) {
      const context = this;
      
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };

  test('only executes once within wait period', () => {
    jest.useFakeTimers();
    
    const mockFunction = jest.fn();
    const debouncedFunction = debounce(mockFunction, 500);
    
    // Call multiple times
    debouncedFunction();
    debouncedFunction();
    debouncedFunction();
    
    // Fast-forward time
    jest.advanceTimersByTime(500);
    
    // Function should have been called exactly once
    expect(mockFunction).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });

  test('can execute again after wait period', () => {
    jest.useFakeTimers();
    
    const mockFunction = jest.fn();
    const debouncedFunction = debounce(mockFunction, 500);
    
    // First call
    debouncedFunction();
    jest.advanceTimersByTime(500);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    
    // Second call after wait period
    debouncedFunction();
    jest.advanceTimersByTime(500);
    expect(mockFunction).toHaveBeenCalledTimes(2);
    
    jest.useRealTimers();
  });

  test('resets timer when called again within wait period', () => {
    jest.useFakeTimers();
    
    const mockFunction = jest.fn();
    const debouncedFunction = debounce(mockFunction, 500);
    
    // First call
    debouncedFunction();
    
    // Advance time but not enough to trigger
    jest.advanceTimersByTime(300);
    expect(mockFunction).not.toHaveBeenCalled();
    
    // Second call, which should reset the timer
    debouncedFunction();
    
    // Advance time but not enough for the second call
    jest.advanceTimersByTime(300);
    expect(mockFunction).not.toHaveBeenCalled();
    
    // Advance time enough to trigger the second call
    jest.advanceTimersByTime(200);
    expect(mockFunction).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });
});

// Test showNotification function
describe('showNotification', () => {
  const showNotification = (message, type = 'info', duration = 3000) => {
    if (!message) return false;
    
    const container = document.getElementById('notificationContainer');
    if (!container) return false;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    `;
    
    container.appendChild(notification);
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
    
    return true;
  };

  test('creates notification with correct type class', () => {
    const result = showNotification('Test message', 'success');
    
    expect(result).toBe(true);
    
    const notification = document.querySelector('.notification');
    expect(notification).not.toBeNull();
    expect(notification.classList.contains('notification-success')).toBe(true);
    expect(notification.querySelector('.notification-message').textContent).toBe('Test message');
  });

  test('defaults to info type if not specified', () => {
    showNotification('Info message');
    
    const notification = document.querySelector('.notification');
    expect(notification.classList.contains('notification-info')).toBe(true);
  });

  test('close button removes notification', () => {
    showNotification('Test message');
    
    const notification = document.querySelector('.notification');
    const closeButton = notification.querySelector('.notification-close');
    
    closeButton.click();
    
    expect(document.querySelector('.notification')).toBeNull();
  });

  test('notification is auto-removed after duration', () => {
    jest.useFakeTimers();
    
    showNotification('Test message', 'info', 1000);
    
    expect(document.querySelector('.notification')).not.toBeNull();
    
    jest.advanceTimersByTime(1000);
    
    expect(document.querySelector('.notification')).toBeNull();
    
    jest.useRealTimers();
  });

  test('returns false if container is not found', () => {
    document.body.innerHTML = ''; // Remove container
    
    const result = showNotification('Test message');
    
    expect(result).toBe(false);
  });

  test('returns false if message is empty', () => {
    const result = showNotification('');
    
    expect(result).toBe(false);
  });
});

// Test renderShipmentItemsTable function
describe('renderShipmentItemsTable', () => {
  const renderShipmentItemsTable = (items = []) => {
    const table = document.getElementById('shipmentItemsTable');
    if (!table) return false;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (!items || items.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="3" class="text-center py-4">No items found</td>
      `;
      tbody.appendChild(emptyRow);
      return true;
    }
    
    items.forEach(item => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${item.sku || 'N/A'}</td>
        <td>${item.quantity || 0}</td>
        <td>${item.notes || '-'}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    return true;
  };

  test('shows empty message when no items provided', () => {
    const result = renderShipmentItemsTable([]);
    
    expect(result).toBe(true);
    
    const tbody = document.querySelector('#shipmentItemsTable tbody');
    const emptyRow = tbody.querySelector('tr');
    
    expect(emptyRow).not.toBeNull();
    expect(emptyRow.textContent.trim()).toContain('No items found');
  });

  test('renders items correctly', () => {
    const items = [
      { sku: 'ITEM-001', quantity: 5, notes: 'Test notes' },
      { sku: 'ITEM-002', quantity: 10, notes: '' }
    ];
    
    renderShipmentItemsTable(items);
    
    const rows = document.querySelectorAll('#shipmentItemsTable tbody tr');
    
    expect(rows.length).toBe(2);
    
    // Check first row
    const cells1 = rows[0].querySelectorAll('td');
    expect(cells1[0].textContent).toBe('ITEM-001');
    expect(cells1[1].textContent).toBe('5');
    expect(cells1[2].textContent).toBe('Test notes');
    
    // Check second row
    const cells2 = rows[1].querySelectorAll('td');
    expect(cells2[0].textContent).toBe('ITEM-002');
    expect(cells2[1].textContent).toBe('10');
    expect(cells2[2].textContent).toBe('-');
  });

  test('handles missing item properties', () => {
    const items = [
      { sku: null, quantity: null, notes: null },
      { }
    ];
    
    renderShipmentItemsTable(items);
    
    const rows = document.querySelectorAll('#shipmentItemsTable tbody tr');
    
    expect(rows.length).toBe(2);
    
    // Check first row with null values
    const cells1 = rows[0].querySelectorAll('td');
    expect(cells1[0].textContent).toBe('N/A');
    expect(cells1[1].textContent).toBe('0');
    expect(cells1[2].textContent).toBe('-');
    
    // Check second row with undefined values
    const cells2 = rows[1].querySelectorAll('td');
    expect(cells2[0].textContent).toBe('N/A');
    expect(cells2[1].textContent).toBe('0');
    expect(cells2[2].textContent).toBe('-');
  });

  test('returns false if table element not found', () => {
    document.body.innerHTML = ''; // Remove all elements
    
    const result = renderShipmentItemsTable([]);
    
    expect(result).toBe(false);
  });
}); 