/**
 * Notification Service
 * Provides functions for displaying notifications to the user
 */
// Use the implementation from services.js if it exists, otherwise create a new one
window.notificationServiceImpl = window.notificationServiceImpl || (function() {
    const debugMode = true;
    
    // Private helper functions
    const log = (message) => {
        if (debugMode) {
            console.log(`[Notification Service] ${message}`);
        }
    };
    
    // Initialize 
    let initialized = false;
    
    // Initialize notification service
    function init() {
        if (initialized) {
            log('Already initialized');
            return;
        }
        
        log('Initializing Notification Service');
        
        // Create notification container if it doesn't exist
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
            document.body.appendChild(notificationContainer);
        }
        
        initialized = true;
        log('Initialization complete');
    }
    
    /**
     * Show a notification to the user
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, warning, info)
     * @param {number} duration - How long to show the notification in ms (default: 5000)
     */
    function showNotification(message, type = 'info', duration = 5000) {
        log(`Showing notification: ${message} (${type})`);
        
        // Initialize if not already
        if (!initialized) {
            init();
        }
        
        // Get notification container
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error('Notification container not found');
            return;
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `transform transition-all duration-300 ease-out translate-x-full opacity-0 flex items-center p-3 rounded-lg shadow-lg max-w-sm`;
        
        // Set colors based on type
        let bgColor, textColor, iconClass;
        switch (type) {
            case 'success':
                bgColor = 'bg-green-500';
                textColor = 'text-white';
                iconClass = 'ri-check-line';
                break;
            case 'error':
                bgColor = 'bg-red-500';
                textColor = 'text-white';
                iconClass = 'ri-error-warning-line';
                break;
            case 'warning':
                bgColor = 'bg-yellow-500';
                textColor = 'text-gray-900';
                iconClass = 'ri-alert-line';
                break;
            case 'info':
            default:
                bgColor = 'bg-blue-500';
                textColor = 'text-white';
                iconClass = 'ri-information-line';
                break;
        }
        
        notification.classList.add(bgColor, textColor);
        
        // Set content
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0 mr-3">
                    <i class="${iconClass} text-lg"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="inline-flex text-gray-100 hover:text-white focus:outline-none">
                        <i class="ri-close-line text-lg"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Add close button event
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => {
            hideNotification(notification);
        });
        
        // Show with animation
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);
        
        // Auto hide after duration
        if (duration > 0) {
            setTimeout(() => {
                hideNotification(notification);
            }, duration);
        }
        
        return notification;
    }
    
    /**
     * Hide a notification
     * @param {HTMLElement} notification - The notification element to hide
     */
    function hideNotification(notification) {
        log('Hiding notification');
        
        // Add animation classes
        notification.classList.add('translate-x-full', 'opacity-0');
        
        // Remove after animation completes
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
    
    /**
     * Hide all notifications
     */
    function hideAllNotifications() {
        log('Hiding all notifications');
        
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notifications = container.querySelectorAll('div');
        notifications.forEach(notification => {
            hideNotification(notification);
        });
    }
    
    /**
     * Show a success notification
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the notification in ms
     */
    function showSuccess(message, duration) {
        return showNotification(message, 'success', duration);
    }
    
    /**
     * Show an error notification
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the notification in ms
     */
    function showError(message, duration) {
        return showNotification(message, 'error', duration);
    }
    
    /**
     * Show a warning notification
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the notification in ms
     */
    function showWarning(message, duration) {
        return showNotification(message, 'warning', duration);
    }
    
    /**
     * Show an info notification
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the notification in ms
     */
    function showInfo(message, duration) {
        return showNotification(message, 'info', duration);
    }
    
    // Public API
    return {
        init,
        showNotification,
        hideNotification,
        hideAllNotifications,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
})();

// Check if notificationService is already defined in services.js
if (!window.notificationService) {
    // Use our implementation if not already defined
    window.notificationService = window.notificationServiceImpl;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Notification Service] DOM Content Loaded');
    
    // Initialize the notification service if it's our implementation
    try {
        if (window.notificationService === window.notificationServiceImpl && 
            typeof window.notificationService.init === 'function') {
            window.notificationService.init();
        }
    } catch (error) {
        console.error('Failed to initialize notification service:', error);
    }
});

// Expose global function for backward compatibility
window.showNotification = function(message, type = 'info', duration = 5000) {
    console.log(`Global showNotification called: ${message} (${type})`);
    if (typeof notificationService !== 'undefined' && typeof notificationService.showNotification === 'function') {
        notificationService.showNotification(message, type, duration);
    } else {
        console.error('notificationService.showNotification is not available');
        // Fallback implementation
        alert(message);
    }
};