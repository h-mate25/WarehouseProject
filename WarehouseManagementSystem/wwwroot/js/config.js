/**
 * Global Configuration
 * Contains application-wide configuration settings
 */

// API Configuration
const API_BASE_URL = '/api';  // This is OK as a relative path for same-origin requests

// Make configuration globally available
window.API_BASE_URL = API_BASE_URL;

// Export configuration for module usage
export const config = {
    API_BASE_URL
};