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
                    activityTypeFilter = '';
                    activitySearchQuery = '';
                    
                    // Reset UI elements
                    const typeFilter = document.getElementById('activityTypeFilter');
                    if (typeFilter) typeFilter.value = '';
                    
                    const searchInput = document.getElementById('activitySearchInput');
                    if (searchInput) searchInput.value = '';
                    
                    // Load activities when modal is opened
                    this.loadAllActivities();
                });
            } else {
                console.error('View All Activities button not found');
            }
            
            // Setup activity type filter
            const activityTypeFilter = document.getElementById('activityTypeFilter');
            if (activityTypeFilter) {
                activityTypeFilter.addEventListener('change', () => {
                    // Reset pagination and apply filter
                    activityPage = 1;
                    activityHasMore = true;
                    activityTypeFilter = activityTypeFilter.value;
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
            
            // Setup load more button
            const loadMoreActivitiesBtn = document.getElementById('loadMoreActivitiesBtn');
            if (loadMoreActivitiesBtn) {
                loadMoreActivitiesBtn.addEventListener('click', () => {
                    if (activityHasMore) {
                        activityPage++;
                        this.loadAllActivities(true); // append = true
                    }
                });
            }
        },
        
        /**
         * Load inventory items from the API
         */
        loadItems: async function() {
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
                
                // Update UI
                this.updateDashboardStats(items);
                this.renderItemsTable(items);
                
                // Notify success
                notificationService.showNotification(`Loaded ${items.length} inventory items`, 'success');
                return items;
            } catch (error) {
                console.error('Failed to load items:', error);
                notificationService.showNotification(`Error loading inventory: ${error.message}`, 'error');
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
            
            // Create item object for update
            const updatedItem = {
                sku: sku, // Cannot change SKU during edit
                name: name,
                category: category,
                quantity: parseInt(quantity, 10) || 1,
                location: location,
                condition: condition,
                notes: notes || 'No notes provided'
            };
            
            log('Updating item:', updatedItem);
            console.log('Updating item:', updatedItem);
            
            // Show loading state on the button
            const updateItemBtn = document.getElementById('updateItemBtn');
            if (updateItemBtn) {
                const originalText = updateItemBtn.innerHTML;
                updateItemBtn.disabled = true;
                updateItemBtn.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i> Updating...';
                
                try {
                    // Call API to update item
                    const data = await api.updateItem(updatedItem);
                    log('Item updated successfully:', data);
                    console.log('Item updated successfully:', data);
                    
                    // Log activity
                    await this.logActivity('Update', `Updated ${updatedItem.name} (${sku})`, sku);
                    
                    // Hide the modal
                    if (typeof modalService !== 'undefined') {
                        modalService.hideModal('editItemModal');
                    } else {
                        console.error('Modal service is not available');
                        const modal = document.getElementById('editItemModal');
                        if (modal) {
                            modal.classList.remove('active');
                        }
                    }
                    
                    // Show success notification
                    notificationService.showNotification(`Item ${name} updated successfully`, 'success');
                    
                    // Refresh the inventory
                    await this.refreshInventoryData();
                } catch (error) {
                    console.error('Error updating item:', error);
                    notificationService.showNotification(`Error: ${error.message}`, 'error');
                } finally {
                    // Restore button state
                    updateItemBtn.disabled = false;
                    updateItemBtn.innerHTML = originalText;
                }
            } else {
                // If button not found, proceed without visual feedback
                console.error('Update item button not found');
                
                try {
                    // Call API directly
                    const data = await api.updateItem(updatedItem);
                    
                    // Log activity
                    await this.logActivity('Update', `Updated ${updatedItem.name} (${sku})`, sku);
                    
                    notificationService.showNotification(`Item updated successfully`, 'success');
                    
                    if (typeof modalService !== 'undefined') {
                        modalService.hideModal('editItemModal');
                    } else {
                        const modal = document.getElementById('editItemModal');
                        if (modal) {
                            modal.classList.remove('active');
                        }
                    }
                    
                    // Refresh the inventory
                    await this.refreshInventoryData();
                } catch (error) {
                    notificationService.showNotification(`Error: ${error.message}`, 'error');
                }
            }
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
                        
                        // Refresh the inventory list
                        await this.loadItems();
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
                        
                        // Refresh the inventory list
                        await this.loadItems();
                    } catch (deleteError) {
                        console.error(`Failed to delete item ${sku}:`, deleteError);
                        notificationService.showNotification(`Error deleting item: ${deleteError.message}`, 'error');
                    }
                }
            }
        },
        
        /**
         * Submit the form to add a new item
         */
        submitAddItemForm: function() {
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
            
            // Create item object
            const newItem = {
                // Use "AUTO-GENERATE" as a special value when SKU field is empty
                sku: skuValue || "AUTO-GENERATE",
                name: name,
                category: category,
                quantity: parseInt(quantity, 10) || 1,
                location: location,
                condition: condition,
                notes: notes || 'No notes provided'
            };
            
            log('Creating new item:', newItem);
            console.log('Creating new item:', newItem);
            
            // Show loading state on the button
            const addItemBtn = document.getElementById('addItemBtn');
            if (addItemBtn) {
                const originalText = addItemBtn.innerHTML;
                addItemBtn.disabled = true;
                addItemBtn.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i> Adding...';
                
                // Call API to create item
                api.createItem(newItem)
                    .then(data => {
                        log('Item created successfully:', data);
                        console.log('Item created successfully:', data);
                        
                        // Log activity
                        this.logActivity('Add', `Added ${newItem.quantity} ${newItem.name} (${data.sku})`, data.sku);
                        
                        // Clear the form
                        if (skuField) skuField.value = '';
                        if (nameField) nameField.value = '';
                        if (categoryField) categoryField.value = '';
                        if (quantityField) quantityField.value = '1';
                        if (locationField) locationField.value = '';
                        if (conditionField) conditionField.value = '';
                        if (notesField) notesField.value = '';
                        
                        // Hide the modal
                        if (typeof modalService !== 'undefined') {
                            modalService.hideModal('addItemModal');
                        } else {
                            console.error('Modal service is not available');
                            const modal = document.getElementById('addItemModal');
                            if (modal) {
                                modal.classList.remove('active');
                            }
                        }
                        
                        // Show success notification with the generated SKU
                        notificationService.showNotification(`Item ${name} added successfully with SKU: ${data.sku}`, 'success');
                        
                        // Refresh the inventory with a success callback function
                        this.refreshInventoryData(function(refreshedItems) {
                            console.log(`Successfully refreshed inventory with ${refreshedItems.length} items`);
                        });
                    })
                    .catch(error => {
                        console.error('Error creating item:', error);
                        
                        if (error.message && error.message.includes('409')) {
                            // Item with this SKU already exists
                            notificationService.showNotification(`A product with SKU "${skuValue}" already exists. Please use a different SKU or leave blank for auto-generation.`, 'error');
                            this.showFieldError(skuField, 'This SKU already exists');
                        } else {
                            // Generic error
                            notificationService.showNotification(`Error: ${error.message}`, 'error');
                        }
                    })
                    .finally(() => {
                        // Restore button state
                        addItemBtn.disabled = false;
                        addItemBtn.innerHTML = originalText;
                    });
            } else {
                // If button not found, proceed without visual feedback
                console.error('Add item button not found');
                
                // Call API directly
                api.createItem(newItem)
                    .then(data => {
                        // Log activity
                        this.logActivity('Add', `Added ${newItem.quantity} ${newItem.name} (${data.sku})`, data.sku);
                        
                        notificationService.showNotification(`Item added successfully with SKU: ${data.sku}`, 'success');
                        
                        if (typeof modalService !== 'undefined') {
                            modalService.hideModal('addItemModal');
                        } else {
                            const modal = document.getElementById('addItemModal');
                            if (modal) {
                                modal.classList.remove('active');
                            }
                        }
                        
                        // Refresh the inventory
                        this.refreshInventoryData();
                    })
                    .catch(error => {
                        notificationService.showNotification(`Error: ${error.message}`, 'error');
                    });
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
         * Refresh inventory data from the server
         * @param {Function} callback - Optional callback function to execute after refresh
         */
        refreshInventoryData: async function(callback) {
            console.log('Refreshing inventory data');
            
            // Show loading state if desired
            const stockListHeader = document.querySelector('.bg-white .p-6.border-b h3');
            if (stockListHeader) {
                const originalText = stockListHeader.innerHTML;
                stockListHeader.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i> Refreshing...';
                
                try {
                    const items = await this.loadItems();
                    
                    // Also refresh recent activities
                    await this.loadRecentActivity();
                    
                    // Also refresh stock movement data if available
                    if (typeof this.loadStockMovementData === 'function') {
                        this.loadStockMovementData();
                    }
                    
                    // Execute callback if provided
                    if (typeof callback === 'function') {
                        callback(items);
                    }
                    
                    // Restore header text
                    stockListHeader.innerHTML = originalText;
                } catch (error) {
                    console.error('Error refreshing inventory data:', error);
                    stockListHeader.innerHTML = originalText;
                }
            } else {
                // If header not found, just refresh data
                try {
                    const items = await this.loadItems();
                    
                    // Also refresh recent activities
                    await this.loadRecentActivity();
                    
                    // Also refresh stock movement data if available
                    if (typeof this.loadStockMovementData === 'function') {
                        this.loadStockMovementData();
                    }
                    
                    // Execute callback if provided
                    if (typeof callback === 'function') {
                        callback(items);
                    }
                } catch (error) {
                    console.error('Error refreshing inventory data:', error);
                }
            }
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
            
                    // Refresh the inventory - more reliable
                    console.log('Refreshing inventory data after scanned item creation');
                    try {
                        // First try direct call to refresh items
                        this.loadItems();
                        
                        // As a fallback, also reload the page after a short delay
                        setTimeout(() => {
                            console.log('Performing full page reload as fallback');
                            window.location.reload();
                        }, 2000);
                    } catch (e) {
                        console.error('Error during refresh, forcing page reload:', e);
                        setTimeout(() => window.location.reload(), 1500);
                    }
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
        
        /**
         * Load stock movement data for the chart
         */
        loadStockMovementData: async function() {
            log('Loading stock movement data');
            
            try {
                // Get stock movement data from API
                const data = await api.getStockMovementData();
                
                // Update chart
                this.updateStockMovementChart(data);
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
            const stockMovementChart = echarts.getInstanceByDom(document.getElementById('stockMovementChart'));
            
            if (!stockMovementChart) {
                log('Stock movement chart not found, initializing new chart');
                const chartElement = document.getElementById('stockMovementChart');
                if (!chartElement) {
                    console.error('Stock movement chart element not found');
            return;
        }
        
                // Initialize new chart
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
            } else {
                // Update existing chart
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
            }
            
            log('Stock movement chart updated');
        },
        
        /**
         * Load recent activity data
         */
        loadRecentActivity: async function() {
            log('Loading recent activity data');
            
            try {
                // Get recent activity from API
                const activities = await api.getRecentActivities(5);
                console.log('Recent activities loaded:', activities);
                
                // Update UI
                this.updateRecentActivity(activities);
            } catch (error) {
                console.error('Failed to load recent activity:', error);
                // Use demo data as fallback
                this.updateRecentActivity([]);
            }
        },
        
        /**
         * Update the recent activity section
         * @param {ActivityLog[]} activities - Recent activities
         */
        updateRecentActivity: function(activities) {
            const recentActivityContainer = document.querySelector('.bg-white:last-child .p-6.space-y-6');
            
            if (!recentActivityContainer) {
                console.error('Recent activity container not found');
                return;
            }
            
            // Clear current content
            recentActivityContainer.innerHTML = '';
            
            // If no activities, use demo data
            if (!activities || activities.length === 0) {
                // Use demo data
                recentActivityContainer.innerHTML = `
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
    
                recentActivityContainer.appendChild(activityElement);
            });
            
            log('Recent activity updated');
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
            }
            
            try {
                let activities;
                
                // Apply filters if set
                if (activityTypeFilter) {
                    activities = await api.getActivitiesByType(activityTypeFilter, activityPageSize * activityPage);
                } else {
                    activities = await api.getActivityLogs(activityPageSize * activityPage);
                }
                
                // Apply search filter in memory if needed
                if (activitySearchQuery && activities && activities.length > 0) {
                    const query = activitySearchQuery.toLowerCase();
                    activities = activities.filter(activity => 
                        (activity.description && activity.description.toLowerCase().includes(query)) || 
                        (activity.itemSKU && activity.itemSKU.toLowerCase().includes(query)) ||
                        (activity.userName && activity.userName.toLowerCase().includes(query))
                    );
                }
                
                // Check if we have more records
                activityHasMore = activities.length === activityPageSize * activityPage;
                
                // Update UI based on whether we have more items
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = !activityHasMore;
                    if (!activityHasMore) {
                        loadMoreBtn.classList.add('opacity-50');
                    } else {
                        loadMoreBtn.classList.remove('opacity-50');
                    }
                }
                
                // Get the correct page of activities
                let pageActivities;
                if (activityPage > 1) {
                    pageActivities = activities.slice((activityPage - 1) * activityPageSize, activityPage * activityPageSize);
                } else {
                    pageActivities = activities.slice(0, activityPageSize);
                }
                
                // Render activities
                this.renderActivitiesTable(pageActivities, append);
                
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
            
            // If no activities, show message
            if (!activities || activities.length === 0) {
                if (!append) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                No activities found
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            
            // Add activities to table
            activities.forEach(activity => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                
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
    
    // Make sure the Add Item button works
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        console.log('Add Item button found in DOM, adding redundant event listener');
        addItemBtn.addEventListener('click', function() {
            console.log('Add Item button clicked (redundant handler)');
            inventoryManager.submitAddItemForm();
        });
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