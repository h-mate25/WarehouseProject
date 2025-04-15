class ActivityLog {
    constructor(data) {
        this.id = data.id || 0;
        this.actionType = data.actionType || 'Info';
        this.description = data.description || '';
        this.itemSKU = data.itemSKU || null;
        this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
        this.userName = data.userName || 'System';
    }

    /**
     * Get the background color class based on action type
     * @returns {string} CSS class for background color
     */
    getBgColorClass() {
        switch (this.actionType) {
            case 'Add':
                return 'bg-blue-100';
            case 'Remove':
                return 'bg-red-100';
            case 'Update':
                return 'bg-yellow-100';
            case 'Move':
                return 'bg-green-100';
            case 'Error':
                return 'bg-pink-100';
            default:
                return 'bg-gray-100';
        }
    }

    /**
     * Get the text color class based on action type
     * @returns {string} CSS class for text color
     */
    getTextColorClass() {
        switch (this.actionType) {
            case 'Add':
                return 'text-blue-600';
            case 'Remove':
                return 'text-red-600';
            case 'Update':
                return 'text-yellow-600';
            case 'Move':
                return 'text-green-600';
            case 'Error':
                return 'text-pink-600';
            default:
                return 'text-gray-600';
        }
    }

    /**
     * Get the icon class based on action type
     * @returns {string} CSS class for icon
     */
    getIconClass() {
        switch (this.actionType) {
            case 'Add':
                return 'ri-add-line';
            case 'Remove':
                return 'ri-subtract-line';
            case 'Update':
                return 'ri-edit-line';
            case 'Move':
                return 'ri-arrow-left-right-line';
            case 'Error':
                return 'ri-error-warning-line';
            default:
                return 'ri-information-line';
        }
    }

    /**
     * Get a friendly time display (e.g., "2 hours ago")
     * @returns {string} Friendly time display
     */
    getFriendlyTimeDisplay() {
        const now = new Date();
        const diff = now - this.timestamp;
        
        // Convert milliseconds to seconds
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) {
            return 'Just now';
        }
        
        // Convert seconds to minutes
        const minutes = Math.floor(seconds / 60);
        
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        
        // Convert minutes to hours
        const hours = Math.floor(minutes / 60);
        
        if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        
        // Convert hours to days
        const days = Math.floor(hours / 24);
        
        if (days < 7) {
            return days === 1 ? 'Yesterday' : `${days} days ago`;
        }
        
        // Format date for anything older than a week
        return this.timestamp.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Make class available globally
window.ActivityLog = ActivityLog; 