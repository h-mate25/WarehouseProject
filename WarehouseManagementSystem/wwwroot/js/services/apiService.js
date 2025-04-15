class ApiService {
    constructor() {
        this.baseUrl = '/api';
    }

    /**
     * Handles HTTP errors and transforms into a standardized error response
     * @param {Response} response - Fetch API response
     * @returns {Promise} Resolved with JSON or rejected with error
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}): ${errorText}`);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Performs a GET request to the specified endpoint
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Promise with the API response
     */
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            return this.handleResponse(response);
        } catch (error) {
            console.error(`GET request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Performs a POST request to the specified endpoint
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send in the request body
     * @returns {Promise} Promise with the API response
     */
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error(`POST request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Performs a PUT request to the specified endpoint
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send in the request body
     * @returns {Promise} Promise with the API response
     */
    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error(`PUT request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Performs a DELETE request to the specified endpoint
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Promise with the API response
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE'
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error(`DELETE request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Inventory specific methods
    /**
     * Fetches inventory items
     * @returns {Promise<Array>} Promise resolving to an array of items
     */
    async getInventoryItems() {
        return this.get('/inventory');
    }
    
    /**
     * Fetches a specific inventory item by SKU
     * @param {string} sku - The item's SKU
     * @returns {Promise<Object>} Promise resolving to item object
     */
    async getInventoryItem(sku) {
        return this.get(`/inventory/${sku}`);
    }
    
    /**
     * Creates a new inventory item
     * @param {Object} item - The item to create
     * @returns {Promise<Object>} Promise resolving to created item
     */
    async createInventoryItem(item) {
        return this.post('/inventory', item);
    }
    
    /**
     * Updates an existing inventory item
     * @param {string} sku - The item's SKU
     * @param {Object} item - The updated item data
     * @returns {Promise<Object>} Promise resolving to updated item
     */
    async updateInventoryItem(sku, item) {
        return this.put(`/inventory/${sku}`, item);
    }
    
    /**
     * Deletes an inventory item
     * @param {string} sku - The item's SKU
     * @returns {Promise<Object>} Promise resolving to deletion result
     */
    async deleteInventoryItem(sku) {
        return this.delete(`/inventory/${sku}`);
    }
    
    /**
     * Fetches stock movement data
     * @param {number} days - Number of days to get data for (default: 30)
     * @returns {Promise<Object>} Promise resolving to stock movement data
     */
    async getStockMovement(days = 30) {
        return this.get(`/reports/stockMovement?days=${days}`);
    }
    
    /**
     * Fetches recent activity logs
     * @param {number} limit - Number of logs to retrieve (default: 10)
     * @returns {Promise<Array>} Promise resolving to array of activity logs
     */
    async getRecentActivity(limit = 10) {
        return this.get(`/activity?limit=${limit}`);
    }
    
    /**
     * Logs a new activity
     * @param {Object} activity - Activity data to log
     * @returns {Promise<Object>} Promise resolving to created activity log
     */
    async logActivity(activity) {
        return this.post('/activity', activity);
    }
}

// Make service available globally
window.apiService = new ApiService(); 