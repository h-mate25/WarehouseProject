/**
 * Unit tests for ActivityLog class
 */

// Import or require the setup if needed
require('./setup-activity-log');

describe('ActivityLog', () => {
  // Helper function to create ActivityLog instance with custom data
  function createActivityLog(customData = {}) {
    return new ActivityLog(customData);
  }
  
  describe('constructor', () => {
    test('should create instance with default values when no data provided', () => {
      const log = new ActivityLog();
      
      expect(log.id).toBe(0);
      expect(log.actionType).toBe('Info');
      expect(log.description).toBe('');
      expect(log.itemSKU).toBeNull();
      expect(log.timestamp).toBeInstanceOf(Date);
      expect(log.userName).toBe('System');
    });
    
    test('should set properties from provided data', () => {
      const now = new Date();
      const data = {
        id: 123,
        actionType: 'Add',
        description: 'Test description',
        itemSKU: 'SKU123',
        timestamp: now,
        userName: 'TestUser'
      };
      
      const log = new ActivityLog(data);
      
      expect(log.id).toBe(123);
      expect(log.actionType).toBe('Add');
      expect(log.description).toBe('Test description');
      expect(log.itemSKU).toBe('SKU123');
      expect(log.timestamp).toEqual(now);
      expect(log.userName).toBe('TestUser');
    });
    
    test('should convert timestamp string to Date object', () => {
      const dateStr = '2023-04-15T14:30:45.123Z';
      const log = new ActivityLog({ timestamp: dateStr });
      
      expect(log.timestamp).toBeInstanceOf(Date);
      expect(log.timestamp.toISOString()).toBe(dateStr);
    });
  });
  
  describe('getBgColorClass', () => {
    test('should return bg-blue-100 for Add action type', () => {
      const log = createActivityLog({ actionType: 'Add' });
      expect(log.getBgColorClass()).toBe('bg-blue-100');
    });
    
    test('should return bg-red-100 for Remove action type', () => {
      const log = createActivityLog({ actionType: 'Remove' });
      expect(log.getBgColorClass()).toBe('bg-red-100');
    });
    
    test('should return bg-yellow-100 for Update action type', () => {
      const log = createActivityLog({ actionType: 'Update' });
      expect(log.getBgColorClass()).toBe('bg-yellow-100');
    });
    
    test('should return bg-green-100 for Move action type', () => {
      const log = createActivityLog({ actionType: 'Move' });
      expect(log.getBgColorClass()).toBe('bg-green-100');
    });
    
    test('should return bg-pink-100 for Error action type', () => {
      const log = createActivityLog({ actionType: 'Error' });
      expect(log.getBgColorClass()).toBe('bg-pink-100');
    });
    
    test('should return bg-gray-100 for unknown action type', () => {
      const log = createActivityLog({ actionType: 'Unknown' });
      expect(log.getBgColorClass()).toBe('bg-gray-100');
    });
    
    test('should return bg-gray-100 for default Info action type', () => {
      const log = createActivityLog();
      expect(log.getBgColorClass()).toBe('bg-gray-100');
    });
  });
  
  describe('getTextColorClass', () => {
    test('should return text-blue-600 for Add action type', () => {
      const log = createActivityLog({ actionType: 'Add' });
      expect(log.getTextColorClass()).toBe('text-blue-600');
    });
    
    test('should return text-red-600 for Remove action type', () => {
      const log = createActivityLog({ actionType: 'Remove' });
      expect(log.getTextColorClass()).toBe('text-red-600');
    });
    
    test('should return text-yellow-600 for Update action type', () => {
      const log = createActivityLog({ actionType: 'Update' });
      expect(log.getTextColorClass()).toBe('text-yellow-600');
    });
    
    test('should return text-green-600 for Move action type', () => {
      const log = createActivityLog({ actionType: 'Move' });
      expect(log.getTextColorClass()).toBe('text-green-600');
    });
    
    test('should return text-pink-600 for Error action type', () => {
      const log = createActivityLog({ actionType: 'Error' });
      expect(log.getTextColorClass()).toBe('text-pink-600');
    });
    
    test('should return text-gray-600 for unknown action type', () => {
      const log = createActivityLog({ actionType: 'Unknown' });
      expect(log.getTextColorClass()).toBe('text-gray-600');
    });
    
    test('should return text-gray-600 for default Info action type', () => {
      const log = createActivityLog();
      expect(log.getTextColorClass()).toBe('text-gray-600');
    });
  });
  
  describe('getIconClass', () => {
    test('should return ri-add-line for Add action type', () => {
      const log = createActivityLog({ actionType: 'Add' });
      expect(log.getIconClass()).toBe('ri-add-line');
    });
    
    test('should return ri-subtract-line for Remove action type', () => {
      const log = createActivityLog({ actionType: 'Remove' });
      expect(log.getIconClass()).toBe('ri-subtract-line');
    });
    
    test('should return ri-edit-line for Update action type', () => {
      const log = createActivityLog({ actionType: 'Update' });
      expect(log.getIconClass()).toBe('ri-edit-line');
    });
    
    test('should return ri-arrow-left-right-line for Move action type', () => {
      const log = createActivityLog({ actionType: 'Move' });
      expect(log.getIconClass()).toBe('ri-arrow-left-right-line');
    });
    
    test('should return ri-error-warning-line for Error action type', () => {
      const log = createActivityLog({ actionType: 'Error' });
      expect(log.getIconClass()).toBe('ri-error-warning-line');
    });
    
    test('should return ri-information-line for unknown action type', () => {
      const log = createActivityLog({ actionType: 'Unknown' });
      expect(log.getIconClass()).toBe('ri-information-line');
    });
    
    test('should return ri-information-line for default Info action type', () => {
      const log = createActivityLog();
      expect(log.getIconClass()).toBe('ri-information-line');
    });
  });
  
  describe('getFriendlyTimeDisplay', () => {
    beforeEach(() => {
      // Mock Date.now to return a fixed date
      jest.spyOn(Date, 'now').mockImplementation(() => new Date('2023-04-15T12:00:00Z').getTime());
      // Mock new Date() to return a fixed date
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new Date('2023-04-15T12:00:00Z');
          }
          return super(...args);
        }
      };
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
      global.Date = Date;
    });
    
    test('should return "Just now" for timestamps less than a minute ago', () => {
      const timestamp = new Date('2023-04-15T11:59:30Z'); // 30 seconds ago
      const log = createActivityLog({ timestamp });
      expect(log.getFriendlyTimeDisplay()).toBe('Just now');
    });
    
    test('should return "1 minute ago" for timestamps 1 minute ago', () => {
      const timestamp = new Date('2023-04-15T11:59:00Z'); // 1 minute ago
      const log = createActivityLog({ timestamp });
      expect(log.getFriendlyTimeDisplay()).toBe('1 minute ago');
    });
    
    test('should return "X minutes ago" for timestamps less than an hour ago', () => {
      const timestamp = new Date('2023-04-15T11:30:00Z'); // 30 minutes ago
      const log = createActivityLog({ timestamp });
      expect(log.getFriendlyTimeDisplay()).toBe('30 minutes ago');
    });
    
    test('should return "1 hour ago" for timestamps 1 hour ago', () => {
      const timestamp = new Date('2023-04-15T11:00:00Z'); // 1 hour ago
      const log = createActivityLog({ timestamp });
      expect(log.getFriendlyTimeDisplay()).toBe('1 hour ago');
    });
    
    test('should return "X hours ago" for timestamps less than a day ago', () => {
      const timestamp = new Date('2023-04-15T06:00:00Z'); // 6 hours ago
      const log = createActivityLog({ timestamp });
      expect(log.getFriendlyTimeDisplay()).toBe('6 hours ago');
    });
    
    test('should return "Yesterday" for timestamps 1 day ago', () => {
      const timestamp = new Date('2023-04-14T12:00:00Z'); // 1 day ago
      const log = createActivityLog({ timestamp });
      expect(log.getFriendlyTimeDisplay()).toBe('Yesterday');
    });
    
    test('should return "X days ago" for timestamps less than a week ago', () => {
      const timestamp = new Date('2023-04-12T12:00:00Z'); // 3 days ago
      const log = createActivityLog({ timestamp });
      expect(log.getFriendlyTimeDisplay()).toBe('3 days ago');
    });
    
    test('should return formatted date for timestamps older than a week', () => {
      const timestamp = new Date('2023-04-01T12:00:00Z'); 
      const log = createActivityLog({ timestamp });
      
      // Format expected date using same format as in the class
      const expected = timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      expect(log.getFriendlyTimeDisplay()).toBe(expected);
    });
  });
}); 