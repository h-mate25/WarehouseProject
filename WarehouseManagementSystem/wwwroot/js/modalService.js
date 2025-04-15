/**
 * Modal Service
 * Provides functions for working with modal windows
 */
if (typeof window.modalService === 'undefined') {
    console.log('[DEBUG] Creating modalService for the first time');
    window.modalService = (function() {
        const debugMode = true;
        
        
        // Private helper functions
        const log = (message) => {
            if (debugMode) {
                console.log(`[Modal Service] ${message}`);
            }
        };
        
        // Initialize 
        let initialized = false;
        
        // Initialize modal service and set up global event listeners
        function init() {
            if (initialized) {
                log('Already initialized');
                return;
            }
            
            log('Initializing Modal Service');
            
            // Set up event listeners for modal triggers
            setupModalTriggers();
            
            // Set up event listeners for closing modals
            setupModalCloseButtons();
            
            // Set up click outside to close
            setupClickOutsideToClose();
            
            // Set up ESC key to close
            setupEscKeyToClose();
            
            initialized = true;
            log('Initialization complete');
        }
        
        // Set up event listeners for buttons that open modals
        function setupModalTriggers() {
            log('Setting up modal triggers');
            
            const modalTriggers = document.querySelectorAll('[data-modal]');
            log(`Found ${modalTriggers.length} modal triggers`);
            
            modalTriggers.forEach(trigger => {
                trigger.addEventListener('click', function(event) {
                    event.preventDefault();
                    const modalId = this.getAttribute('data-modal');
                    log(`Modal trigger clicked for ${modalId}`);
                    showModal(modalId);
                });
            });
        }
        
        // Set up event listeners for buttons that close modals
        function setupModalCloseButtons() {
            log('Setting up modal close buttons');
            
            const closeButtons = document.querySelectorAll('[data-close-modal]');
            log(`Found ${closeButtons.length} close buttons`);
            
            closeButtons.forEach(button => {
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    const modalId = this.getAttribute('data-close-modal');
                    log(`Close button clicked for ${modalId}`);
                    hideModal(modalId);
                });
            });
        }
        
        // Set up click outside modal to close
        function setupClickOutsideToClose() {
            log('Setting up click outside to close');
            
            const modals = document.querySelectorAll('.modal');
            
            modals.forEach(modal => {
                modal.addEventListener('click', function(event) {
                    // Only close if the click was directly on the modal background
                    if (event.target === this) {
                        log('Click outside modal content, closing modal');
                        hideModal(this.id);
                    }
                });
            });
        }
        
        // Set up ESC key to close modal
        function setupEscKeyToClose() {
            log('Setting up ESC key to close');
            
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    log('ESC key pressed, closing active modal');
                    const activeModal = document.querySelector('.modal.active');
                    if (activeModal) {
                        hideModal(activeModal.id);
                    }
                }
            });
        }
        
        /**
         * Show a modal by ID
         * @param {string} modalId - The ID of the modal to show
         */
        function showModal(modalId) {
            log(`Showing modal: ${modalId}`);
            
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`Modal with ID ${modalId} not found`);
                return;
            }
            
            // Hide any other active modals
            document.querySelectorAll('.modal.active').forEach(activeModal => {
                if (activeModal !== modal) {
                    activeModal.classList.remove('active');
                }
            });
            
            // Show the modal
            modal.classList.add('active');
            
            // Prevent scrolling on the body
            document.body.style.overflow = 'hidden';
            
            // Focus the first input or button in the modal
            setTimeout(() => {
                const firstInput = modal.querySelector('input, button, select, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
            
            // Dispatch custom event
            const event = new CustomEvent('modalOpened', { detail: { modalId } });
            document.dispatchEvent(event);
        }
        
        /**
         * Hide a modal by ID
         * @param {string} modalId - The ID of the modal to hide
         */
        function hideModal(modalId) {
            log(`Hiding modal: ${modalId}`);
            
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`Modal with ID ${modalId} not found`);
                return;
            }
            
            // Hide the modal
            modal.classList.remove('active');
            
            // Restore scrolling on the body if no other modals are active
            if (document.querySelectorAll('.modal.active').length === 0) {
                document.body.style.overflow = '';
            }
            
            // Dispatch custom event
            const event = new CustomEvent('modalClosed', { detail: { modalId } });
            document.dispatchEvent(event);
        }
        
        /**
         * Toggle a modal by ID
         * @param {string} modalId - The ID of the modal to toggle
         */
        function toggleModal(modalId) {
            log(`Toggling modal: ${modalId}`);
            
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`Modal with ID ${modalId} not found`);
                return;
            }
            
            if (modal.classList.contains('active')) {
                hideModal(modalId);
            } else {
                showModal(modalId);
            }
        }
        
        /**
         * Check if a modal is currently visible
         * @param {string} modalId - The ID of the modal to check
         * @returns {boolean} - True if the modal is visible
         */
        function isModalVisible(modalId) {
            const modal = document.getElementById(modalId);
            return modal ? modal.classList.contains('active') : false;
        }
        
        // Public API
        return {
            init,
            showModal,
            hideModal,
            toggleModal,
            isModalVisible
        };
    })();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Modal Service] DOM Content Loaded');
    
    // Initialize the modal service
    try {
        window.modalService.init();
    } catch (error) {
        console.error('Failed to initialize modal service:', error);
    }
});

// Expose global window functions for backward compatibility
window.showModal = function(modalId) {
    console.log(`Global showModal called for ${modalId}`);
    if (typeof window.modalService !== 'undefined' && typeof window.modalService.showModal === 'function') {
        window.modalService.showModal(modalId);
    } else {
        console.error('modalService.showModal is not available');
        // Fallback implementation
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }
};

window.hideModal = function(modalId) {
    console.log(`Global hideModal called for ${modalId}`);
    if (typeof window.modalService !== 'undefined' && typeof window.modalService.hideModal === 'function') {
        window.modalService.hideModal(modalId);
    } else {
        console.error('modalService.hideModal is not available');
        // Fallback implementation
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
};

// Add closeModal function as an alias to hideModal for backward compatibility
window.closeModal = function(modalId) {
    console.log(`Global closeModal called for ${modalId} (alias to hideModal)`);
    window.hideModal(modalId);
}; 