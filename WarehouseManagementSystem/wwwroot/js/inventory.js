// Debug statement to confirm the script is loaded
console.log('[DEBUG] inventory.js loaded at:', new Date().toISOString());

/**
 * Inventory Manager implementation
 * @implements {IInventoryManager}
 */
const inventoryManager = (function() {
    // Debug mode for extra logging
    const debugMode = true;
    
    // Private helper functions
    const log = (message) => {
        if (debugMode) {
            console.log(`[Inventory] ${message}`);
        }
    };
    
    // Initialize and track state
    let initialized = false;
    
    // Track activity pagination
    let activityPage = 1;
    const activityPageSize = 20;
    let activityHasMore = true;
    let activityTypeFilter = '';
    let activitySearchQuery = '';
    
    return {
        // Check if the manager has been initialized
        isInitialized: function() {
            return initialized;
        },

        init: function() {
            if (initialized) {
                log('Already initialized');
                return;
            }
            
            log('Initializing Inventory Manager');
            
            // Setup add item button event listeners
            this.setupAddItemEvents();
            
            // Setup activity modal button listeners
            this.setupActivityEvents();
            
            // Load inventory data
            this.loadItems();
            
            // Load stock movement data for chart
            this.loadStockMovementData();
            
            // Load recent activity data
            this.loadRecentActivity();
            
            initialized = true;
            log('Initialization complete');
        },

        // Setup add item button event listeners
        setupAddItemEvents: function() {
            log('Setting up Add Item events');
            
            // Setup Add Item button in the modal
            const addItemBtn = document.getElementById('addItemBtn');
            if (addItemBtn) {
                log('Add Item button found, attaching click event');
                
                // Remove existing event listeners
                const newAddItemBtn = addItemBtn.cloneNode(true);
                addItemBtn.parentNode.replaceChild(newAddItemBtn, addItemBtn);
                
                // Add fresh event listener
                newAddItemBtn.addEventListener('click', (event) => {
                    log('Add Item button clicked');
                    console.log('Add Item button clicked');
                    event.preventDefault();
                    this.submitAddItemForm();
                });
            } else {
                console.error('Add Item button not found in the modal');
            }
            
            // Setup modal trigger button
            const addItemModalTrigger = document.querySelector('[data-modal="addItemModal"]');
            if (addItemModalTrigger) {
                log('Add Item modal trigger found, attaching click event');
                
                addItemModalTrigger.addEventListener('click', () => {
                    log('Opening Add Item modal');
                    console.log('Opening Add Item modal');
                    if (typeof modalService !== 'undefined') {
                        modalService.showModal('addItemModal');
                    } else {
                        console.error('Modal service is not available');
                    }
                });
            } else {
                console.error('Add Item modal trigger button not found');
            }
        },
        
        /**
         * Set up activity modal related event listeners
         */
        setupActivityEvents: function() {
            log('Setting up activity events');
            
            // Setup View All activities button
            const viewAllActivitiesBtn = document.querySelector('[data-modal="allActivitiesModal"]');
            if (viewAllActivitiesBtn) {
                log('View All Activities button found, attaching click event');
                
                viewAllActivitiesBtn.addEventListener('click', () => {
                    log('View All Activities button clicked');
                    
                    // Reset pagination and filters
                    activityPage = 1;
                    activityHasMore = true;
                    
                    // Reset UI elements - do this BEFORE setting the filter variables
                    const typeFilterElement = document.getElementById('activityTypeFilter');
                    if (typeFilterElement) typeFilterElement.value = '';
                    
                    const searchInputElement = document.getElementById('activitySearchInput');
                    if (searchInputElement) searchInputElement.value = '';
                    
                    // Now set the filter variables
                    activityTypeFilter = '';
                    activitySearchQuery = '';
                    
                    // Load activities when modal is opened
                    this.loadAllActivities();
                });
            } else {
                console.error('View All Activities button not found');
            }
            
            // Setup activity type filter
            const activityTypeFilterElement = document.getElementById('activityTypeFilter');
            if (activityTypeFilterElement) {
                activityTypeFilterElement.addEventListener('change', () => {
                    // Reset pagination and apply filter
                    activityPage = 1;
                    activityHasMore = true;
                    activityTypeFilter = activityTypeFilterElement.value;
                    this.loadAllActivities();
                });
            }
            
            // Setup activity search
            const activitySearchInput = document.getElementById('activitySearchInput');
            if (activitySearchInput) {
                activitySearchInput.addEventListener('input', debounce(() => {
                    // Reset pagination and apply search
                    activityPage = 1;
                    activityHasMore = true;
                    activitySearchQuery = activitySearchInput.value.trim();
                    this.loadAllActivities();
                }, 500));
            }
            
            // Setup activity refresh button
            const activityRefreshBtn = document.getElementById('activityRefreshBtn');
            if (activityRefreshBtn) {
                activityRefreshBtn.addEventListener('click', () => {
                    // Reset pagination and reload
                    activityPage = 1;
                    activityHasMore = true;
                    this.loadAllActivities();
                });
            }
            
            // Setup load more button to load ALL activities at once
            const loadMoreActivitiesBtn = document.getElementById('loadMoreActivitiesBtn');
            if (loadMoreActivitiesBtn) {
                loadMoreActivitiesBtn.addEventListener('click', () => {
                    // Show loading state
                    loadMoreActivitiesBtn.disabled = true;
                    loadMoreActivitiesBtn.innerHTML = '<i class="ri-loader-2-line animate-spin mr-1"></i> Loading All Activities...';
                    
                    // Get current filter values to ensure we're using the correct ones
                    const currentTypeFilter = document.getElementById('activityTypeFilter')?.value || '';
                    const currentSearchQuery = document.getElementById('activitySearchInput')?.value || '';
                    
                    // Store for use in filtering
                    activityTypeFilter = currentTypeFilter;
                    activitySearchQuery = currentSearchQuery;
                    
                    // Load all remaining activities (500 maximum)
                    let fetchPromise;
                    
                    // Make sure we're passing the string value, not the element
                    if (currentTypeFilter) {
                        log(`Loading activities with type filter: "${currentTypeFilter}"`);
                        fetchPromise = api.getActivitiesByType(currentTypeFilter, 500);
                    } else {
                        log('Loading all activities without filter');
                        fetchPromise = api.getActivityLogs(500);
                    }
                    
                    fetchPromise.then(activities => {
                        log(`Loaded all ${activities.length} activities`);
                        
                        // Apply search filter if needed
                        if (currentSearchQuery && activities.length > 0) {
                            const query = currentSearchQuery.toLowerCase();
                            activities = activities.filter(activity => 
                                (activity.description && activity.description.toLowerCase().includes(query)) || 
                                (activity.itemSKU && activity.itemSKU.toLowerCase().includes(query)) ||
                                (activity.userName && activity.userName.toLowerCase().includes(query))
                            );
                        }
                        
                        // Get the table body
                        const tableBody = document.getElementById('allActivitiesTableBody');
                        if (!tableBody) {
                            console.error('Activities table body not found');
                            return;
                        }
                        
                        // Clear existing content
                        tableBody.innerHTML = '';
                        
                        // Render all activities
                        this.renderActivitiesTable(activities, false);
                        
                        // Hide the load more button since we've loaded everything
                        loadMoreActivitiesBtn.style.display = 'none';
                        
                        // Update or add count message
                        let countMessage = document.querySelector('.text-center.text-sm.text-gray-500.mt-2');
                        if (!countMessage) {
                            countMessage = document.createElement('p');
                            countMessage.className = 'text-center text-sm text-gray-500 mt-2';
                            const tableContainer = tableBody.closest('.overflow-auto');
                            if (tableContainer && tableContainer.nextElementSibling) {
                                tableContainer.nextElementSibling.prepend(countMessage);
                            }
                        }
                        
                        countMessage.textContent = `Showing all ${activities.length} activities`;
                    })
                    .catch(error => {
                        console.error('Failed to load all activities:', error);
                        loadMoreActivitiesBtn.disabled = false;
                        loadMoreActivitiesBtn.innerHTML = '<i class="ri-list-check-line mr-1"></i> Load All Activities';
                        
                        // Show error message
                        const errorMessage = document.createElement('p');
                        errorMessage.className = 'text-center text-sm text-red-500 mt-2';
                        errorMessage.textContent = `Error: ${error.message}`;
                        loadMoreActivitiesBtn.parentElement.appendChild(errorMessage);
                    });
                });
            }
        },
        
        /**
         * Load inventory items from the API
         * @param {boolean} updateStats - Whether to update dashboard stats with the loaded items
         * @returns {Promise<Array>} The loaded items
         */
        loadItems: async function(updateStats = true) {
            log('Loading inventory items from API');
            console.log('Debug - Loading items at:', new Date().toISOString());
            
            try {
                // Log before API call
                console.log('Fetching items from API...');
                
                const items = await api.getItems();
                
                // Immediately log the items received
                console.log('Received items from API:', items);
                console.log('Item count:', items.length);
                
                log(`Loaded ${items.length} items`);
                
                // Update dashboard stats if requested
                if (updateStats) {
                    this.updateDashboardStats(items);
                }
                
                // Update the table
                this.renderItemsTable(items);
                
                return items;
            } catch (error) {
                console.error('Failed to load items:', error);
                notificationService.showNotification('Failed to load inventory items', 'error');
                
                // Return empty array as fallback
                return [];
            }
        },
        
        /**
         * Update dashboard statistics with item data
         * @param {Item[]} items - Inventory items
         */
        updateDashboardStats: function(items) {
            log('Updating dashboard statistics');
            
            if (!items || !items.length) {
                log('No items to update stats with');
                return;
            }
            
            // Calculate statistics
            const totalItems = items.length;
            const lowStockItems = items.filter(item => item.quantity < 5).length;
            
            // Get unique categories
            const categories = [...new Set(items.map(item => item.category))].filter(Boolean).length;
            
            // Calculate total value (using fixed price of $73 per item)
            const ITEM_PRICE = 73; // Fixed price of $73 per item
            const totalValue = items.reduce((sum, item) => {
                return sum + (ITEM_PRICE * item.quantity);
            }, 0);
            
            // Update UI elements - try different selector approaches for robustness
            // First try the object implementation selectors
            const statsSelectors = [
                { name: 'Total Items', selector: '.grid-cols-4 h3:nth-of-type(1)', value: totalItems.toString() },
                { name: 'Low Stock Items', selector: '.grid-cols-4 h3:nth-of-type(2)', value: lowStockItems.toString() },
                { name: 'Categories', selector: '.grid-cols-4 h3:nth-of-type(3)', value: categories.toString() },
                { name: 'Total Value', selector: '.grid-cols-4 h3:nth-of-type(4)', value: `$${totalValue.toLocaleString()}` }
            ];
            
            statsSelectors.forEach(stat => {
                let element = document.querySelector(stat.selector);
                
                // Try alternative selector if first approach failed
                if (!element) {
                    // Try more specific selector based on the HTML structure
                    element = document.querySelector(`.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 div:nth-child(${statsSelectors.indexOf(stat) + 1}) h3`);
                }
                
                // Use most general approach as last resort
                if (!element) {
                    const allH3s = document.querySelectorAll('h3.text-2xl.font-bold.mt-2');
                    if (allH3s.length > statsSelectors.indexOf(stat)) {
                        element = allH3s[statsSelectors.indexOf(stat)];
                    }
                }
                
                if (element) {
                    console.log(`Updating ${stat.name} to ${stat.value}`);
                    element.textContent = stat.value;
                } else {
                    console.error(`Could not find element for ${stat.name}`);
                }
            });
            
            // Find items added today
            const today = new Date().toISOString().split('T')[0];
            const addedToday = items.filter(item => {
                if (!item.createdAt) return false;
                return item.createdAt.startsWith(today);
            }).length;
            
            const addedTodayElement = document.querySelector('.items-added-today');
            if (addedTodayElement) {
                addedTodayElement.textContent = `+${addedToday} today`;
            }
            
            log('Dashboard statistics updated');
        },
        
        /**
         * Render the items table with data
         * @param {Item[]} items - Inventory items
         */
        renderItemsTable: function(items) {
            log('Rendering items table');
            
            if (!items || !items.length) {
                log('No items to render in table');
                return;
            }
            
        const tableBody = document.querySelector('table tbody');
            if (!tableBody) {
                console.error('Table body element not found');
                return;
            }
            
            // Clear loading state
        tableBody.innerHTML = '';
        
            // Add items
        items.forEach(item => {
            const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                        <span class="font-mono text-sm">${item.sku}</span>
                </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="font-medium">${item.name}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded-full ${this.getCategoryClass(item.category)}">
                            ${item.category}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="${item.quantity < 5 ? 'text-red-600 font-bold' : ''}">${item.quantity}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${item.location}
                    </td>
                <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded-full ${this.getConditionClass(item.condition)}">
                            ${item.condition}
                        </span>
                </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex gap-2">
                            <button data-item-sku="${item.sku}" class="edit-item-btn text-blue-600 hover:text-blue-800">
                                <i class="ri-edit-line"></i>
                            </button>
                            <button data-item-sku="${item.sku}" class="delete-item-btn text-red-600 hover:text-red-800">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                </td>
            `;
                
            tableBody.appendChild(row);
        });
        
            // Set up event listeners for edit/delete buttons
            document.querySelectorAll('.edit-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const sku = e.currentTarget.getAttribute('data-item-sku');
                    this.editItem(sku);
                });
            });
            
            document.querySelectorAll('.delete-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const sku = e.currentTarget.getAttribute('data-item-sku');
                    this.deleteItem(sku);
                });
            });
            
            log(`Rendered ${items.length} items in table`);
        },
        
        /**
         * Get the appropriate CSS class for a category
         * @param {string} category - Item category
         * @returns {string} CSS class
         */
        getCategoryClass: function(category) {
            switch (category) {
                case 'Electronics':
                    return 'bg-blue-100 text-blue-800';
                case 'Furniture':
                    return 'bg-green-100 text-green-800';
                case 'Office Supplies':
                    return 'bg-yellow-100 text-yellow-800';
                case 'Accessories':
                    return 'bg-purple-100 text-purple-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        },
        
        /**
         * Get the appropriate CSS class for a condition
         * @param {string} condition - Item condition
         * @returns {string} CSS class
         */
        getConditionClass: function(condition) {
            switch (condition) {
                case 'New':
            return 'bg-green-100 text-green-800';
                case 'Good':
            return 'bg-blue-100 text-blue-800';
                case 'Fair':
                    return 'bg-yellow-100 text-yellow-800';
                case 'Poor':
                    return 'bg-orange-100 text-orange-800';
                case 'Damaged':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
        },
        
        /**
         * Edit an inventory item
         * @param {string} sku - Item SKU to edit
         */
        editItem: async function(sku) {
            log(`Editing item: ${sku}`);
            
            try {
        const item = await api.getItem(sku);
        
                // Populate the edit form
                document.getElementById('editSku').textContent = item.sku;
        document.getElementById('editName').value = item.name;
        document.getElementById('editCategory').value = item.category;
        document.getElementById('editQuantity').value = item.quantity;
        document.getElementById('editLocation').value = item.location;
        document.getElementById('editCondition').value = item.condition;
                document.getElementById('editNotes').value = item.notes;
        
                // Show the modal
                modalService.showModal('editItemModal');
                
                // Set up the update button event handler
                const updateItemBtn = document.getElementById('updateItemBtn');
                if (updateItemBtn) {
                    // Remove existing event listeners
                    const newUpdateItemBtn = updateItemBtn.cloneNode(true);
                    updateItemBtn.parentNode.replaceChild(newUpdateItemBtn, updateItemBtn);
                    
                    // Add fresh event listener
                    newUpdateItemBtn.addEventListener('click', (event) => {
                        log('Update Item button clicked');
                        console.log('Update Item button clicked');
                        event.preventDefault();
                        this.submitEditItemForm(item.sku);
                    });
                } else {
                    console.error('Update Item button not found in the modal');
                }
    } catch (error) {
                console.error(`Failed to load item ${sku}:`, error);
                notificationService.showNotification(`Error loading item: ${error.message}`, 'error');
            }
        },
        
        /**
         * Update an inventory item and handle all related updates
         * @param {string} sku - The SKU of the item to update
         * @param {Object} itemData - The new item data
         * @returns {Promise<Object>} The updated item
         */
        updateInventoryItem: async function(sku, itemData) {
            try {
                log(`Updating inventory item: ${sku}`);
                console.log(`Updating inventory item ${sku} at:`, new Date().toISOString());
                
                // Show loading state
                const updateItemBtn = document.getElementById('updateItemBtn');
                const originalText = updateItemBtn?.innerHTML || '';
                if (updateItemBtn) {
                    updateItemBtn.disabled = true;
                    updateItemBtn.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i> Updating...';
                }

                // Create the full updated item object
                const updatedItem = {
                    sku: sku,
                    name: itemData.name,
                    category: itemData.category,
                    quantity: parseInt(itemData.quantity, 10) || 1,
                    location: itemData.location,
                    condition: itemData.condition,
                    notes: itemData.notes || 'No notes provided'
                };
                
                log('Sending updated item to API:', updatedItem);
                
                // Call API to update item
                const result = await api.updateItem(updatedItem);
                log('Item updated successfully:', result);
                
                // Log the activity
                await this.logActivity('Update', `Updated ${updatedItem.name} (${sku})`, sku);
                
                // Hide modal
                if (typeof modalService !== 'undefined') {
                    modalService.hideModal('editItemModal');
                } else {
                    const modal = document.getElementById('editItemModal');
                    if (modal) modal.classList.remove('active');
                }
                
                // Show success notification
                notificationService.showNotification(`Item ${updatedItem.name} updated successfully`, 'success');
                
                // Refresh all related data
                await this.refreshAllData();
                
                return result;
            } catch (error) {
                console.error('Error updating item:', error);
                notificationService.showNotification(`Error: ${error.message}`, 'error');
                throw error;
            } finally {
                // Restore button state
                const updateItemBtn = document.getElementById('updateItemBtn');
                if (updateItemBtn) {
                    updateItemBtn.disabled = false;
                    updateItemBtn.innerHTML = originalText || 'Update Item';
                }
            }
        },
        
        /**
         * Submit the form to edit an item
         * @param {string} sku - The SKU of the item being edited
         */
        submitEditItemForm: async function(sku) {
            log(`Submitting Edit Item form for SKU: ${sku}`);
            console.log(`Submit Edit Item form called at: ${new Date().toISOString()} for SKU: ${sku}`);
        
        // Get form values
            const nameField = document.getElementById('editName');
            const name = nameField?.value?.trim() || '';
            const categoryField = document.getElementById('editCategory');
            const category = categoryField?.value || '';
            const quantityField = document.getElementById('editQuantity');
            const quantity = quantityField?.value || '1';
            const locationField = document.getElementById('editLocation');
            const location = locationField?.value || '';
            const conditionField = document.getElementById('editCondition');
            const condition = conditionField?.value || '';
            const notesField = document.getElementById('editNotes');
            const notes = notesField?.value?.trim() || '';
            
            // Log form values for debugging
            console.log('Edit form values:', { 
                sku, 
                name,
                category,
                quantity, 
                location,
                condition,
                notes
            });
        
        // Validate required fields
            const validationErrors = [];
            
            if (!name) {
                validationErrors.push('Item name is required');
                this.showFieldError(nameField, 'Item name is required');
            }
            
            if (!category) {
                validationErrors.push('Category is required');
                this.showFieldError(categoryField, 'Please select a category');
            }
            
            if (!location) {
                validationErrors.push('Location is required');
                this.showFieldError(locationField, 'Please select a location');
            }
            
            if (!condition) {
                validationErrors.push('Condition is required');
                this.showFieldError(conditionField, 'Please select a condition');
            }
            
            if (validationErrors.length > 0) {
                console.error('Validation errors:', validationErrors);
                notificationService.showNotification(validationErrors[0], 'error');
                return false;
            }
            
            // Collect form data into an object
            const itemData = {
            name,
            category,
                quantity,
            location,
            condition,
            notes
        };
        
            // Use the centralized update function
            await this.updateInventoryItem(sku, itemData);
        },
        
        /**
         * Delete an inventory item
         * @param {string} sku - Item SKU to delete
         */
        deleteItem: async function(sku) {
            log(`Deleting item: ${sku}`);
            
            // Get the item details first to include in the activity log
            try {
                const item = await api.getItem(sku);
                const itemName = item.name || 'Unknown item';
                
                if (confirm(`Are you sure you want to delete item ${itemName} (${sku})?`)) {
                    try {
                        await api.deleteItem(sku);
                        
                        // Log activity for the deletion with the item name
                        await this.logActivity('Remove', `Deleted ${itemName} (${sku})`, sku);
                        
                        notificationService.showNotification(`Item ${itemName} deleted successfully`, 'success');
                        
                        // Refresh all data (inventory, activities, charts)
                        await this.refreshAllData();
    } catch (error) {
                        console.error(`Failed to delete item ${sku}:`, error);
                        notificationService.showNotification(`Error deleting item: ${error.message}`, 'error');
                    }
                }
            } catch (error) {
                console.error(`Failed to get item details for ${sku}:`, error);
                
                // Fallback to simple SKU if we can't get the item details
                if (confirm(`Are you sure you want to delete item ${sku}?`)) {
                    try {
                        await api.deleteItem(sku);
                        
                        // Log activity for the deletion with just the SKU
                        await this.logActivity('Remove', `Deleted item ${sku}`, sku);
                        
                        notificationService.showNotification(`Item ${sku} deleted successfully`, 'success');
                        
                        // Refresh all data
                        await this.refreshAllData();
                    } catch (deleteError) {
                        console.error(`Failed to delete item ${sku}:`, deleteError);
                        notificationService.showNotification(`Error deleting item: ${deleteError.message}`, 'error');
                    }
                }
            }
        },
        
        /**
         * Create a new inventory item with proper handling of UI and data refresh
         * @param {Object} itemData - The new item data
         * @returns {Promise<Object>} The created item
         */
        createInventoryItem: async function(itemData) {
            try {
                log('Creating new inventory item');
                console.log('Creating new item at:', new Date().toISOString());
                
                // Show loading state
                const addItemBtn = document.getElementById('addItemBtn');
                const originalText = addItemBtn?.innerHTML || '';
                if (addItemBtn) {
                    addItemBtn.disabled = true;
                    addItemBtn.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i> Adding...';
                }
                
                // Create the item object with provided data
                const newItem = {
                    sku: itemData.sku || "AUTO-GENERATE",
                    name: itemData.name,
                    category: itemData.category,
                    quantity: parseInt(itemData.quantity, 10) || 1,
                    location: itemData.location,
                    condition: itemData.condition,
                    notes: itemData.notes || 'No notes provided'
                };
                
                log('Sending new item to API:', newItem);
                
                // Call API to create item
                const result = await api.createItem(newItem);
                log('Item created successfully:', result);
                
                // Log activity
                await this.logActivity('Add', `Added ${newItem.quantity} ${newItem.name} (${result.sku})`, result.sku);
                
                // Hide modal
                if (typeof modalService !== 'undefined') {
                    modalService.hideModal('addItemModal');
                } else {
                    const modal = document.getElementById('addItemModal');
                    if (modal) modal.classList.remove('active');
                }
        
        // Show success notification
                notificationService.showNotification(`Item ${newItem.name} added successfully with SKU: ${result.sku}`, 'success');
                
                // Refresh all related data
                await this.refreshAllData();
                
                return result;
    } catch (error) {
                console.error('Error creating item:', error);
                
                if (error.message && error.message.includes('409')) {
                    // Item with this SKU already exists
                    notificationService.showNotification(`A product with this SKU already exists. Please use a different SKU or leave blank for auto-generation.`, 'error');
                    const skuField = document.getElementById('newItemSku');
                    if (skuField) this.showFieldError(skuField, 'This SKU already exists');
                } else {
                    // Generic error
                    notificationService.showNotification(`Error: ${error.message}`, 'error');
                }
                
                throw error;
    } finally {
                // Restore button state
                const addItemBtn = document.getElementById('addItemBtn');
                if (addItemBtn) {
                    addItemBtn.disabled = false;
                    addItemBtn.innerHTML = originalText || 'Add Item';
                }
            }
        },
        
        /**
         * Submit the form to add a new item
         */
        submitAddItemForm: async function() {
            log('Submitting Add Item form');
            console.log('Submit Add Item form function called at:', new Date().toISOString());
        
            // Get form values
            const skuField = document.getElementById('newItemSku');
            const skuValue = skuField ? skuField.value.trim() : '';
            const nameField = document.getElementById('newItemName');
            const name = nameField?.value?.trim() || '';
            const categoryField = document.getElementById('newItemCategory');
            const category = categoryField?.value || '';
            const quantityField = document.getElementById('newItemQuantity');
            const quantity = quantityField?.value || '1';
            const locationField = document.getElementById('newItemLocation');
            const location = locationField?.value || '';
            const conditionField = document.getElementById('newItemCondition');
            const condition = conditionField?.value || '';
            const notesField = document.getElementById('newItemNotes');
            const notes = notesField?.value?.trim() || '';
            
            // Log form values for debugging
            console.log('Form values:', { 
                sku: skuValue || '(empty - will be auto-generated)', 
                name,
                category,
                quantity, 
                location,
                condition,
                notes
            });
            
            // Validate required fields
            const validationErrors = [];
            
            if (!name) {
                validationErrors.push('Item name is required');
                this.showFieldError(nameField, 'Item name is required');
            }
            
            if (!category) {
                validationErrors.push('Category is required');
                this.showFieldError(categoryField, 'Please select a category');
            }
            
            if (!location) {
                validationErrors.push('Location is required');
                this.showFieldError(locationField, 'Please select a location');
            }
            
            if (!condition) {
                validationErrors.push('Condition is required');
                this.showFieldError(conditionField, 'Please select a condition');
            }
            
            if (validationErrors.length > 0) {
                console.error('Validation errors:', validationErrors);
                notificationService.showNotification(validationErrors[0], 'error');
                return false;
            }
            
            // Collect form data into an object
            const itemData = {
                sku: skuValue,
                name,
                category,
                quantity,
                location,
                condition,
                notes
            };
            
            try {
                // Use the centralized create function
                const result = await this.createInventoryItem(itemData);
                
                // Clear the form on success
                if (skuField) skuField.value = '';
                if (nameField) nameField.value = '';
                if (categoryField) categoryField.value = '';
                if (quantityField) quantityField.value = '1';
                if (locationField) locationField.value = '';
                if (conditionField) conditionField.value = '';
                if (notesField) notesField.value = '';
                
                return result;
            } catch (error) {
                // Error is already handled in createInventoryItem
                return false;
            }
        },
        
        /**
         * Show error message for a form field
         * @param {HTMLElement} field - The form field
         * @param {string} message - Error message
         */
        showFieldError: function(field, message) {
            if (!field) return;
            
            // Add red border
            field.classList.add('border-red-500');
            
            // Remove any existing error message
            const existingError = field.parentElement.querySelector('.text-red-500');
            if (existingError) {
                existingError.remove();
            }
            
            // Add error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'text-red-500 text-xs mt-1';
            errorMessage.textContent = message;
            field.parentElement.appendChild(errorMessage);
            
            // Clear error when field is changed
            field.addEventListener('input', function() {
                field.classList.remove('border-red-500');
                const error = field.parentElement.querySelector('.text-red-500');
                if (error) {
                    error.remove();
                }
            }, { once: true });
        },
        
        /**
         * Refresh all data (inventory, activities, and charts)
         * @param {Function} callback - Optional callback after refresh
         * @returns {Promise<Array>} The refreshed items
         */
        refreshAllData: async function(callback) {
            log('Refreshing all data');
            console.log('Refreshing all data at:', new Date().toISOString());
            
            // Show loading states
            this.setLoadingState(true);
            
            try {
                // Load items with stats update in a single call
                const items = await this.loadItems(true);
                
                // Also refresh recent activities
                await this.loadRecentActivity();
                
                // Also refresh stock movement data if available
                if (typeof this.loadStockMovementData === 'function') {
                    await this.loadStockMovementData();
                }
                
                // Execute callback if provided
                if (typeof callback === 'function') {
                    callback(items);
                }
                
                return items;
            } catch (error) {
                console.error('Error refreshing all data:', error);
                throw error;
            } finally {
                this.setLoadingState(false);
            }
        },

        /**
         * Set loading state for UI elements
         * @param {boolean} isLoading - Whether the UI is in loading state
         */
        setLoadingState: function(isLoading) {
            const stockListHeader = document.querySelector('.bg-white .p-6.border-b h3');
            if (stockListHeader) {
                const originalText = stockListHeader.getAttribute('data-original-text') || stockListHeader.innerHTML;
                
                if (isLoading) {
                    // Save original text if not already saved
                    if (!stockListHeader.getAttribute('data-original-text')) {
                        stockListHeader.setAttribute('data-original-text', originalText);
                    }
                    stockListHeader.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i> Refreshing...';
                } else {
                    stockListHeader.innerHTML = originalText;
                }
            }
        },
        
        /**
         * Load stock movement data for the chart
         */
        loadStockMovementData: async function() {
            log('Loading stock movement data');
            
            try {
                // First get all items to analyze their locations
                const items = await api.getItems();
                log(`Loaded ${items.length} items for stock movement analysis`);
                
                // Get days of the week for x-axis
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                
                // Initialize counts for each day
                const inboundData = [0, 0, 0, 0, 0, 0, 0];
                const outboundData = [0, 0, 0, 0, 0, 0, 0];
                
                // Current date to determine the day of week
                const today = new Date();
                const currentDayIndex = (today.getDay() + 6) % 7; // Convert to 0=Monday, 6=Sunday
                
                // Process each item and count based on location
                items.forEach(item => {
                    const location = item.location || "";
                    
                    // Skip items that don't have a shipment ID as location
                    if (!location.startsWith('IN') && !location.startsWith('OU')) {
                        return;
                    }
                    
                    // Check if it's an inbound or outbound shipment
                    const isInbound = location.startsWith('IN');
                    
                    try {
                        // Try to extract date from location ID (assuming format INYYYYMMDDHHMMSS or OUYYYYMMDDHHMMSS)
                        let dateStr = null;
                        if (location.length >= 14) { // Ensure we have enough characters to extract a date
                            // Extract date portion: position 2-14 (YYYYMMDDHHMMSS)
                            dateStr = location.substring(2, 16);
                            
                            // Parse the date portions
                            const year = parseInt(dateStr.substring(0, 4));
                            const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
                            const day = parseInt(dateStr.substring(6, 8));
                            
                            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                const itemDate = new Date(year, month, day);
                                
                                // Calculate days difference to place in correct bucket
                                const timeDiff = today - itemDate;
                                const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                                
                                // Only include if within the past week
                                if (daysDiff >= 0 && daysDiff < 7) {
                                    // Calculate which day of the week to add to
                                    const dayIndex = (currentDayIndex - daysDiff + 7) % 7;
                                    
                                    // Add to appropriate counter
                                    if (isInbound) {
                                        inboundData[dayIndex] += parseInt(item.quantity) || 1;
                                    } else {
                                        outboundData[dayIndex] += parseInt(item.quantity) || 1;
                                    }
                                }
                            }
                        } else {
                            // If can't extract date, add to today's count
                            if (isInbound) {
                                inboundData[currentDayIndex] += parseInt(item.quantity) || 1;
                            } else {
                                outboundData[currentDayIndex] += parseInt(item.quantity) || 1;
                            }
                        }
                    } catch (err) {
                        console.warn('Error processing date for item:', item.sku, err);
                        // Add to today's count as fallback
                        if (isInbound) {
                            inboundData[currentDayIndex] += parseInt(item.quantity) || 1;
                        } else {
                            outboundData[currentDayIndex] += parseInt(item.quantity) || 1;
                        }
                    }
                });
                
                log('Stock movement data processed:');
                log('Inbound:', inboundData);
                log('Outbound:', outboundData);
                
                // Update chart with the data
                this.updateStockMovementChart({
                    days: days,
                    inboundData: inboundData,
                    outboundData: outboundData
                });
            } catch (error) {
                console.error('Failed to load stock movement data:', error);
                // Use demo data as fallback
                this.updateStockMovementChart({
                    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    inboundData: [120, 132, 101, 134, 90, 230, 210],
                    outboundData: [110, 122, 91, 124, 80, 220, 200]
                });
            }
        },
        
        /**
         * Update the stock movement chart with data
         * @param {Object} data - Stock movement data
         */
        updateStockMovementChart: function(data) {
                const chartElement = document.getElementById('stockMovementChart');
            
            // Check if chart element exists
                if (!chartElement) {
                    console.error('Stock movement chart element not found');
            return;
        }
            
            // Check if echarts is defined
            if (typeof echarts === 'undefined') {
                console.error('ECharts library not loaded');
                return;
            }
            
            let stockMovementChart = null;
            try {
                stockMovementChart = echarts.getInstanceByDom(chartElement);
            } catch (error) {
                console.warn('Error getting chart instance:', error.message);
                // Continue with null stockMovementChart
            }
            
            if (!stockMovementChart) {
                log('Stock movement chart not found, initializing new chart');
        
                // Initialize new chart
                try {
                const newChart = echarts.init(chartElement);
                const option = {
                    animation: false,
                    title: {
                        text: 'Stock Movement',
                        left: 'center'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    legend: {
                        data: ['Inbound', 'Outbound'],
                        bottom: 0
                    },
                    xAxis: {
                        type: 'category',
                        data: data.days
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [{
                        name: 'Inbound',
                        type: 'bar',
                        data: data.inboundData,
                        color: 'rgba(34, 197, 94, 0.8)'
                    }, {
                        name: 'Outbound',
                        type: 'bar',
                        data: data.outboundData,
                        color: 'rgba(239, 68, 68, 0.8)'
                    }]
                };
                newChart.setOption(option);
                
                // Ensure chart resizes when window resizes
                window.addEventListener('resize', function() {
                    if (newChart) {
                        newChart.resize();
                    }
                });
                } catch (error) {
                    console.error('Failed to initialize chart:', error);
                }
            } else {
                // Update existing chart
                try {
                stockMovementChart.setOption({
                    xAxis: {
                        data: data.days
                    },
                    series: [{
                        name: 'Inbound',
                        data: data.inboundData
                    }, {
                        name: 'Outbound',
                        data: data.outboundData
                    }]
                });
                } catch (error) {
                    console.error('Failed to update chart:', error);
                }
            }
            
            log('Stock movement chart updated');
        },
        
        /**
         * Load recent activity data
         */
        loadRecentActivity: async function() {
            log('Loading recent activity data');
            console.log('Debug: Loading recent activity data at:', new Date().toISOString());
            
            // Check if the container exists before trying to load data
            const activityContainer = document.getElementById('recentActivities');
            if (!activityContainer) {
                const fallbackContainer = document.querySelector('.bg-white:last-child .p-6.space-y-6');
                if (fallbackContainer) {
                    console.log('Found fallback container for recent activities, adding ID');
                    fallbackContainer.id = 'recentActivities';
                } else {
                    console.error('Could not find any container for recent activities, aborting data load');
                    return;
                }
            }
            
            // Show loading indicator
            const container = document.getElementById('recentActivities');
            if (container) {
                container.innerHTML = `
                    <div class="flex items-center justify-center py-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        <span class="ml-2 text-gray-500">Loading activities...</span>
                    </div>
                `;
            }
            
            try {
                // Get recent activity from API with a larger limit for filtering
                console.log('Fetching recent activities from API...');
                const activities = await api.getRecentActivities(15);
                console.log('Recent activities loaded:', activities);
                
                // Filter activities to include only item-related ones
                const relevantActivities = activities.filter(activity => 
                    activity.description?.toLowerCase().includes('item') ||
                    activity.itemSKU !== null ||
                    activity.actionType === 'View' // Include View actions
                );
                
                console.log(`Filtered to ${relevantActivities.length} relevant activities`);
                
                // Update UI with the filtered activities
                this.updateRecentActivity(relevantActivities);
            } catch (error) {
                console.error('Failed to load recent activity:', error);
                
                // Show error in container
                const container = document.getElementById('recentActivities');
                if (container) {
                    container.innerHTML = `
                        <div class="bg-red-50 border border-red-200 rounded p-4 mb-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="ri-error-warning-line text-red-400"></i>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">Error loading activity data</h3>
                                    <div class="mt-2 text-sm text-red-700">
                                        <p>${error.message || 'Unknown error'}</p>
                                    </div>
                                    <div class="mt-4">
                                        <button type="button" onclick="inventoryManager.loadRecentActivity()" 
                                            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                            <i class="ri-refresh-line mr-2"></i> Retry
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // Use demo data as fallback after showing the error
                this.updateRecentActivity([]);
            }
            
            // Set up auto-refresh timer (every 60 seconds)
            setTimeout(() => {
                this.loadRecentActivity();
            }, 60000);
        },
        
        /**
         * Update the recent activity section
         * @param {ActivityLog[]} activities - Recent activities
         */
        updateRecentActivity: function(activities) {
            log('Updating recent activity section');
            
            // Use ID selector directly
            const recentActivityContainer = document.getElementById('recentActivities');
            
            if (!recentActivityContainer) {
                console.error('Recent activity container not found with ID "recentActivities"');
                // Try fallback selector
                const fallbackContainer = document.querySelector('.bg-white:last-child .p-6.space-y-6');
                if (fallbackContainer) {
                    console.log('Found fallback container for recent activities');
                    fallbackContainer.id = 'recentActivities'; // Add the ID for future reference
                    this.updateRecentActivityInContainer(fallbackContainer, activities);
                } else {
                    console.error('Could not find any container for recent activities');
                }
            return;
        }
            
            this.updateRecentActivityInContainer(recentActivityContainer, activities);
        },
        
        /**
         * Update recent activity in the specified container
         * @param {HTMLElement} container - The container element
         * @param {ActivityLog[]} activities - Recent activities
         */
        updateRecentActivityInContainer: function(container, activities) {
            console.log(`Updating recent activities with ${activities ? activities.length : 0} items`);
        
            // Clear current content
            container.innerHTML = '';
            
            // If no activities, use demo data
            if (!activities || activities.length === 0) {
                console.log('No activities found, using demo data');
                // Use demo data
                container.innerHTML = `
                    <div class="flex items-start gap-4">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <i class="ri-add-line"></i>
                        </div>
                        <div>
                            <p class="font-medium">Added 50 iPhone 15 Pro Max units</p>
                            <p class="text-sm text-gray-500 mt-1">2 hours ago</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-4">
                        <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                            <i class="ri-subtract-line"></i>
                        </div>
                        <div>
                            <p class="font-medium">Removed 20 MacBook Pro units</p>
                            <p class="text-sm text-gray-500 mt-1">4 hours ago</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-4">
                        <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                            <i class="ri-edit-line"></i>
                        </div>
                        <div>
                            <p class="font-medium">Updated iPad Pro inventory details</p>
                            <p class="text-sm text-gray-500 mt-1">Yesterday at 10:30</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            console.log('Rendering activity items:', activities);
            
            // Add activities to container
            activities.forEach(activity => {
                const activityElement = document.createElement('div');
                activityElement.className = 'flex items-start gap-4';
                
                // Format timestamp
                let timestamp = "Just now";
                if (activity.timestamp) {
                    const activityDate = new Date(activity.timestamp);
                    const now = new Date();
                    const diffMs = now - activityDate;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffMins < 1) {
                        timestamp = "Just now";
                    } else if (diffMins < 60) {
                        timestamp = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
                    } else if (diffHours < 24) {
                        timestamp = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                    } else if (diffDays < 7) {
                        timestamp = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                    } else {
                        timestamp = activityDate.toLocaleDateString();
                    }
                }
                
                // Determine icon and color classes based on action type
                let iconClass = "ri-information-line";
                let bgColorClass = "bg-gray-100";
                let textColorClass = "text-gray-600";
                
                switch (activity.actionType?.toLowerCase()) {
                    case "add":
                        iconClass = "ri-add-line";
                        bgColorClass = "bg-blue-100";
                        textColorClass = "text-blue-600";
                        break;
                    case "remove":
                        iconClass = "ri-subtract-line";
                        bgColorClass = "bg-red-100";
                        textColorClass = "text-red-600";
                        break;
                    case "update":
                        iconClass = "ri-edit-line";
                        bgColorClass = "bg-yellow-100";
                        textColorClass = "text-yellow-600";
                        break;
                    case "move":
                        iconClass = "ri-arrow-left-right-line";
                        bgColorClass = "bg-green-100";
                        textColorClass = "text-green-600";
                        break;
                    case "view":
                        iconClass = "ri-eye-line";
                        bgColorClass = "bg-purple-100";
                        textColorClass = "text-purple-600";
                        break;
                }
                
                activityElement.innerHTML = `
                    <div class="w-8 h-8 ${bgColorClass} rounded-full flex items-center justify-center ${textColorClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>
                        <p class="font-medium">${activity.description || "Unknown activity"}</p>
                        <p class="text-sm text-gray-500 mt-1">${timestamp}</p>
                        ${activity.itemSKU ? `<p class="text-xs text-gray-400">SKU: ${activity.itemSKU}</p>` : ''}
                        ${activity.userName ? `<p class="text-xs text-gray-400">By: ${activity.userName}</p>` : ''}
        </div>
    `;
    
                container.appendChild(activityElement);
            });
            
            log('Recent activity updated successfully');
        },
        
        /**
         * When adding or modifying an item, also create an activity log
         * @param {string} actionType - The type of action (Add, Remove, Update, Move)
         * @param {string} description - Description of the activity
         * @param {string} itemSku - Optional SKU of the affected item
         */
        logActivity: async function(actionType, description, itemSku = null) {
            try {
                // Create the activity log object
                const activityLog = {
                    actionType: actionType,
                    description: description,
                    itemSKU: itemSku,
                    userId: null, // Use null for system actions or get from user profile if available
                    userName: 'System' // Should ideally be the logged-in user
                };
                
                console.log(`Logging activity: ${actionType} - ${description}`);
                
                // Send to the API
                await api.createActivityLog(activityLog);
                log(`Activity logged: ${description}`);
                
                // Refresh activity display immediately after logging
                await this.loadRecentActivity();
                
                // If it's an Add or Remove action, refresh stock movement chart
                if (actionType === 'Add' || actionType === 'Remove' || actionType === 'Update') {
                    this.loadStockMovementData();
                }
            } catch (error) {
                console.error('Failed to log activity:', error);
            }
        },
        
        /**
         * Load all activities with filtering and pagination
         * @param {boolean} append - Whether to append to existing activities or replace them
         */
        loadAllActivities: async function(append = false) {
            log(`Loading all activities (page ${activityPage}, append: ${append})`);
            
            // Show loading state
            const tableBody = document.getElementById('allActivitiesTableBody');
            if (tableBody && !append) {
                tableBody.innerHTML = `
                    <tr class="animate-pulse">
                        <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            Loading activities...
                        </td>
                    </tr>
                `;
            }
            
            // Show/hide load more button during initial load
            const loadMoreBtn = document.getElementById('loadMoreActivitiesBtn');
            if (loadMoreBtn) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.classList.add('opacity-50');
                loadMoreBtn.innerHTML = '<i class="ri-loader-2-line animate-spin mr-1"></i> Loading...';
            }
            
            try {
                // Increased initial load count to 100 items
                const pageSize = 100;
                let activities;
                
                // Always get the current filter values from the DOM elements to ensure consistency
                const currentTypeFilter = document.getElementById('activityTypeFilter')?.value || '';
                const currentSearchQuery = document.getElementById('activitySearchInput')?.value || '';
                
                // Update stored values
                activityTypeFilter = currentTypeFilter;
                activitySearchQuery = currentSearchQuery;
                
                // Apply filters if set
                if (currentTypeFilter) {
                    log(`Loading activities with type filter: "${currentTypeFilter}" (page size: ${pageSize})`);
                    activities = await api.getActivitiesByType(currentTypeFilter, pageSize);
                } else {
                    log(`Loading all activities (page size: ${pageSize})`);
                    activities = await api.getActivityLogs(pageSize);
                }
                
                // Apply search filter in memory if needed
                if (currentSearchQuery && activities && activities.length > 0) {
                    log(`Filtering activities with search query: "${currentSearchQuery}"`);
                    const query = currentSearchQuery.toLowerCase();
                    activities = activities.filter(activity => 
                        (activity.description && activity.description.toLowerCase().includes(query)) || 
                        (activity.itemSKU && activity.itemSKU.toLowerCase().includes(query)) ||
                        (activity.userName && activity.userName.toLowerCase().includes(query))
                    );
                    log(`Found ${activities.length} activities matching search query`);
                }
                
                // Update UI based on whether we have more items
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = false;
                        loadMoreBtn.classList.remove('opacity-50');
                    loadMoreBtn.innerHTML = '<i class="ri-list-check-line mr-1"></i> Load All Activities';
                }
                
                // Render activities (all initially loaded activities)
                this.renderActivitiesTable(activities, append);
                
                // Add count indicator after the table
                const countMessage = document.createElement('p');
                countMessage.className = 'text-center text-sm text-gray-500 mt-2';
                countMessage.textContent = `Showing ${activities.length} activities`;
                const tableContainer = tableBody.closest('.overflow-auto');
                if (tableContainer && tableContainer.nextElementSibling) {
                    // Remove existing message if present
                    const existingMessage = tableContainer.nextElementSibling.querySelector('.text-center.text-sm.text-gray-500.mt-2');
                    if (existingMessage) {
                        existingMessage.remove();
                    }
                    tableContainer.nextElementSibling.prepend(countMessage);
                }
                
            } catch (error) {
                console.error('Failed to load activities:', error);
                
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-red-500 text-center">
                                Error loading activities: ${error.message}
                            </td>
                        </tr>
                    `;
                }
                
                // Re-enable load more button
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.classList.remove('opacity-50');
                    loadMoreBtn.innerHTML = '<i class="ri-list-check-line mr-1"></i> Load All Activities';
                }
            }
        },
        
        /**
         * Render activities in the all activities table
         * @param {ActivityLog[]} activities - Activities to render
         * @param {boolean} append - Whether to append to existing activities or replace them
         */
        renderActivitiesTable: function(activities, append = false) {
            const tableBody = document.getElementById('allActivitiesTableBody');
            if (!tableBody) {
                console.error('Activities table body not found');
                return;
            }
            
            // Clear existing content if not appending
            if (!append) {
                tableBody.innerHTML = '';
            }
            
            // If no activities, show improved message
            if (!activities || activities.length === 0) {
                if (!append) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                <div class="flex flex-col items-center justify-center p-4">
                                    <i class="ri-inbox-line text-4xl text-gray-300 mb-2"></i>
                                    <p class="text-gray-500 mb-1">No activities found</p>
                                    <p class="text-gray-400 text-xs">Try changing your search or filter criteria</p>
                                </div>
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            
            // Add activities to table with alternating row colors
            activities.forEach((activity, index) => {
                const row = document.createElement('tr');
                // Add alternating row colors
                row.className = index % 2 === 0 ? 'hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
                
                // Format timestamp
                let timestamp = "Just now";
                if (activity.timestamp) {
                    const activityDate = new Date(activity.timestamp);
                    timestamp = formatDate(activityDate);
                }
                
                // Determine color classes for the activity type
                let typeClass = "";
                switch (activity.actionType?.toLowerCase()) {
                    case "add":
                        typeClass = "bg-blue-100 text-blue-800";
                        break;
                    case "remove":
                        typeClass = "bg-red-100 text-red-800";
                        break;
                    case "update":
                        typeClass = "bg-yellow-100 text-yellow-800";
                        break;
                    case "move":
                        typeClass = "bg-green-100 text-green-800";
                        break;
                    case "view":
                        typeClass = "bg-purple-100 text-purple-800";
                        break;
                    default:
                        typeClass = "bg-gray-100 text-gray-800";
                }
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${typeClass}">
                            ${activity.actionType || "Unknown"}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-900">${activity.description || "No description"}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${activity.itemSKU ? 
                            `<span class="text-sm font-mono text-blue-600 cursor-pointer hover:underline" 
                                onclick="inventoryManager.viewItemDetails('${activity.itemSKU}')">
                              ${activity.itemSKU}
                            </span>` 
                            : 
                            '<span class="text-sm text-gray-500">-</span>'
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-900">${activity.userName || "System"}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-500" title="${new Date(activity.timestamp).toLocaleString()}">
                            ${timestamp}
                        </span>
                    </td>
                `;
                
                tableBody.appendChild(row);
        });
            
            // Add a caption showing count
            const activityCount = activities.length;
            if (activityCount > 0 && !append) {
                const caption = document.createElement('caption');
                caption.className = 'sr-only';
                caption.textContent = `Showing ${activityCount} activities`;
                
                const table = tableBody.closest('table');
                if (table && !table.querySelector('caption')) {
                    table.prepend(caption);
                }
            }
    },
    
        /**
         * View the details of an item
         * @param {string} sku - Item SKU to view
         */
        viewItemDetails: function(sku) {
            if (!sku) return;
            
            log(`Viewing item details: ${sku}`);
            
            // Close activities modal and open edit item modal
            modalService.hideModal('allActivitiesModal');
            
            // Slight delay to avoid modal transition issues
            setTimeout(() => {
                this.editItem(sku);
            }, 300);
        },
        
        /**
         * Refresh inventory data from the server (legacy method)
         * @param {Function} callback - Optional callback function to execute after refresh
         */
        refreshInventoryData: async function(callback) {
            console.log('Using refreshInventoryData (legacy) - redirecting to refreshAllData');
            return this.refreshAllData(callback);
        },
        
        /**
         * Submit the form to add a scanned item
         */
        submitScanForm: function() {
            log('Submitting Scan form');
            
            const button = document.querySelector('#scanStep2 button.bg-primary');
            if (!button) {
                console.error('Submit button not found in the form');
                return;
            }
            
            // Show loading state
            button.disabled = true;
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i> Submitting...';
        
            const sku = document.getElementById('scannedCode').textContent;
            const quantity = document.getElementById('itemQuantity').value;
            const location = document.getElementById('itemLocation').value;
            const condition = document.getElementById('itemCondition').value;
            const notes = document.getElementById('itemNotes').value;
            
            log('Form values:', { sku, quantity, location, condition, notes });
        
            if (!quantity || !location || !condition) {
                notificationService.showNotification('Please fill in all required fields', 'error');
                
                // Restore button state
                button.disabled = false;
                button.innerHTML = originalText;
                return;
            }
        
            // Determine location text based on selected value
            let locationText = location;
            if (location === 'A1') locationText = 'Zone A - Shelf 1';
            if (location === 'A2') locationText = 'Zone A - Shelf 2';
            if (location === 'B1') locationText = 'Zone B - Shelf 1';
            if (location === 'B2') locationText = 'Zone B - Shelf 2';
            
            // Generate a unique SKU with the current time
            const uniqueSKU = sku + "-" + Date.now().toString().slice(-6);
            
            // Create new item
            const newItem = {
                sku: uniqueSKU,
                name: "Scanned Item " + uniqueSKU.split('-')[1], // More descriptive name
                category: "General", // Default category
                quantity: parseInt(quantity),
                location: locationText,
                condition: condition.charAt(0).toUpperCase() + condition.slice(1), // Capitalize first letter
                notes: notes || "Added via scanner"
            };
            
            log('Creating scanned item:', newItem);
            
            // Call API to create item
            api.createItem(newItem)
                .then((result) => {
                    log('Item created successfully:', result);
                    // Show success step
                    window.showScanStep(3);
            
                    // Reset the form
                    document.getElementById('itemQuantity').value = '';
                    document.getElementById('itemLocation').value = '';
                    document.getElementById('itemCondition').value = '';
                    document.getElementById('itemNotes').value = '';
                    
                    // Refresh all data
                    this.refreshAllData();
                })
                .catch(error => {
                    console.error('Failed to create item:', error);
                    notificationService.showNotification(`Failed to create item: ${error.message}`, 'error');
                })
                .finally(() => {
                    // Restore button state
                    button.disabled = false;
                    button.innerHTML = originalText;
        });
    },
    };
})();

/**
 * Simple debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return "";
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    // For older dates, show actual date
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Inventory.js] DOM Content Loaded');
    
    // Initialize the inventory manager
    try {
        inventoryManager.init();
    } catch (error) {
        console.error('Failed to initialize inventory manager:', error);
    }
    
    // Also add a global handler for the add item button
    window.submitAddItemForm = function() {
        console.log('Global submitAddItemForm called');
        if (typeof inventoryManager !== 'undefined' && typeof inventoryManager.submitAddItemForm === 'function') {
            inventoryManager.submitAddItemForm();
                } else {
            console.error('inventoryManager.submitAddItemForm is not available');
        }
    };
});

// Expose functions globally for debugging
window.inventoryFunctions = {
    submitAddItemForm: typeof window.submitAddItemForm === 'function'
}; 