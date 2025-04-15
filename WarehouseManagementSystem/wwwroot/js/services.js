/**
 * Notification Service implementation
 * @implements {INotificationService}
 */
const notificationService = (function() {
    // Private properties
    let notificationTimeout = null;
    
    // Private methods
    const createNotificationElement = () => {
        // Check if notification container already exists
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-4 max-w-md w-full transition-all';
            document.body.appendChild(container);
        }
        return container;
    };
    
    return {
        /**
         * Show a notification to the user
         * @param {string} message - Notification message
         * @param {'success'|'error'|'info'|'warning'} type - Notification type
         */
        showNotification: function(message, type = 'info') {
            console.log(`[Notification] ${type}: ${message}`);
            
            // Create container if it doesn't exist
            const container = createNotificationElement();
            
            // Create notification element
            const notification = document.createElement('div');
            
            // Set appropriate background color based on type
            let bgColor, iconClass, textColor;
            switch (type) {
                case 'success':
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                    iconClass = 'ri-check-line';
                    break;
                case 'error':
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                    iconClass = 'ri-error-warning-line';
                    break;
                case 'warning':
                    bgColor = 'bg-yellow-100';
                    textColor = 'text-yellow-800';
                    iconClass = 'ri-alert-line';
                    break;
                case 'info':
                default:
                    bgColor = 'bg-blue-100';
                    textColor = 'text-blue-800';
                    iconClass = 'ri-information-line';
                    break;
            }
            
            // Set notification content
            notification.className = `flex items-start gap-3 p-4 rounded shadow-lg ${bgColor} ${textColor} transition-all`;
            notification.innerHTML = `
                <div class="flex-shrink-0 text-xl mt-1">
                    <i class="${iconClass}"></i>
                </div>
                <div class="flex-grow">
                    <p>${message}</p>
                </div>
                <button class="flex-shrink-0 text-gray-500 hover:text-gray-700" onclick="this.parentNode.remove()">
                    <i class="ri-close-line"></i>
                </button>
            `;
            
            // Add to container
            container.appendChild(notification);
            
            // Add appear animation
            setTimeout(() => {
                notification.classList.add('opacity-100');
            }, 10);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.classList.add('opacity-0');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, 5000);
        },
        
        /**
         * Hide all notifications
         */
        hideNotification: function() {
            const container = document.getElementById('notification-container');
            if (container) {
                container.innerHTML = '';
            }
        }
    };
})();

/**
 * Modal Service implementation
 * @implements {IModalService}
 */
const modalService = (function() {
    // Debug mode flag
    const debugMode = true;
    
    // Private helper functions
    const log = (message) => {
        if (debugMode) {
            console.log(`[Modal] ${message}`);
        }
    };
    
    return {
        /**
         * Show a modal dialog
         * @param {string} modalId - ID of the modal to show
         */
        showModal: function(modalId) {
            log(`Showing modal: ${modalId}`);
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                log(`Modal ${modalId} activated`);
                
                // Dispatch custom event that modal was shown
                const event = new CustomEvent('modalShown', { detail: { modalId } });
                document.dispatchEvent(event);
            } else {
                console.error(`Modal with ID ${modalId} not found`);
            }
        },
        
        /**
         * Hide a modal dialog
         * @param {string} modalId - ID of the modal to hide
         */
        hideModal: function(modalId) {
            log(`Hiding modal: ${modalId}`);
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                log(`Modal ${modalId} deactivated`);
                
                // Dispatch custom event that modal was hidden
                const event = new CustomEvent('modalHidden', { detail: { modalId } });
                document.dispatchEvent(event);
            } else {
                console.error(`Modal with ID ${modalId} not found`);
            }
        }
    };
})();

// Global event delegation for modals
document.addEventListener('click', function(e) {
    // Open modal buttons
    if (e.target.matches('[data-modal]') || e.target.closest('[data-modal]')) {
        const button = e.target.matches('[data-modal]') ? e.target : e.target.closest('[data-modal]');
        const modalId = button.getAttribute('data-modal');
        modalService.showModal(modalId);
    }
    
    // Close modal buttons
    if (e.target.matches('[data-close-modal]') || e.target.closest('[data-close-modal]')) {
        const button = e.target.matches('[data-close-modal]') ? e.target : e.target.closest('[data-close-modal]');
        const modalId = button.getAttribute('data-close-modal');
        modalService.hideModal(modalId);
    }
    
    // Add debug click logging for all buttons and clickable items
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
        const id = button.id || 'unnamed';
        const text = button.textContent.trim();
        console.log(`[Click] Button: ${id} - "${text}"`);
    }
}); 