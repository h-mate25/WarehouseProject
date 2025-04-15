// Debug statement to confirm the script is loaded
console.log('[DEBUG] home-shipments.js loaded at:', new Date().toISOString());

/**
 * Home Shipments Manager implementation
 */
const homeShipmentsManager = (function() {
    // Debug mode for extra logging
    const debugMode = true;
    
    // Private helper functions
    const log = (message) => {
        if (debugMode) {
            console.log(`[Home/Shipments] ${message}`);
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
            // Print debug info
            log('Initializing Home Shipments Manager');
            
            // Set up filters
            this.setupFilters();
            
            // Set up activity events
            this.setupActivityEvents();
            
            // Load shipments
            this.loadShipments();
            
            // Set up shipment status chart
            this.setupShipmentStatusChart();
            
            // Load recent activities
            this.loadRecentActivity();
            
            // Set up button handlers
            const modalTrigger = document.querySelector('button[onclick="showModal(\'shipmentModal\')"]');
            if (modalTrigger) {
                log('Found modal trigger button');
                modalTrigger.addEventListener('click', () => {
                    this.openNewShipmentForm();
                });
            } else {
                log('Modal trigger button not found');
            }
            
            // Fix for new shipment buttons - add direct event handlers
            const newShipmentButtons = document.querySelectorAll('button[onclick*="showModal(\'shipmentModal\')"]');
            log(`Found ${newShipmentButtons.length} new shipment buttons`);
            
            newShipmentButtons.forEach(button => {
                // Remove the inline onclick handler
                const originalOnClick = button.getAttribute('onclick');
                button.removeAttribute('onclick');
                
                // Add a new event listener
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    log('New shipment button clicked');
                    // First show the modal using the modal service
                    if (typeof window.modalService !== 'undefined') {
                        window.modalService.showModal('shipmentModal');
                    } else {
                        // Fallback to direct manipulation
                        const modal = document.getElementById('shipmentModal');
                        if (modal) {
                            modal.classList.add('active');
                            // Also remove 'hidden' class if present
                            modal.classList.remove('hidden');
                        }
                    }
                    // Then initialize the form
                    this.openNewShipmentForm();
                });
            });
            
            // Setup the add item button
            const addItemBtn = document.getElementById('addItemBtn');
            if (addItemBtn) {
                addItemBtn.addEventListener('click', () => {
                    this.addItemRow();
                });
            }
            
            // Setup form submission
            const shipmentForm = document.getElementById('newShipmentForm');
            if (shipmentForm) {
                shipmentForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitShipmentForm();
                });
            }
        },
        
        // Setup search and filter functionality
        setupFilters: function() {
            log('Setting up filters');
            
            const searchInput = document.querySelector('input[placeholder="Search shipments..."]');
            if (searchInput) {
                searchInput.addEventListener('input', debounce(() => {
                    this.filterShipments();
                }, 300));
            }
        },
        
        // Filter shipments based on search 
        filterShipments: function() {
            log('Filtering shipments');
            
            const searchQuery = document.querySelector('input[placeholder="Search shipments..."]')?.value.toLowerCase() || '';
            const shipmentType = document.getElementById('shipmentTypeFilter')?.value || '';
            
            fetch(`/api/Home/Shipments?search=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(shipmentType)}`)
                .then(response => response.json())
                .then(shipments => {
                    log(`Loaded ${shipments.length} filtered shipments`);
                    this.renderShipmentsTable(shipments);
                })
                .catch(error => {
                    console.error('Error filtering shipments:', error);
                });
        },
        
        // Load shipments from API
        loadShipments: function() {
            log('Loading shipments from API');
            
            const shipmentType = document.getElementById('shipmentTypeFilter')?.value || '';
            
            fetch(`/api/Home/Shipments?type=${encodeURIComponent(shipmentType)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(shipments => {
                    log(`Loaded ${shipments.length} shipments`);
                    this.renderShipmentsTable(shipments);
                    this.updateDashboardStats();
                    this.updateShipmentStatusChart(shipments);
                })
                .catch(error => {
                    console.error('Error loading shipments:', error);
                    
                    // Show error message in the table
                    const tableBody = document.querySelector('table tbody');
                    if (tableBody) {
                        tableBody.innerHTML = `
                            <tr>
                                <td colspan="7" class="px-6 py-4 text-center text-red-500">
                                    Failed to load shipments: ${error.message}
                                    <div class="mt-2">
                                        <button onclick="homeShipmentsManager.loadShipments()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded">
                                            Try Again
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                });
        },
        
        // Render shipments table
        renderShipmentsTable: function(shipments) {
            log('Rendering shipments table');
            
            const tableBody = document.querySelector('table tbody');
            if (!tableBody) {
                log('Shipment table body not found');
                return;
            }
            
            // Remove existing rows except the first one (which might be a template)
            const templateRow = tableBody.querySelector('tr');
            tableBody.innerHTML = '';
            
            if (templateRow) {
                // Hide the template row initially
                templateRow.style.display = 'none';
                tableBody.appendChild(templateRow);
            }
            
            if (shipments.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No shipments found matching the criteria.
                    </td>
                `;
                tableBody.appendChild(emptyRow);
                return;
            }
            
            // Add shipment rows
            shipments.forEach(shipment => {
                const row = document.createElement('tr');
                
                // Determine status class
                const statusClass = this.getStatusClass(shipment.status);
                
                // Format ETA
                const formattedEta = new Date(shipment.eta).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                // Get item count
                const itemCount = shipment.items ? shipment.items.length : 0;
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${shipment.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shipment.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shipment.partnerName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${itemCount} items</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${shipment.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedEta}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div class="flex space-x-2">
                            <button onclick="homeShipmentsManager.viewShipment('${shipment.id}')" class="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100">
                                <i class="ri-eye-line text-lg"></i>
                            </button>
                            <button onclick="homeShipmentsManager.editShipment('${shipment.id}')" class="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100">
                                <i class="ri-edit-line text-lg"></i>
                            </button>
                            <button onclick="homeShipmentsManager.deleteShipment('${shipment.id}')" class="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100">
                                <i class="ri-delete-bin-line text-lg"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        },
        
        // Update dashboard statistics from ViewData
        updateDashboardStats: function() {
            log('Updating dashboard statistics');
            
            // Update the stats from the pre-calculated ViewData
            // These will be populated on initial page load
            // For dynamic updates after client actions, we'll need to fetch updated stats
            fetch('/api/Home/Shipments')
                .then(response => response.json())
                .then(shipments => {
                    // Calculate stats
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const active = shipments.filter(s => s.status !== 'Completed').length;
                    const highPriority = shipments.filter(s => 
                        (s.priority === 'High' || s.priority === 'Urgent') && 
                        s.status !== 'Completed').length;
                    
                    const pendingInbound = shipments.filter(s => 
                        s.type === 'Inbound' && 
                        s.status !== 'Completed').length;
                        
                    const pendingOutbound = shipments.filter(s => 
                        s.type === 'Outbound' && 
                        s.status !== 'Completed').length;
                    
                    const arrivingToday = shipments.filter(s => {
                        const eta = new Date(s.eta);
                        return s.type === 'Inbound' && 
                               eta.toDateString() === today.toDateString() && 
                               s.status !== 'Completed';
                    }).length;
                    
                    const departingToday = shipments.filter(s => {
                        const eta = new Date(s.eta);
                        return s.type === 'Outbound' && 
                               eta.toDateString() === today.toDateString() && 
                               s.status !== 'Completed';
                    }).length;
                    
                    const completedToday = shipments.filter(s => {
                        if (!s.completedAt) return false;
                        const completedDate = new Date(s.completedAt);
                        return s.status === 'Completed' && 
                               completedDate.toDateString() === today.toDateString();
                    }).length;
                    
                    // Update UI
                    document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2 h3:first-of-type').textContent = active;
                    document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2 span:first-of-type').textContent = `${highPriority} high priority`;
                    
                    const statsElements = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2 h3');
                    if (statsElements.length >= 2) statsElements[1].textContent = pendingInbound;
                    if (statsElements.length >= 3) statsElements[2].textContent = pendingOutbound;
                    if (statsElements.length >= 4) statsElements[3].textContent = completedToday;
                    
                    const subStatsElements = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2 span');
                    if (subStatsElements.length >= 2) subStatsElements[1].textContent = `${arrivingToday} arriving today`;
                    if (subStatsElements.length >= 3) subStatsElements[2].textContent = `${departingToday} departing today`;
                })
                .catch(error => {
                    console.error('Error updating dashboard stats:', error);
                });
        },
        
        // Setup modals
        setupModals: function() {
            log('Setting up modals');
            
            // Find and setup the shipment modal
            const modalTrigger = document.querySelector('button[onclick="showModal(\'shipmentModal\')"]');
            if (modalTrigger) {
                log('Modal trigger found, attaching event listener');
                modalTrigger.addEventListener('click', () => {
                    this.openNewShipmentForm();
                });
            }
            
            // Setup Add Item button
            const addItemBtn = document.getElementById('addItemBtn');
            if (addItemBtn) {
                log('Add Item button found, attaching event listener');
                addItemBtn.addEventListener('click', () => {
                    this.addItemRow();
                });
            }
        },
        
        // Open new shipment form
        openNewShipmentForm: function() {
            log('Opening new shipment form');
            
            // Load items for selection
            this.loadAvailableItems();
            
            // Generate a unique shipment ID based on shipment type
            const shipmentTypeSelect = document.querySelector('select[name="type"]');
            const shipmentType = shipmentTypeSelect ? shipmentTypeSelect.value : 'Inbound';
            
            // Determine the prefix based on the type
            let prefix = 'IN'; // Default to Inbound
            if (shipmentType === 'Outbound') {
                prefix = 'OU';
            }
            
            // Create a timestamp component (YYYYMMDDHHMMSS format)
            const now = new Date();
            const timestamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0'),
                String(now.getHours()).padStart(2, '0'),
                String(now.getMinutes()).padStart(2, '0'),
                String(now.getSeconds()).padStart(2, '0')
            ].join('');
            
            // Add a random number to ensure uniqueness
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            
            // Combine to create the final ID
            const shipmentId = `${prefix}${timestamp}${random}`;
            
            // Set it in the form
            const shipmentIdInput = document.getElementById('shipmentIdInput');
            if (shipmentIdInput) {
                shipmentIdInput.value = shipmentId;
            }
            
            // Add event listener to the type select to update ID when type changes
            if (shipmentTypeSelect) {
                shipmentTypeSelect.addEventListener('change', () => {
                    // Generate a new ID based on the selected type
                    const newType = shipmentTypeSelect.value;
                    const newPrefix = newType === 'Outbound' ? 'OU' : 'IN';
                    
                    // Get new timestamp
                    const now = new Date();
                    const newTimestamp = [
                        now.getFullYear(),
                        String(now.getMonth() + 1).padStart(2, '0'),
                        String(now.getDate()).padStart(2, '0'),
                        String(now.getHours()).padStart(2, '0'),
                        String(now.getMinutes()).padStart(2, '0'),
                        String(now.getSeconds()).padStart(2, '0')
                    ].join('');
                    
                    // New random number
                    const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    
                    // Update the ID field
                    if (shipmentIdInput) {
                        shipmentIdInput.value = `${newPrefix}${newTimestamp}${newRandom}`;
                    }
                    
                    // Reload items based on new shipment type
                    log(`Shipment type changed to ${newType}, reloading items`);
                    this.loadAvailableItems();
                });
            }
            
            // Set a default ETA (current time + 24 hours)
            const etaInput = document.querySelector('input[name="eta"]');
            if (etaInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                // Format as YYYY-MM-DDTHH:MM
                const formattedDate = tomorrow.toISOString().substring(0, 16);
                etaInput.value = formattedDate;
                log('Set default ETA to:', formattedDate);
            }
        },
        
        // Load available items for selection
        loadAvailableItems: function() {
            log('Loading available items');
            
            // Get current shipment type
            const shipmentTypeSelect = document.querySelector('select[name="type"]');
            const currentShipmentType = shipmentTypeSelect ? shipmentTypeSelect.value : 'Inbound';
            log(`Current shipment type: ${currentShipmentType}`);
            
            // Make sure we're using the correct API endpoint
            fetch('/api/Items')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(items => {
                    log(`Loaded ${items.length} items from API`);
                    
                    // Filter items based on shipment type
                    let filteredItems = items;
                    
                    // For Inbound shipments, only show items with "In Shipment" location
                    if (currentShipmentType === 'Inbound') {
                        filteredItems = items.filter(item => {
                            const location = item.location || item.Location || '';
                            return location.toLowerCase() === 'in shipment';
                        });
                        log(`Filtered to ${filteredItems.length} items with "In Shipment" location`);
                    } 
                    // For Outbound shipments, only show items that are in one of the zones
                    else if (currentShipmentType === 'Outbound') {
                        filteredItems = items.filter(item => {
                            const location = item.location || item.Location || '';
                            // Check if location starts with "Zone"
                            return location.startsWith('Zone');
                        });
                        log(`Filtered to ${filteredItems.length} items in zones (for outbound shipment)`);
                    }
                    
                    // Cache all items for later use
                    availableItems = items;
                    
                    // Populate item selection in the modal
                    const itemSelects = document.querySelectorAll('.item-select');
                    itemSelects.forEach(select => {
                        // Save current selection
                        const currentValue = select.value;
                        
                        // Clear options except first placeholder
                        while (select.options.length > 1) {
                            select.options.remove(1);
                        }
                        
                        // Add filtered items
                        filteredItems.forEach(item => {
                            const option = document.createElement('option');
                            option.value = item.sku || item.SKU; // Handle different casing
                            option.textContent = `${item.sku || item.SKU} - ${item.name || item.Name} (${item.quantity || item.Quantity} in stock)`;
                            option.dataset.quantity = item.quantity || item.Quantity; // Store quantity in dataset for easy access
                            select.appendChild(option);
                        });
                        
                        // Restore selection if exists
                        if (currentValue) {
                            select.value = currentValue;
                        }
                        
                        // Add event listener to auto-fill quantity
                        select.addEventListener('change', function() {
                            const selectedOption = this.options[this.selectedIndex];
                            if (selectedOption && selectedOption.dataset.quantity) {
                                // Find the quantity input in the same row
                                const quantityInput = this.closest('.item-row').querySelector('.item-quantity');
                                if (quantityInput) {
                                    log(`Auto-filling quantity: ${selectedOption.dataset.quantity}`);
                                    quantityInput.value = selectedOption.dataset.quantity;
                                }
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Error loading items:', error);
                    // Show an error message to the user
                    this.showNotification(`Failed to load items: ${error.message}. Please refresh the page and try again.`, 'error');
                });
        },
        
        // Setup shipment status chart
        setupShipmentStatusChart: function() {
            log('Setting up shipment status chart');
            
            const chartContainer = document.getElementById('shipmentStatusChart');
            if (!chartContainer) {
                console.error('Chart container not found');
                return;
            }
            
            // Check if echarts is available
            if (typeof echarts === 'undefined') {
                console.error('ECharts library not found - please add: <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>');
                
                // Add a message to the chart container
                chartContainer.innerHTML = '<div class="flex items-center justify-center h-40"><div class="text-gray-500">Chart library not available</div></div>';
                return;
            }
            
            fetch('/api/Home/Shipments')
                .then(response => response.json())
                .then(shipments => {
                    this.updateShipmentStatusChart(shipments);
                })
                .catch(error => {
                    console.error('Error loading data for chart:', error);
                    chartContainer.innerHTML = `<div class="flex items-center justify-center h-40"><div class="text-red-500">Error loading chart data: ${error.message}</div></div>`;
                });
        },
        
        // Update shipment status chart with real data
        updateShipmentStatusChart: function(shipments) {
            log('Updating shipment status chart');
            
            const chartContainer = document.getElementById('shipmentStatusChart');
            if (!chartContainer || typeof echarts === 'undefined') {
                return;
            }
            
            // Calculate status counts
            const statusCounts = {
                'Processing': 0,
                'In Transit': 0,
                'Completed': 0,
                'Delayed': 0,
                'Pending': 0
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
        
        // View shipment details
        viewShipment: function(id) {
            log(`Viewing shipment ${id}`);
            
            // Ensure id is clean for API use
            const cleanId = encodeURIComponent(id.trim());
            
            fetch(`/api/Home/Shipments/${cleanId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load shipment: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(shipment => {
                    log('Shipment details:', shipment);
                    this.displayShipmentModal(shipment);
                })
                .catch(error => {
                    console.error(`Error loading shipment ${id}:`, error);
                    this.showNotification(`Failed to load shipment details: ${error.message}`, 'error');
                });
        },
        
        // Display shipment modal with details
        displayShipmentModal: function(shipment) {
            // Create or get modal container
            let modalContainer = document.getElementById('viewShipmentModal');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'viewShipmentModal';
                modalContainer.className = 'fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center hidden';
                document.body.appendChild(modalContainer);
            }
            
            // Format dates nicely
            const etaFormatted = new Date(shipment.eta).toLocaleString();
            const createdAtFormatted = shipment.createdAt ? new Date(shipment.createdAt).toLocaleString() : 'N/A';
            const completedAtFormatted = shipment.completedAt ? new Date(shipment.completedAt).toLocaleString() : 'N/A';
            
            // Get status class
            const statusClass = this.getStatusClass(shipment.status);
            
            // Build modal content
            modalContainer.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto">
                    <div class="flex justify-between items-center px-6 py-4 border-b">
                        <h3 class="text-lg font-medium text-gray-900">Shipment Details</h3>
                        <button class="text-gray-400 hover:text-gray-500" onclick="document.getElementById('viewShipmentModal').classList.add('hidden')">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="px-6 py-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p class="text-sm text-gray-500 mb-1">Shipment ID</p>
                                <p class="font-medium">${shipment.id}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 mb-1">Type</p>
                                <p class="font-medium">${shipment.type}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 mb-1">Partner</p>
                                <p class="font-medium">${shipment.partnerName}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 mb-1">Status</p>
                                <p>
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                                        ${shipment.status}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 mb-1">Priority</p>
                                <p class="font-medium">${shipment.priority || 'Medium'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 mb-1">ETA</p>
                                <p class="font-medium">${etaFormatted}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 mb-1">Created</p>
                                <p class="font-medium">${createdAtFormatted}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 mb-1">Completed</p>
                                <p class="font-medium">${completedAtFormatted}</p>
                            </div>
                        </div>
                        
                        <div class="mb-6">
                            <p class="text-sm text-gray-500 mb-1">Notes</p>
                            <p class="font-medium">${shipment.notes || 'No notes'}</p>
                        </div>
                        
                        <div>
                            <h4 class="text-lg font-medium text-gray-900 mb-2">Items (${shipment.items ? shipment.items.length : 0})</h4>
                            ${this.renderShipmentItemsTable(shipment.items)}
                        </div>
                    </div>
                    
                    <div class="px-6 py-4 border-t flex justify-end">
                        <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2" 
                            onclick="document.getElementById('viewShipmentModal').classList.add('hidden')">
                            Close
                        </button>
                        <button class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                            onclick="homeShipmentsManager.editShipment('${shipment.id}')">
                            Edit Shipment
                        </button>
                    </div>
                </div>
            `;
            
            // Show the modal
            modalContainer.classList.remove('hidden');
        },
        
        // Render shipment items table
        renderShipmentItemsTable: function(items) {
            if (!items || items.length === 0) {
                return `<p class="text-gray-500">No items in this shipment</p>`;
            }
            
            let tableHtml = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;
            
            items.forEach(item => {
                tableHtml += `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.sku}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.quantity}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.notes || '-'}</td>
                    </tr>
                `;
            });
            
            tableHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            
            return tableHtml;
        },
        
        // Display edit shipment modal
        displayEditShipmentModal: function(shipment) {
            log('Displaying edit shipment modal');
            
            // Load available items for the dropdown
            this.loadAvailableItems();
            
            // Create or get modal container
            let modalContainer = document.getElementById('editShipmentModal');
            if (!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'editShipmentModal';
                modalContainer.className = 'fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center hidden';
                document.body.appendChild(modalContainer);
            }
            
            // Format the ETA date for the input
            const etaDate = new Date(shipment.eta);
            const formattedEta = etaDate.toISOString().substring(0, 16); // Format as YYYY-MM-DDTHH:MM
            
            // Build modal content
            modalContainer.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto">
                    <div class="flex justify-between items-center px-6 py-4 border-b">
                        <h3 class="text-lg font-medium text-gray-900">Edit Shipment</h3>
                        <button class="text-gray-400 hover:text-gray-500" onclick="document.getElementById('editShipmentModal').classList.add('hidden')">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <form id="editShipmentForm" onsubmit="event.preventDefault(); homeShipmentsManager.updateShipment(this);">
                        <div class="px-6 py-4">
                            <input type="hidden" name="id" value="${shipment.id}">
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Shipment ID</label>
                                    <input type="text" value="${shipment.id}" class="border rounded w-full py-2 px-3 bg-gray-100" readonly>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select name="type" class="border rounded w-full py-2 px-3" required>
                                        <option value="Inbound" ${shipment.type === 'Inbound' ? 'selected' : ''}>Inbound</option>
                                        <option value="Outbound" ${shipment.type === 'Outbound' ? 'selected' : ''}>Outbound</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                                    <input type="text" name="partnerName" value="${shipment.partnerName}" class="border rounded w-full py-2 px-3" required>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select name="status" class="border rounded w-full py-2 px-3" required>
                                        <option value="Pending" ${shipment.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                        <option value="Processing" ${shipment.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                        <option value="In Transit" ${shipment.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                                        <option value="Completed" ${shipment.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                        <option value="Delayed" ${shipment.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select name="priority" class="border rounded w-full py-2 px-3" required>
                                        <option value="Low" ${shipment.priority === 'Low' ? 'selected' : ''}>Low</option>
                                        <option value="Medium" ${(shipment.priority === 'Medium' || !shipment.priority) ? 'selected' : ''}>Medium</option>
                                        <option value="High" ${shipment.priority === 'High' ? 'selected' : ''}>High</option>
                                        <option value="Urgent" ${shipment.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">ETA</label>
                                    <input type="datetime-local" name="eta" value="${formattedEta}" class="border rounded w-full py-2 px-3" required>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea name="notes" class="border rounded w-full py-2 px-3" rows="2">${shipment.notes || ''}</textarea>
                            </div>
                            
                            <div class="mb-4">
                                <div class="flex justify-between items-center mb-2">
                                    <h4 class="text-lg font-medium text-gray-900">Items</h4>
                                    <button type="button" id="editAddItemBtn" class="py-1 px-3 bg-primary text-white rounded hover:bg-primary-dark text-sm">
                                        Add Item
                                    </button>
                                </div>
                                
                                <div id="editItemContainer" class="space-y-2">
                                    <!-- Items will be added here -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="px-6 py-4 border-t flex justify-end">
                            <button type="button" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2" 
                                onclick="document.getElementById('editShipmentModal').classList.add('hidden')">
                                Cancel
                            </button>
                            <button type="submit" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            // Show the modal
            modalContainer.classList.remove('hidden');
            
            // Setup Add Item button
            const addItemBtn = document.getElementById('editAddItemBtn');
            if (addItemBtn) {
                addItemBtn.addEventListener('click', () => {
                    this.addEditItemRow();
                });
            }
            
            // Populate items
            const itemContainer = document.getElementById('editItemContainer');
            if (itemContainer && shipment.items && shipment.items.length > 0) {
                shipment.items.forEach((item) => {
                    this.addEditItemRow(item);
                });
            } else {
                // Add at least one empty row
                this.addEditItemRow();
            }
        },
        
        // Add a new item row to the edit shipment form
        addEditItemRow: function(item = null) {
            log('Adding new item row to edit form');
            
            const itemContainer = document.getElementById('editItemContainer');
            if (!itemContainer) {
                log('Edit item container not found');
                return;
            }
            
            // Get the current number of items
            const itemCount = itemContainer.querySelectorAll('.edit-item-row').length;
            
            // Create a new row
            const newRow = document.createElement('div');
            newRow.className = 'edit-item-row grid grid-cols-12 gap-2 border p-2 rounded';
            
            newRow.innerHTML = `
                <div class="col-span-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Item</label>
                    <select name="items[${itemCount}].sku" class="edit-item-select border rounded w-full py-2 px-3" required>
                        <option value="">Select an item</option>
                        <!-- Items will be loaded dynamically -->
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" name="items[${itemCount}].quantity" class="edit-item-quantity border rounded w-full py-2 px-3" min="1" value="${item ? item.quantity : '1'}" required>
                </div>
                <div class="col-span-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input type="text" name="items[${itemCount}].notes" class="edit-item-notes border rounded w-full py-2 px-3" value="${item ? (item.notes || '') : ''}">
                </div>
                <div class="col-span-1 flex items-end">
                    <button type="button" class="edit-remove-item-btn py-2 px-2 bg-red-100 text-red-600 rounded hover:bg-red-200">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            
            // Add the new row to the container
            itemContainer.appendChild(newRow);
            
            // Populate the new select with items
            const newSelect = newRow.querySelector('.edit-item-select');
            if (newSelect) {
                // Get current shipment type
                const shipmentTypeSelect = document.querySelector('select[name="type"]');
                const currentShipmentType = shipmentTypeSelect ? shipmentTypeSelect.value : 'Inbound';
                
                // Add items from the cached list
                if (availableItems.length > 0) {
                    // Filter based on shipment type
                    let itemsToShow = availableItems;
                    
                    // Get the current shipment ID being edited
                    const shipmentIdInput = document.querySelector('input[name="id"]');
                    const currentShipmentId = shipmentIdInput ? shipmentIdInput.value : '';
                    
                    // For Inbound shipments, show items with "In Shipment" location and this specific shipment ID
                    if (currentShipmentType === 'Inbound') {
                        itemsToShow = availableItems.filter(item => {
                            const location = item.location || item.Location || '';
                            return location.toLowerCase() === 'in shipment' || 
                                  (currentShipmentId && location === currentShipmentId);
                        });
                        log(`Filtered to ${itemsToShow.length} items with "In Shipment" location or in this shipment`);
                    }
                    // For Outbound shipments, show items that are in one of the zones or in this specific shipment
                    else if (currentShipmentType === 'Outbound') {
                        itemsToShow = availableItems.filter(item => {
                            const location = item.location || item.Location || '';
                            // Check if location starts with "Zone" or matches the current shipment ID
                            return location.startsWith('Zone') || 
                                  (currentShipmentId && location === currentShipmentId);
                        });
                        log(`Filtered to ${itemsToShow.length} items in zones or in this shipment`);
                    }
                    
                    itemsToShow.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.sku || item.SKU; // Handle different casing
                        option.textContent = `${item.sku || item.SKU} - ${item.name || item.Name} (${item.quantity || item.Quantity} in stock)`;
                        option.dataset.quantity = item.quantity || item.Quantity; // Store quantity in dataset
                        
                        // Get the current shipment ID being edited
                        const shipmentIdInput = document.querySelector('input[name="id"]');
                        const currentShipmentId = shipmentIdInput ? shipmentIdInput.value : '';
                        
                        // Auto-select the item if its location matches the shipment ID or if it matches the provided item
                        const itemSku = item.sku || item.SKU;
                        const itemLocation = item.location || item.Location || '';
                        
                        // Set selected if:
                        // 1. This is an existing item row AND the SKU matches the provided item's SKU
                        // 2. OR This is a new row (no provided item) AND the item's location matches the current shipment ID
                        let isSelected = false;
                        
                        if (item) {
                            // Case 1: This is an existing item - select if SKU matches
                            isSelected = itemSku === (item.sku || '');
                        } else if (currentShipmentId && itemLocation === currentShipmentId) {
                            // Case 2: This is a new row - select if location matches shipment ID
                            isSelected = true;
                        }
                        
                        if (isSelected) {
                            option.selected = true;
                            log(`Auto-selected item ${itemSku} because ${item ? 'it matches the provided item' : 'its location matches the shipment ID'}`);
                        }
                        
                        newSelect.appendChild(option);
                    });
                    
                    // Add change event listener for auto-filling quantity
                    newSelect.addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        if (selectedOption && selectedOption.dataset.quantity) {
                            // Find the quantity input in the same row
                            const quantityInput = this.closest('.edit-item-row').querySelector('.edit-item-quantity');
                            if (quantityInput) {
                                log(`Auto-filling quantity: ${selectedOption.dataset.quantity}`);
                                quantityInput.value = selectedOption.dataset.quantity;
                            }
                        }
                    });
                } else {
                    // If the cache is empty, load items
                    this.loadAvailableItems();
                }
            }
            
            // Enable remove button event
            const removeBtn = newRow.querySelector('.edit-remove-item-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    this.removeEditItemRow(e.currentTarget.closest('.edit-item-row'));
                });
                
                // Disable remove button if it's the only row
                if (itemContainer.querySelectorAll('.edit-item-row').length === 1) {
                    removeBtn.disabled = true;
                } else {
                    removeBtn.disabled = false;
                }
            }
        },
        
        // Remove an item row from the edit shipment form
        removeEditItemRow: function(row) {
            log('Removing edit item row');
            
            if (!row) {
                log('Row not provided');
                return;
            }
            
            const itemContainer = document.getElementById('editItemContainer');
            if (!itemContainer) {
                log('Edit item container not found');
                return;
            }
            
            // Remove the row
            row.remove();
            
            // Update the remaining rows to have sequential indices
            const rows = itemContainer.querySelectorAll('.edit-item-row');
            rows.forEach((row, index) => {
                const select = row.querySelector('.edit-item-select');
                const quantity = row.querySelector('.edit-item-quantity');
                const notes = row.querySelector('.edit-item-notes');
                
                if (select) select.name = `items[${index}].sku`;
                if (quantity) quantity.name = `items[${index}].quantity`;
                if (notes) notes.name = `items[${index}].notes`;
                
                // If there's only one row left, disable its remove button
                if (rows.length === 1 && index === 0) {
                    const removeBtn = row.querySelector('.edit-remove-item-btn');
                    if (removeBtn) removeBtn.disabled = true;
                }
            });
        },
        
        // Update shipment with edited data
        updateShipment: function(form) {
            log('Updating shipment');
            
            // Get form data
            const formData = new FormData(form);
            const shipmentId = formData.get('id');
            
            // Build shipment object
            const shipment = {
                id: shipmentId,
                type: formData.get('type'),
                partnerName: formData.get('partnerName'),
                status: formData.get('status'),
                priority: formData.get('priority'),
                eta: formData.get('eta'),
                notes: formData.get('notes'),
                items: []
            };
            
            // Add items
            const itemRows = form.querySelectorAll('.edit-item-row');
            itemRows.forEach((row, index) => {
                const sku = row.querySelector('.edit-item-select').value;
                const quantity = parseInt(row.querySelector('.edit-item-quantity').value);
                const notes = row.querySelector('.edit-item-notes')?.value;
                
                if (sku && quantity) {
                    shipment.items.push({
                        shipmentId: shipment.id,
                        sku: sku,
                        quantity: quantity,
                        notes: notes
                    });
                }
            });
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="ri-loader-2-line animate-spin mr-2"></i> Saving...';
            
            // Ensure id is clean for API use
            const cleanId = encodeURIComponent(shipmentId.trim());
            
            // Submit to API
            fetch(`/api/Home/Shipments/${cleanId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shipment)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then(text => {
                        throw new Error(text || `Error updating shipment (${response.status})`);
                    });
                }
            })
            .then(result => {
                log('Shipment updated successfully:', result);
                
                // Show success notification
                this.showNotification(`Shipment ${shipmentId} updated successfully`, 'success');
                
                // Close modal
                document.getElementById('editShipmentModal').classList.add('hidden');
                
                // Reload shipments
                this.loadShipments();
                
                // Update dashboard stats
                this.updateDashboardStats();
                
                // Reload recent activities
                this.loadRecentActivity();
            })
            .catch(error => {
                console.error('Error updating shipment:', error);
                this.showNotification(`Failed to update shipment: ${error.message}`, 'error');
            })
            .finally(() => {
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
        },
        
        // Edit shipment
        editShipment: function(id) {
            log(`Editing shipment ${id}`);
            
            // Ensure id is clean for API use
            const cleanId = encodeURIComponent(id.trim());
            
            fetch(`/api/Home/Shipments/${cleanId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load shipment: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(shipment => {
                    log('Shipment details for editing:', shipment);
                    this.displayEditShipmentModal(shipment);
                })
                .catch(error => {
                    console.error(`Error loading shipment ${id} for editing:`, error);
                    this.showNotification(`Failed to load shipment details for editing: ${error.message}`, 'error');
                });
        },
        
        // Delete shipment
        deleteShipment: function(id) {
            log(`Deleting shipment ${id}`);
            
            if (confirm(`Are you sure you want to delete shipment ${id}?`)) {
                // Ensure id is clean for API use
                const cleanId = encodeURIComponent(id.trim());
                
                fetch(`/api/Home/Shipments/${cleanId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.ok) {
                        log(`Shipment ${id} deleted successfully`);
                        // Show success notification
                        this.showNotification(`Shipment ${id} deleted successfully`, 'success');
                        // Reload shipments to update the list
                        this.loadShipments();
                        // Update dashboard stats
                        this.updateDashboardStats();
                        // Reload recent activities
                        this.loadRecentActivity();
                    } else {
                        throw new Error(`Failed to delete shipment: ${response.status} ${response.statusText}`);
                    }
                })
                .catch(error => {
                    console.error(`Error deleting shipment ${id}:`, error);
                    this.showNotification(`Failed to delete shipment: ${error.message}`, 'error');
                });
            }
        },
        
        // Show a notification message
        showNotification: function(message, type = 'info', duration = 5000) {
            log(`Showing ${type} notification: ${message}`);
            
            const notificationContainer = document.getElementById('notificationContainer');
            if (!notificationContainer) return;
            
            const notification = document.createElement('div');
            notification.className = 'notification transform transition-all duration-300 translate-x-full opacity-0 max-w-md';
            
            // Set color scheme based on type
            let bgColor, textColor, icon;
            switch (type) {
                case 'success':
                    bgColor = 'bg-green-50 border-green-500';
                    textColor = 'text-green-800';
                    icon = 'ri-checkbox-circle-line text-green-500';
                    break;
                case 'error':
                    bgColor = 'bg-red-50 border-red-500';
                    textColor = 'text-red-800';
                    icon = 'ri-error-warning-line text-red-500';
                    break;
                case 'warning':
                    bgColor = 'bg-yellow-50 border-yellow-500';
                    textColor = 'text-yellow-800';
                    icon = 'ri-alert-line text-yellow-500';
                    break;
                default: // info
                    bgColor = 'bg-blue-50 border-blue-500';
                    textColor = 'text-blue-800';
                    icon = 'ri-information-line text-blue-500';
            }
            
            notification.innerHTML = `
                <div class="flex items-start p-4 ${bgColor} border-l-4 rounded-lg shadow-md">
                    <div class="flex-shrink-0 mr-3">
                        <i class="${icon} text-xl"></i>
                    </div>
                    <div class="flex-1 ${textColor}">${message}</div>
                    <button class="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            `;
            
            notificationContainer.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.classList.remove('translate-x-full', 'opacity-0');
            }, 10);
            
            // Auto remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    notification.classList.add('translate-x-full', 'opacity-0');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, duration);
            }
            
            return notification;
        },
        
        // Submit the shipment form
        submitShipmentForm: function() {
            log('Submitting shipment form');
            
            const form = document.getElementById('newShipmentForm');
            if (!form) {
                log('ERROR: Form not found with ID "newShipmentForm"');
                return;
            }
            
            // Check if form is valid
            if (!form.checkValidity()) {
                form.reportValidity();
                log('Form validation failed');
                this.showNotification('Please fill out all required fields correctly.', 'error');
                return;
            }
            
            // Show loading indicator
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="ri-loader-2-line animate-spin mr-2"></i> Creating...';
            
            try {
                // Manually extract each field to ensure proper format
                const shipmentId = document.getElementById('shipmentIdInput')?.value;
                const type = form.querySelector('select[name="type"]')?.value;
                const partnerName = form.querySelector('input[name="partnerName"]')?.value;
                const status = form.querySelector('select[name="status"]')?.value;
                const priority = form.querySelector('select[name="priority"]')?.value;
                const eta = form.querySelector('input[name="eta"]')?.value;
                const notes = form.querySelector('textarea[name="notes"]')?.value || '';
                
                // Log the collected form values
                log('Collected form values:');
                log(`  ID: ${shipmentId}`);
                log(`  Type: ${type}`);
                log(`  Partner: ${partnerName}`);
                log(`  Status: ${status}`);
                log(`  Priority: ${priority}`);
                log(`  ETA: ${eta}`);
                
                // Collect items
                const items = [];
                const itemRows = form.querySelectorAll('.item-row');
                itemRows.forEach((row, index) => {
                    const sku = row.querySelector('.item-select')?.value;
                    const quantity = parseInt(row.querySelector('.item-quantity')?.value);
                    const itemNotes = row.querySelector('.item-notes')?.value || '';
                    
                    if (sku && !isNaN(quantity) && quantity > 0) {
                        items.push({
                            ShipmentId: shipmentId, // Note the capital S in ShipmentId
                            Sku: sku,               // Capital S in Sku
                            Quantity: quantity,     // Capital Q
                            Notes: itemNotes        // Capital N
                        });
                    }
                });
                
                log(`Collected ${items.length} items`);
                
                // Construct a simple request object with explicit property names
                const requestBody = {
                    Shipment: {
                        Id: shipmentId,
                        Type: type,
                        PartnerName: partnerName,
                        Status: status,
                        Priority: priority,
                        ETA: eta, // Format as is from the datetime-local input
                        Notes: notes,
                        Items: items
                    }
                };
                
                // Log the request
                log('Sending request with data:');
                log(JSON.stringify(requestBody, null, 2));
                
                // Submit request
                fetch('/api/Home/Shipments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                .then(response => {
                    log(`Response status: ${response.status} ${response.statusText}`);
                    
                    if (!response.ok) {
                        return response.text().then(text => {
                            log('Error response:', text);
                            throw new Error(text || `Server returned ${response.status}`);
                        });
                    }
                    
                    return response.json();
                })
                .then(data => {
                    log('Success! Created shipment:', data);
                    
                    // Show success message
                    this.showNotification(`Shipment #${data.id || shipmentId} created successfully!`, 'success');
                    
                    // Reset form
                    form.reset();
                    
                    // Close modal
                    const modal = document.getElementById('shipmentModal');
                    if (modal) modal.classList.add('hidden');
                    
                    // Reload data
                    this.loadShipments();
                    this.loadRecentActivity();
                })
                .catch(error => {
                    log('Error creating shipment:', error);
                    this.showNotification(`Failed to create shipment: ${error.message}`, 'error');
                })
                .finally(() => {
                    // Reset button state
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                });
            } catch (err) {
                // Handle any unexpected errors
                log('Unexpected error in form submission:', err);
                this.showNotification(`An unexpected error occurred: ${err.message}`, 'error');
                
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        },
        
        // Add a new item row to the shipment form
        addItemRow: function() {
            log('Adding new item row');
            
            const itemContainer = document.getElementById('itemContainer');
            if (!itemContainer) {
                log('Item container not found');
                return;
            }
            
            // Get the current number of items
            const itemCount = itemContainer.querySelectorAll('.item-row').length;
            
            // Create a new row
            const newRow = document.createElement('div');
            newRow.className = 'item-row bg-gray-50 p-3 rounded-md border border-gray-200';
            
            newRow.innerHTML = `
                <div class="grid grid-cols-12 gap-3">
                    <div class="col-span-6">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Item <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <select name="items[${itemCount}].sku" class="item-select border border-gray-300 rounded-md w-full py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" required>
                                <option value="">Select an item</option>
                                <!-- Items will be loaded dynamically -->
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <i class="ri-arrow-down-s-line"></i>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Quantity <span class="text-red-500">*</span>
                        </label>
                        <input type="number" name="items[${itemCount}].quantity" class="item-quantity border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" min="1" value="1" required>
                    </div>
                    <div class="col-span-3">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <input type="text" name="items[${itemCount}].notes" class="item-notes border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="Optional notes">
                    </div>
                    <div class="col-span-1 flex items-end">
                        <button type="button" class="remove-item-btn h-10 w-10 flex items-center justify-center bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Add the new row to the container
            itemContainer.appendChild(newRow);
            
            // Enable remove button for all but the first row
            const removeButtons = itemContainer.querySelectorAll('.remove-item-btn');
            removeButtons.forEach((btn, index) => {
                if (index === 0 && removeButtons.length === 1) {
                    btn.disabled = true;
                    btn.classList.add('disabled:opacity-50', 'disabled:cursor-not-allowed');
                } else {
                    btn.disabled = false;
                    btn.addEventListener('click', (e) => {
                        this.removeItemRow(e.currentTarget.closest('.item-row'));
                    });
                }
            });
            
            // Populate the new select with items
            const newSelect = newRow.querySelector('.item-select');
            if (newSelect) {
                // Get current shipment type
                const shipmentTypeSelect = document.querySelector('select[name="type"]');
                const currentShipmentType = shipmentTypeSelect ? shipmentTypeSelect.value : 'Inbound';
                
                // Add items from the cached list
                if (availableItems.length > 0) {
                    // Filter based on shipment type
                    let itemsToShow = availableItems;
                    
                    // For Inbound shipments, only show items with "In Shipment" location
                    if (currentShipmentType === 'Inbound') {
                        itemsToShow = availableItems.filter(item => {
                            const location = item.location || item.Location || '';
                            return location.toLowerCase() === 'in shipment';
                        });
                        log(`Filtered to ${itemsToShow.length} items with "In Shipment" location for new row`);
                    }
                    // For Outbound shipments, only show items that are in one of the zones
                    else if (currentShipmentType === 'Outbound') {
                        itemsToShow = availableItems.filter(item => {
                            const location = item.location || item.Location || '';
                            // Check if location starts with "Zone"
                            return location.startsWith('Zone');
                        });
                        log(`Filtered to ${itemsToShow.length} items in zones for new row (outbound shipment)`);
                    }
                    
                    itemsToShow.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.sku || item.SKU; // Handle different casing
                        option.textContent = `${item.sku || item.SKU} - ${item.name || item.Name} (${item.quantity || item.Quantity} in stock)`;
                        option.dataset.quantity = item.quantity || item.Quantity; // Store quantity in dataset
                        newSelect.appendChild(option);
                    });
                    
                    // Add change event listener for auto-filling quantity
                    newSelect.addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        if (selectedOption && selectedOption.dataset.quantity) {
                            // Find the quantity input in the same row
                            const quantityInput = this.closest('.item-row').querySelector('.item-quantity');
                            if (quantityInput) {
                                log(`Auto-filling quantity: ${selectedOption.dataset.quantity}`);
                                quantityInput.value = selectedOption.dataset.quantity;
                            }
                        }
                    });
                } else {
                    // If the cache is empty, load items
                    this.loadAvailableItems();
                }
            }
        },
        
        // Remove an item row from the shipment form
        removeItemRow: function(row) {
            log('Removing item row');
            
            if (!row) {
                log('Row not provided');
                return;
            }
            
            const itemContainer = document.getElementById('itemContainer');
            if (!itemContainer) {
                log('Item container not found');
                return;
            }
            
            // Remove the row
            row.remove();
            
            // Update the remaining rows to have sequential indices
            const rows = itemContainer.querySelectorAll('.item-row');
            rows.forEach((row, index) => {
                const select = row.querySelector('.item-select');
                const quantity = row.querySelector('.item-quantity');
                const notes = row.querySelector('.item-notes');
                
                if (select) select.name = `items[${index}].sku`;
                if (quantity) quantity.name = `items[${index}].quantity`;
                if (notes) notes.name = `items[${index}].notes`;
                
                // If there's only one row left, disable its remove button
                if (rows.length === 1 && index === 0) {
                    const removeBtn = row.querySelector('.remove-item-btn');
                    if (removeBtn) removeBtn.disabled = true;
                }
            });
        },
        
        // Utility functions
        
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

        // Load recent activity logs
        loadRecentActivity: function() {
            log('Loading recent activity logs');
            
            const activityContainer = document.getElementById('recentActivities');
            if (!activityContainer) {
                log('Activity container not found');
                return;
            }
            
            // Show loading state
            activityContainer.innerHTML = `
                <div class="text-center text-gray-500">
                    <i class="ri-loader-2-line animate-spin text-xl mr-2"></i> Loading activities...
                </div>
            `;
            
            // Fetch recent activities - use the appropriate API endpoint with a limit parameter
            // Set a larger limit as we'll filter client-side by relevant keywords
            fetch('/api/ActivityLogs?count=30')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(activities => {
                    // Filter for Shipment or Item activities by looking at description or itemSKU
                    const relevantActivities = activities.filter(activity => 
                        (activity.description && (
                            activity.description.toLowerCase().includes('ship') ||
                            activity.description.toLowerCase().includes('item')
                        )) ||
                        (activity.itemSKU && activity.itemSKU.toLowerCase().includes('ship'))
                    );
                    
                    log(`Loaded ${activities.length} activities, ${relevantActivities.length} relevant to shipments/items`);
                    
                    // Clear the container
                    activityContainer.innerHTML = '';
                    
                    // If no activities, show empty state
                    if (!relevantActivities || relevantActivities.length === 0) {
                        activityContainer.innerHTML = `
                            <div class="text-center text-gray-500">
                                <p>No recent activities found</p>
                            </div>
                        `;
                        return;
                    }
                    
                    // Render each activity, limiting to the most recent 8 events
                    relevantActivities.slice(0, 8).forEach(activity => {
                        const activityElement = document.createElement('div');
                        activityElement.className = 'flex items-start gap-4 pb-4 mb-4 border-b border-gray-100';
                        
                        // Determine icon and color based on action type
                        let iconClass = 'ri-information-line';
                        let bgColorClass = 'bg-blue-100'; 
                        let textColorClass = 'text-blue-600';
                        
                        // Set icon and colors based on action type
                        switch (activity.actionType?.toLowerCase()) {
                            case 'add':
                            case 'create':
                                iconClass = 'ri-add-line';
                                bgColorClass = 'bg-green-100';
                                textColorClass = 'text-green-600';
                                break;
                            case 'update':
                            case 'edit':
                                iconClass = 'ri-edit-line';
                                bgColorClass = 'bg-orange-100';
                                textColorClass = 'text-orange-600';
                                break;
                            case 'delete':
                            case 'remove':
                                iconClass = 'ri-delete-bin-line';
                                bgColorClass = 'bg-red-100';
                                textColorClass = 'text-red-600';
                                break;
                            case 'move':
                                iconClass = 'ri-arrow-left-right-line';
                                bgColorClass = 'bg-purple-100';
                                textColorClass = 'text-purple-600';
                                break;
                        }
                        
                        // Format relative time (e.g., "5 minutes ago")
                        const timestamp = new Date(activity.timestamp);
                        const timeAgo = this.getRelativeTime(timestamp);
                        
                        // Extract username and handle empty values
                        const username = activity.userName || activity.userId || 'System';
                        
                        activityElement.innerHTML = `
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center ${bgColorClass} ${textColorClass}">
                                    <i class="${iconClass}"></i>
                                </div>
                            </div>
                            <div class="flex-1">
                                <p class="font-medium">${activity.description}</p>
                                <p class="text-sm text-gray-500">${timeAgo} · ${activity.itemSKU || 'System'} · By ${username}</p>
                            </div>
                        `;
                        
                        activityContainer.appendChild(activityElement);
                    });
                    
                    // Remove the "View all" link - no longer needed
                    
                    // Set up a timer to refresh activities periodically (every 30 seconds)
                    setTimeout(() => {
                        this.loadRecentActivity();
                    }, 30000);
                })
                .catch(error => {
                    console.error('Error loading recent activities:', error);
                    activityContainer.innerHTML = `
                        <div class="text-center text-red-500">
                            <p>Failed to load recent activities</p>
                            <button class="px-4 py-2 mt-2 bg-red-100 text-red-700 rounded" onclick="homeShipmentsManager.loadRecentActivity()">
                                Try Again
                            </button>
                        </div>
                    `;
                });
        },
        
        // Format relative time (e.g., "5 minutes ago")
        getRelativeTime: function(date) {
            if (!date) return 'Unknown time';
            
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (diffInSeconds < 60) {
                return 'Just now';
            }
            
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) {
                return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
            }
            
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
            }
            
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 30) {
                return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
            }
            
            const diffInMonths = Math.floor(diffInDays / 30);
            if (diffInMonths < 12) {
                return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
            }
            
            const diffInYears = Math.floor(diffInMonths / 12);
            return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
        },

        // Setup activity events
        setupActivityEvents: function() {
            log('Setting up activity events');
            
            // Setup View All activities button
            const viewAllActivitiesBtn = document.querySelector('[data-modal="allActivitiesModal"]');
            if (viewAllActivitiesBtn) {
                log('View All Activities button found, attaching click event');
                
                viewAllActivitiesBtn.addEventListener('click', () => {
                    log('View All Activities button clicked');
                    
                    // Show the modal
                    if (typeof window.modalService !== 'undefined') {
                        window.modalService.showModal('allActivitiesModal');
                    } else {
                        // Fallback to direct manipulation
                        const modal = document.getElementById('allActivitiesModal');
                        if (modal) {
                            modal.classList.add('active');
                            modal.classList.remove('hidden');
                        }
                    }
                    
                    // Load activity data if needed
                    if (typeof inventoryManager !== 'undefined' && 
                        typeof inventoryManager.loadAllActivities === 'function') {
                        // Use inventory manager's loadAllActivities function
                        inventoryManager.loadAllActivities();
                    } else {
                        // Fallback to loading basic activity data
                        this.loadAllActivities();
                    }
                });
            } else {
                console.error('View All Activities button not found');
            }
            
            // Setup other activity related elements if needed
            const activityTypeFilter = document.getElementById('activityTypeFilter');
            if (activityTypeFilter) {
                activityTypeFilter.addEventListener('change', () => {
                    if (typeof inventoryManager !== 'undefined' && 
                        typeof inventoryManager.loadAllActivities === 'function') {
                        inventoryManager.loadAllActivities();
                    } else {
                        this.loadAllActivities();
                    }
                });
            }
            
            // Setup activity refresh button
            const activityRefreshBtn = document.getElementById('activityRefreshBtn');
            if (activityRefreshBtn) {
                activityRefreshBtn.addEventListener('click', () => {
                    if (typeof inventoryManager !== 'undefined' && 
                        typeof inventoryManager.loadAllActivities === 'function') {
                        inventoryManager.loadAllActivities();
                    } else {
                        this.loadAllActivities();
                    }
                });
            }
            
            // Setup Load More button to load ALL activities
            const loadMoreActivitiesBtn = document.getElementById('loadMoreActivitiesBtn');
            if (loadMoreActivitiesBtn) {
                loadMoreActivitiesBtn.addEventListener('click', () => {
                    // Change button text to show loading
                    loadMoreActivitiesBtn.innerHTML = '<i class="ri-loader-2-line animate-spin mr-1"></i> Loading...';
                    loadMoreActivitiesBtn.disabled = true;
                    
                    // Load all activities without pagination
                    fetch('/api/ActivityLogs?count=500')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(activities => {
                            log(`Loaded all ${activities.length} activities`);
                            
                            const tableBody = document.getElementById('allActivitiesTableBody');
                            if (!tableBody) {
                                console.error('Activities table body not found');
                                return;
                            }
                            
                            // Clear the existing entries
                            tableBody.innerHTML = '';
                            
                            // Render ALL activities
                            activities.forEach(activity => {
                                const row = document.createElement('tr');
                                row.className = 'hover:bg-gray-50';
                                
                                // Format timestamp
                                const timestamp = activity.timestamp ? this.getRelativeTime(new Date(activity.timestamp)) : "Unknown";
                                
                                // Determine color classes for the activity type
                                let typeClass = "bg-gray-100 text-gray-800";
                                switch (activity.actionType?.toLowerCase()) {
                                    case "add":
                                    case "create":
                                        typeClass = "bg-blue-100 text-blue-800";
                                        break;
                                    case "remove":
                                    case "delete":
                                        typeClass = "bg-red-100 text-red-800";
                                        break;
                                    case "update":
                                    case "edit":
                                        typeClass = "bg-yellow-100 text-yellow-800";
                                        break;
                                    case "move":
                                        typeClass = "bg-green-100 text-green-800";
                                        break;
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
                                            `<span class="text-sm font-mono text-blue-600">
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
                            
                            // Hide the Load More button since we've loaded everything
                            loadMoreActivitiesBtn.style.display = 'none';
                            
                            // Add a message showing the total count
                            const countMessage = document.createElement('p');
                            countMessage.className = 'text-center text-sm text-gray-500 mt-2';
                            countMessage.textContent = `Showing all ${activities.length} activities`;
                            loadMoreActivitiesBtn.parentElement.appendChild(countMessage);
                        })
                        .catch(error => {
                            console.error('Error loading all activities:', error);
                            loadMoreActivitiesBtn.innerHTML = 'Load More';
                            loadMoreActivitiesBtn.disabled = false;
                            
                            // Show error message
                            const errorMessage = document.createElement('p');
                            errorMessage.className = 'text-center text-sm text-red-500 mt-2';
                            errorMessage.textContent = `Error: ${error.message}`;
                            loadMoreActivitiesBtn.parentElement.appendChild(errorMessage);
                        });
                });
            }
        },
        
        // Fallback implementation for loadAllActivities in case inventoryManager is not available
        loadAllActivities: function() {
            log('Loading all activities (fallback implementation)');
            
            const tableBody = document.getElementById('allActivitiesTableBody');
            if (!tableBody) {
                console.error('Activities table body not found');
                return;
            }
            
            // Show loading state
            tableBody.innerHTML = `
                <tr class="animate-pulse">
                    <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        Loading activities...
                    </td>
                </tr>
            `;
            
            // Get the current type filter value
            const typeFilterElement = document.getElementById('activityTypeFilter');
            const typeFilter = typeFilterElement ? typeFilterElement.value : '';
            
            // Build the API URL with appropriate parameters
            let apiUrl = '/api/ActivityLogs?count=100';
            
            // If type filter is set, use the type-specific endpoint
            if (typeFilter) {
                apiUrl = `/api/ActivityLogs/type/${typeFilter}?count=100`;
                log(`Filtering activities by type: ${typeFilter}`);
            }
            
            // Fetch activities from API with filtering applied
            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(activities => {
                    log(`Loaded ${activities.length} activities in fallback implementation`);
                    
                    // Clear the container
                    tableBody.innerHTML = '';
                    
                    // If no activities, show empty state
                    if (!activities || activities.length === 0) {
                        tableBody.innerHTML = `
                            <tr>
                                <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    No activities found
                                </td>
                            </tr>
                        `;
                        return;
                    }
                    
                    // Add activity count indicator
                    const countMessage = document.createElement('p');
                    countMessage.className = 'text-center text-sm text-gray-500 mt-2';
                    countMessage.textContent = `Showing ${activities.length} activities${typeFilter ? ` of type "${typeFilter}"` : ''}`;
                    const tableContainer = tableBody.closest('.overflow-auto');
                    if (tableContainer && tableContainer.nextElementSibling) {
                        // Remove existing message if present
                        const existingMessage = tableContainer.nextElementSibling.querySelector('.text-center.text-sm.text-gray-500.mt-2');
                        if (existingMessage) {
                            existingMessage.remove();
                        }
                        tableContainer.nextElementSibling.prepend(countMessage);
                    }
                    
                    // Render activities
                    activities.forEach(activity => {
                        const row = document.createElement('tr');
                        row.className = 'hover:bg-gray-50';
                        
                        // Format timestamp
                        const timestamp = activity.timestamp ? this.getRelativeTime(new Date(activity.timestamp)) : "Unknown";
                        
                        // Determine color classes for the activity type
                        let typeClass = "bg-gray-100 text-gray-800";
                        switch (activity.actionType?.toLowerCase()) {
                            case "add":
                            case "create":
                                typeClass = "bg-blue-100 text-blue-800";
                                break;
                            case "remove":
                            case "delete":
                                typeClass = "bg-red-100 text-red-800";
                                break;
                            case "update":
                            case "edit":
                                typeClass = "bg-yellow-100 text-yellow-800";
                                break;
                            case "move":
                                typeClass = "bg-green-100 text-green-800";
                                break;
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
                                    `<span class="text-sm font-mono text-blue-600">
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
                })
                .catch(error => {
                    console.error('Error loading all activities:', error);
                    loadMoreActivitiesBtn.innerHTML = 'Load More';
                    loadMoreActivitiesBtn.disabled = false;
                    
                    // Show error message
                    const errorMessage = document.createElement('p');
                    errorMessage.className = 'text-center text-sm text-red-500 mt-2';
                    errorMessage.textContent = `Error: ${error.message}`;
                    loadMoreActivitiesBtn.parentElement.appendChild(errorMessage);
                });
        }
    };
})();

// Add this code at the end of the file to ensure the manager is initialized when the page loads
document.addEventListener("DOMContentLoaded", function() {
    console.log("[INFO] DOM fully loaded - initializing Home Shipments Manager");
    try {
        homeShipmentsManager.init();
    } catch (err) {
        console.error("[ERROR] Failed to initialize Home Shipments Manager:", err);
    }
});

// Add debugging helper to check if the script is properly referenced
console.log("[DEBUG] home-shipments.js fully loaded");

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}