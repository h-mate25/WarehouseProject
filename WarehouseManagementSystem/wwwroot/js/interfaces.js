/**
 * @typedef {Object} Item
 * @property {string} sku - Unique item identifier
 * @property {string} name - Item name
 * @property {string} category - Item category
 * @property {number} quantity - Current quantity in stock
 * @property {string} location - Storage location
 * @property {string} condition - Item condition (New, Good, etc.)
 * @property {string} notes - Additional notes
 */

/**
 * @typedef {Object} Shipment
 * @property {string} id - Unique shipment identifier
 * @property {string} type - Inbound or Outbound
 * @property {string} partnerName - Supplier/Customer name
 * @property {string} items - Description of items
 * @property {string} status - Current status
 * @property {string} eta - Estimated time of arrival
 * @property {string} priority - Priority level
 * @property {string} notes - Additional notes
 */

/**
 * @typedef {Object} Stocktake
 * @property {string} id - Unique stocktake identifier
 * @property {string} zone - Warehouse zone
 * @property {string} shelf - Shelf identifier
 * @property {string} status - Current status
 * @property {string} notes - Additional notes
 */

/**
 * API Service Interface
 * @interface
 */
class IApiService {
    /**
     * Get all inventory items
     * @returns {Promise<Item[]>}
     */
    async getItems() {}

    /**
     * Get a specific item by SKU
     * @param {string} sku - Item SKU
     * @returns {Promise<Item>}
     */
    async getItem(sku) {}

    /**
     * Create a new inventory item
     * @param {Item} item - Item to create
     * @returns {Promise<Item>}
     */
    async createItem(item) {}

    /**
     * Update an existing inventory item
     * @param {string} sku - Item SKU
     * @param {Item} item - Updated item data
     * @returns {Promise<Response>}
     */
    async updateItem(sku, item) {}

    /**
     * Delete an inventory item
     * @param {string} sku - Item SKU to delete
     * @returns {Promise<Response>}
     */
    async deleteItem(sku) {}

    /**
     * Get all shipments
     * @returns {Promise<Shipment[]>}
     */
    async getShipments() {}

    /**
     * Get shipments by type (Inbound/Outbound)
     * @param {string} type - Shipment type
     * @returns {Promise<Shipment[]>}
     */
    async getShipmentsByType(type) {}

    /**
     * Create a new shipment
     * @param {Shipment} shipment - Shipment to create
     * @returns {Promise<Shipment>}
     */
    async createShipment(shipment) {}

    /**
     * Update an existing shipment
     * @param {string} id - Shipment ID
     * @param {Shipment} shipment - Updated shipment data
     * @returns {Promise<Response>}
     */
    async updateShipment(id, shipment) {}

    /**
     * Delete a shipment
     * @param {string} id - Shipment ID to delete
     * @returns {Promise<Response>}
     */
    async deleteShipment(id) {}

    /**
     * Get all stocktakes
     * @returns {Promise<Stocktake[]>}
     */
    async getStocktakes() {}

    /**
     * Create a new stocktake
     * @param {Stocktake} stocktake - Stocktake to create
     * @returns {Promise<Stocktake>}
     */
    async createStocktake(stocktake) {}

    /**
     * Complete a stocktake
     * @param {string} id - Stocktake ID
     * @returns {Promise<Response>}
     */
    async completeStocktake(id) {}

    /**
     * Delete a stocktake
     * @param {string} id - Stocktake ID to delete
     * @returns {Promise<Response>}
     */
    async deleteStocktake(id) {}
}

/**
 * Notification Service Interface
 * @interface
 */
class INotificationService {
    /**
     * Show a notification to the user
     * @param {string} message - Notification message
     * @param {'success'|'error'|'info'|'warning'} type - Notification type
     */
    showNotification(message, type) {}

    /**
     * Hide the current notification
     */
    hideNotification() {}
}

/**
 * Modal Service Interface
 * @interface
 */
class IModalService {
    /**
     * Show a modal dialog
     * @param {string} modalId - ID of the modal to show
     */
    showModal(modalId) {}

    /**
     * Hide a modal dialog
     * @param {string} modalId - ID of the modal to hide
     */
    hideModal(modalId) {}
}

/**
 * Inventory Management Interface
 * @interface
 */
class IInventoryManager {
    /**
     * Load inventory items from the API
     * @returns {Promise<void>}
     */
    async loadItems() {}

    /**
     * Update dashboard statistics with item data
     * @param {Item[]} items - Inventory items
     */
    updateDashboardStats(items) {}

    /**
     * Submit the form to add a new item
     */
    submitAddItemForm() {}

    /**
     * Submit the form to add a scanned item
     */
    submitScanForm() {}
} 