// Debug statement to confirm the script is loaded
console.log('[DEBUG] shipments.js loaded at:', new Date().toISOString());

/**
 * Shipments Manager implementation
 */
const shipmentsManager = (function() {
    // Debug mode for extra logging
    const debugMode = true;
    
    // Private helper functions
    const log = (message) => {
        if (debugMode) {
            console.log(`[Shipments] ${message}`);
        }
    };
    
    // Initialize and track state
    let initialized = false;
    
    // Cache for items data
    let availableItems = [];
    
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
            
            log('Initializing Shipments Manager');
            
            // Setup search and filter functionality
            this.setupFilters();
            
            // Load shipments data
            this.loadShipments();
            
            // Load dashboard stats
            this.loadDashboardStats();
            
            // Load recent activity data
            this.loadRecentActivity();
            
            initialized = true;
            log('Initialization complete');
        },
        
        // Setup search and filter functionality
        setupFilters: function() {
            log('Setting up filters');
            
            const shipmentSearch = document.getElementById('shipmentSearch');
            const typeFilter = document.getElementById('typeFilter');
            const statusFilter = document.getElementById('statusFilter');
            
            if (shipmentSearch) {
                shipmentSearch.addEventListener('input', debounce(() => {
                    this.filterShipments();
                }, 300));
            }
            
            if (typeFilter) {
                typeFilter.addEventListener('change', () => {
                    this.filterShipments();
                });
            }
            
            if (statusFilter) {
                statusFilter.addEventListener('change', () => {
                    this.filterShipments();
                });
            }
        },
        
        // Filter shipments based on search and filters
        filterShipments: function() {
            log('Filtering shipments');
            
            const searchQuery = document.getElementById('shipmentSearch')?.value.toLowerCase() || '';
            const typeFilter = document.getElementById('typeFilter')?.value || '';
            const statusFilter = document.getElementById('statusFilter')?.value || '';
            
            fetch('/api/Shipments')
                .then(response => response.json())
                .then(shipments => {
                    // Apply filters
                    const filtered = shipments.filter(shipment => {
                        // Apply search filter
                        const matchesSearch = searchQuery === '' || 
                            shipment.id.toLowerCase().includes(searchQuery) || 
                            shipment.partnerName.toLowerCase().includes(searchQuery);
                        
                        // Apply type filter
                        const matchesType = typeFilter === '' || 
                            shipment.type.toLowerCase() === typeFilter.toLowerCase();
                        
                        // Apply status filter
                        const matchesStatus = statusFilter === '' || 
                            shipment.status.toLowerCase() === statusFilter.toLowerCase();
                        
                        return matchesSearch && matchesType && matchesStatus;
                    });
                    
                    this.renderShipmentsTable(filtered);
                })
                .catch(error => {
                    console.error('Error filtering shipments:', error);
                });
        },
        
        // Load shipments from API
        loadShipments: function() {
            log('Loading shipments from API');
            
            fetch('/api/Shipments')
                .then(response => response.json())
                .then(shipments => {
                    log(`Loaded ${shipments.length} shipments`);
                    this.renderShipmentsTable(shipments);
                })
                .catch(error => {
                    console.error('Error loading shipments:', error);
                });
        },
        
        // Render shipments table
        renderShipmentsTable: function(shipments) {
            log('Rendering shipments table');
            
            const tableBody = document.getElementById('shipmentTableBody');
            if (!tableBody) {
                log('Shipment table body not found');
                return;
            }
            
            // Clear existing rows
            tableBody.innerHTML = '';
            
            if (shipments.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                        No shipments found matching the criteria.
                    </td>
                `;
                tableBody.appendChild(emptyRow);
                return;
            }
            
            // Add shipment rows
            shipments.forEach(shipment => {
                const row = document.createElement('tr');
                
                // Determine status color
                const statusClass = this.getStatusClass(shipment.status);
                
                // Determine priority color
                const priorityClass = this.getPriorityClass(shipment.priority);
                
                // Format date
                const formattedDate = shipment.eta 
                    ? new Date(shipment.eta).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }) 
                    : 'N/A';
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${shipment.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shipment.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shipment.partnerName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shipment.items ? shipment.items.length : 0} items</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${shipment.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityClass}">
                            ${shipment.priority}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a href="/Shipments/Details/${shipment.id}" class="text-primary hover:text-primary-dark mr-3">View</a>
                        <a href="/Shipments/Edit/${shipment.id}" class="text-primary hover:text-primary-dark mr-3">Edit</a>
                        <button onclick="shipmentsManager.deleteShipment('${shipment.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        },
        
        // Delete a shipment
        deleteShipment: function(id) {
            if (confirm(`Are you sure you want to delete shipment ${id}?`)) {
                log(`Deleting shipment ${id}`);
                
                fetch(`/api/Shipments/${id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.ok) {
                        log(`Shipment ${id} deleted successfully`);
                        // Reload shipments
                        this.loadShipments();
                        // Update dashboard stats
                        this.loadDashboardStats();
                    } else {
                        console.error(`Error deleting shipment ${id}:`, response.statusText);
                        alert(`Failed to delete shipment ${id}. Please try again.`);
                    }
                })
                .catch(error => {
                    console.error(`Error deleting shipment ${id}:`, error);
                    alert(`Failed to delete shipment ${id}. Please try again.`);
                });
            }
        },
        
        // Load dashboard stats
        loadDashboardStats: function() {
            log('Loading dashboard stats');
            
            fetch('/api/Shipments')
                .then(response => response.json())
                .then(shipments => {
                    // Calculate stats
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const active = shipments.filter(s => s.status !== 'Completed').length;
                    const highPriority = shipments.filter(s => s.priority === 'High' || s.priority === 'Urgent').length;
                    
                    const pendingInbound = shipments.filter(s => s.type === 'Inbound' && s.status !== 'Completed').length;
                    const pendingOutbound = shipments.filter(s => s.type === 'Outbound' && s.status !== 'Completed').length;
                    
                    const arrivingToday = shipments.filter(s => {
                        const eta = new Date(s.eta);
                        eta.setHours(0, 0, 0, 0);
                        return s.type === 'Inbound' && eta.getTime() === today.getTime();
                    }).length;
                    
                    const departingToday = shipments.filter(s => {
                        const eta = new Date(s.eta);
                        eta.setHours(0, 0, 0, 0);
                        return s.type === 'Outbound' && eta.getTime() === today.getTime();
                    }).length;
                    
                    const completedToday = shipments.filter(s => {
                        if (!s.completedAt) return false;
                        const completedDate = new Date(s.completedAt);
                        completedDate.setHours(0, 0, 0, 0);
                        return completedDate.getTime() === today.getTime();
                    }).length;
                    
                    // Update UI
                    document.getElementById('activeShipments')?.textContent = active;
                    document.getElementById('highPriorityCount')?.textContent = `${highPriority} high priority`;
                    
                    document.getElementById('pendingInbound')?.textContent = pendingInbound;
                    document.getElementById('arrivingToday')?.textContent = `${arrivingToday} arriving today`;
                    
                    document.getElementById('pendingOutbound')?.textContent = pendingOutbound;
                    document.getElementById('departingToday')?.textContent = `${departingToday} departing today`;
                    
                    document.getElementById('completedToday')?.textContent = completedToday;
                    
                    // Update chart if available
                    this.updateStatusChart(shipments);
                })
                .catch(error => {
                    console.error('Error loading dashboard stats:', error);
                });
        },
        
        // Update shipment status chart
        updateStatusChart: function(shipments) {
            log('Updating status chart');
            
            const chartContainer = document.getElementById('shipmentStatusChart');
            if (!chartContainer || typeof echarts === 'undefined') {
                log('Chart container or echarts library not found');
                return;
            }
            
            // Calculate status counts
            const statusCounts = {
                'Pending': 0,
                'Processing': 0,
                'In Transit': 0,
                'Completed': 0,
                'Delayed': 0
            };
            
            shipments.forEach(shipment => {
                if (statusCounts[shipment.status] !== undefined) {
                    statusCounts[shipment.status]++;
                }
            });
            
            // Prepare chart data
            const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
            
            // Initialize chart
            const chart = echarts.init(chartContainer);
            const option = {
                animation: false,
                title: {
                    text: 'Shipment Status',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left'
                },
                series: [{
                    name: 'Shipment Status',
                    type: 'pie',
                    radius: '50%',
                    data: chartData,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };
            
            chart.setOption(option);
            
            // Handle resize
            window.addEventListener('resize', () => {
                chart.resize();
            });
        },
        
        // Load recent activity
        loadRecentActivity: function() {
            log('Loading recent activity');
            
            const activityContainer = document.getElementById('recentShipmentActivity');
            if (!activityContainer) {
                log('Activity container not found');
                return;
            }
            
            // Make API call to get recent activity
            fetch('/api/ActivityLogs?category=Shipment&limit=3')
                .then(response => response.json())
                .then(activities => {
                    log(`Loaded ${activities.length} recent activities`);
                    
                    // Clear loading state
                    activityContainer.innerHTML = '';
                    
                    if (activities.length === 0) {
                        activityContainer.innerHTML = `
                            <div class="text-center text-gray-500">
                                No recent shipment activity.
                            </div>
                        `;
                        return;
                    }
                    
                    // Render activities
                    activities.forEach(activity => {
                        const iconClass = this.getActivityIconClass(activity.action);
                        
                        const activityElement = document.createElement('div');
                        activityElement.className = 'flex items-start gap-4';
                        activityElement.innerHTML = `
                            <div class="w-8 h-8 ${iconClass.bg} rounded-full flex items-center justify-center ${iconClass.text}">
                                <i class="${iconClass.icon}"></i>
                            </div>
                            <div>
                                <p class="font-medium">${activity.description}</p>
                                <p class="text-sm text-gray-500 mt-1">${this.formatTimeAgo(activity.timestamp)}</p>
                            </div>
                        `;
                        
                        activityContainer.appendChild(activityElement);
                    });
                })
                .catch(error => {
                    console.error('Error loading recent activity:', error);
                    
                    activityContainer.innerHTML = `
                        <div class="text-center text-gray-500">
                            Failed to load recent activity.
                        </div>
                    `;
                });
        },
        
        // Helpers for create/edit forms
        
        // Load available items for dropdown
        loadAvailableItems: function() {
            log('Loading available items');
            
            fetch('/api/Items')
                .then(response => response.json())
                .then(items => {
                    log(`Loaded ${items.length} items`);
                    
                    // Cache items
                    availableItems = items;
                    
                    // Populate dropdowns
                    const dropdowns = document.querySelectorAll('.item-sku');
                    dropdowns.forEach(dropdown => {
                        // Save current selection
                        const currentValue = dropdown.value;
                        
                        // Clear options except the first one
                        while (dropdown.options.length > 1) {
                            dropdown.remove(1);
                        }
                        
                        // Add item options
                        items.forEach(item => {
                            const option = document.createElement('option');
                            option.value = item.sku;
                            option.textContent = `${item.sku} - ${item.name} (${item.quantity} in stock)`;
                            dropdown.appendChild(option);
                        });
                        
                        // Restore selection if it exists
                        if (currentValue) {
                            dropdown.value = currentValue;
                        }
                    });
                    
                    // Mark selected items
                    this.markSelectedItems();
                })
                .catch(error => {
                    console.error('Error loading items:', error);
                });
        },
        
        // Add a new item row
        addItemRow: function() {
            log('Adding new item row');
            
            const itemsContainer = document.getElementById('itemsContainer');
            if (!itemsContainer) {
                log('Items container not found');
                return;
            }
            
            // Get current number of items
            const currentItems = itemsContainer.querySelectorAll('.item-row').length;
            
            // Create new row
            const newRow = document.createElement('div');
            newRow.className = 'item-row flex flex-wrap md:flex-nowrap items-end gap-4';
            newRow.innerHTML = `
                <div class="w-full md:w-1/2">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Item SKU</label>
                    <select name="Items[${currentItems}].SKU" class="item-sku border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Select an item...</option>
                        <!-- Items will be loaded dynamically -->
                    </select>
                </div>
                <div class="w-full md:w-1/4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
                    <input type="number" name="Items[${currentItems}].Quantity" class="item-quantity border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" min="1" value="1">
                </div>
                <div class="w-full md:w-1/4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Notes</label>
                    <input type="text" name="Items[${currentItems}].Notes" class="item-notes border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div class="pt-2">
                    <button type="button" class="remove-item px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            
            // Add event listener to remove button
            const removeButton = newRow.querySelector('.remove-item');
            removeButton.addEventListener('click', function() {
                if (document.querySelectorAll('.item-row').length > 1) {
                    this.closest('.item-row').remove();
                    shipmentsManager.updateItemIndexes();
                }
            });
            
            // Add to container
            itemsContainer.appendChild(newRow);
            
            // Populate dropdown
            const dropdown = newRow.querySelector('.item-sku');
            availableItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.sku;
                option.textContent = `${item.sku} - ${item.name} (${item.quantity} in stock)`;
                dropdown.appendChild(option);
            });
        },
        
        // Update item indexes in form
        updateItemIndexes: function() {
            log('Updating item indexes');
            
            const itemRows = document.querySelectorAll('.item-row');
            itemRows.forEach((row, index) => {
                const skuSelect = row.querySelector('.item-sku');
                const quantityInput = row.querySelector('.item-quantity');
                const notesInput = row.querySelector('.item-notes');
                
                if (skuSelect) skuSelect.name = `Items[${index}].SKU`;
                if (quantityInput) quantityInput.name = `Items[${index}].Quantity`;
                if (notesInput) notesInput.name = `Items[${index}].Notes`;
            });
        },
        
        // Mark selected items in dropdowns (for edit form)
        markSelectedItems: function() {
            log('Marking selected items');
            
            const hiddenInputs = document.querySelectorAll('input[type="hidden"][name$=".SKU"]');
            hiddenInputs.forEach(input => {
                const value = input.value;
                if (!value) return;
                
                const row = input.closest('.item-row');
                if (!row) return;
                
                const dropdown = row.querySelector('select.item-sku');
                if (dropdown) dropdown.value = value;
            });
        },
        
        // Load item details for details view
        loadItemDetails: function() {
            log('Loading item details');
            
            const itemNameElements = document.querySelectorAll('.item-name');
            if (itemNameElements.length === 0) {
                log('No item name elements found');
                return;
            }
            
            // Load available items if not already loaded
            if (availableItems.length === 0) {
                fetch('/api/Items')
                    .then(response => response.json())
                    .then(items => {
                        availableItems = items;
                        this.updateItemNames(itemNameElements);
                    })
                    .catch(error => {
                        console.error('Error loading items:', error);
                    });
            } else {
                this.updateItemNames(itemNameElements);
            }
        },
        
        // Update item names in details view
        updateItemNames: function(elements) {
            elements.forEach(element => {
                const sku = element.dataset.sku;
                if (!sku) return;
                
                const item = availableItems.find(i => i.sku === sku);
                if (item) {
                    element.textContent = item.name;
                } else {
                    element.textContent = 'Unknown Item';
                }
            });
        },
        
        // Submit create shipment form
        submitShipmentForm: function(form) {
            log('Submitting shipment form');
            
            // Get form data
            const formData = new FormData(form);
            
            // Convert to JSON object
            const shipment = {
                id: formData.get('Id'),
                type: formData.get('Type'),
                partnerName: formData.get('PartnerName'),
                status: formData.get('Status'),
                priority: formData.get('Priority'),
                eta: formData.get('ETA'),
                notes: formData.get('Notes'),
                items: []
            };
            
            // Get items
            const itemRows = document.querySelectorAll('.item-row');
            itemRows.forEach((row, index) => {
                const sku = formData.get(`Items[${index}].SKU`);
                if (!sku) return;
                
                shipment.items.push({
                    shipmentId: shipment.id,
                    sku: sku,
                    quantity: parseInt(formData.get(`Items[${index}].Quantity`) || '1'),
                    notes: formData.get(`Items[${index}].Notes`)
                });
            });
            
            // Submit to API
            fetch('/api/Shipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shipment)
            })
            .then(response => {
                if (response.ok) {
                    log('Shipment created successfully');
                    window.location.href = '/Shipments';
                } else {
                    return response.json().then(error => {
                        throw new Error(error.title || 'Failed to create shipment');
                    });
                }
            })
            .catch(error => {
                console.error('Error creating shipment:', error);
                alert(`Failed to create shipment: ${error.message}`);
            });
        },
        
        // Submit edit shipment form
        submitEditForm: function(form) {
            log('Submitting edit form');
            
            // Get form data
            const formData = new FormData(form);
            const id = formData.get('Id');
            
            // Convert to JSON object
            const shipment = {
                id: id,
                type: formData.get('Type'),
                partnerName: formData.get('PartnerName'),
                status: formData.get('Status'),
                priority: formData.get('Priority'),
                eta: formData.get('ETA'),
                notes: formData.get('Notes'),
                createdAt: formData.get('CreatedAt'),
                createdBy: formData.get('CreatedBy'),
                items: []
            };
            
            // Get items
            const itemRows = document.querySelectorAll('.item-row');
            itemRows.forEach((row, index) => {
                const sku = formData.get(`Items[${index}].SKU`);
                if (!sku) return;
                
                shipment.items.push({
                    shipmentId: shipment.id,
                    sku: sku,
                    quantity: parseInt(formData.get(`Items[${index}].Quantity`) || '1'),
                    notes: formData.get(`Items[${index}].Notes`)
                });
            });
            
            // Submit to API
            fetch(`/api/Shipments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shipment)
            })
            .then(response => {
                if (response.ok) {
                    log('Shipment updated successfully');
                    window.location.href = '/Shipments';
                } else {
                    return response.json().then(error => {
                        throw new Error(error.title || 'Failed to update shipment');
                    });
                }
            })
            .catch(error => {
                console.error('Error updating shipment:', error);
                alert(`Failed to update shipment: ${error.message}`);
            });
        },
        
        // Utility Functions
        
        // Get status CSS class
        getStatusClass: function(status) {
            switch (status) {
                case 'Pending':
                    return 'bg-yellow-100 text-yellow-800';
                case 'Processing':
                    return 'bg-blue-100 text-blue-800';
                case 'In Transit':
                    return 'bg-purple-100 text-purple-800';
                case 'Completed':
                    return 'bg-green-100 text-green-800';
                case 'Delayed':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        },
        
        // Get priority CSS class
        getPriorityClass: function(priority) {
            switch (priority) {
                case 'Low':
                    return 'bg-green-100 text-green-800';
                case 'Medium':
                    return 'bg-blue-100 text-blue-800';
                case 'High':
                    return 'bg-orange-100 text-orange-800';
                case 'Urgent':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        },
        
        // Get activity icon class
        getActivityIconClass: function(action) {
            switch (action) {
                case 'Created':
                    return {
                        bg: 'bg-green-100',
                        text: 'text-green-600',
                        icon: 'ri-add-line'
                    };
                case 'Updated':
                    return {
                        bg: 'bg-blue-100',
                        text: 'text-blue-600',
                        icon: 'ri-edit-line'
                    };
                case 'Deleted':
                    return {
                        bg: 'bg-red-100',
                        text: 'text-red-600',
                        icon: 'ri-delete-bin-line'
                    };
                case 'Completed':
                    return {
                        bg: 'bg-green-100',
                        text: 'text-green-600',
                        icon: 'ri-check-line'
                    };
                case 'Delayed':
                    return {
                        bg: 'bg-yellow-100',
                        text: 'text-yellow-600',
                        icon: 'ri-time-line'
                    };
                default:
                    return {
                        bg: 'bg-gray-100',
                        text: 'text-gray-600',
                        icon: 'ri-information-line'
                    };
            }
        },
        
        // Format time ago
        formatTimeAgo: function(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffSecs / 60);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffSecs < 60) {
                return 'just now';
            } else if (diffMins < 60) {
                return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 7) {
                return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }
    };
})();

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
} 