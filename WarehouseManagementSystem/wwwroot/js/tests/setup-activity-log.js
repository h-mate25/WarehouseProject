/**
 * Setup file for ActivityLog tests
 */

// Mock document and window if needed
if (typeof document === 'undefined') {
  global.document = {
    createElement: jest.fn().mockImplementation(() => ({
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      appendChild: jest.fn(),
      setAttribute: jest.fn()
    })),
    querySelector: jest.fn().mockImplementation(() => ({
      appendChild: jest.fn()
    })),
    body: {
      appendChild: jest.fn()
    }
  };
}

// Define the ActivityLog class to match the implementation
class ActivityLog {
  constructor(data = {}) {
    this.id = data.id || 0;
    this.actionType = data.actionType || 'Info';
    this.description = data.description || '';
    this.itemSKU = data.itemSKU || null;
    this.timestamp = data.timestamp ? (data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp)) : new Date();
    this.userName = data.userName || 'System';
  }

  getBgColorClass() {
    switch (this.actionType) {
      case 'Add': return 'bg-blue-100';
      case 'Remove': return 'bg-red-100';
      case 'Update': return 'bg-yellow-100';
      case 'Move': return 'bg-green-100';
      case 'Error': return 'bg-pink-100';
      default: return 'bg-gray-100';
    }
  }

  getTextColorClass() {
    switch (this.actionType) {
      case 'Add': return 'text-blue-600';
      case 'Remove': return 'text-red-600';
      case 'Update': return 'text-yellow-600';
      case 'Move': return 'text-green-600';
      case 'Error': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  }

  getIconClass() {
    switch (this.actionType) {
      case 'Add': return 'ri-add-line';
      case 'Remove': return 'ri-subtract-line';
      case 'Update': return 'ri-edit-line';
      case 'Move': return 'ri-arrow-left-right-line';
      case 'Error': return 'ri-error-warning-line';
      default: return 'ri-information-line';
    }
  }

  getFriendlyTimeDisplay() {
    const now = new Date();
    const diffMs = now - this.timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else {
      return this.timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
}

// Make ActivityLog available globally for tests
global.ActivityLog = ActivityLog; 