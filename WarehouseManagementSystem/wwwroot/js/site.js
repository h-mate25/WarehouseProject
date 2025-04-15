// Common functionality for all pages
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    addTooltips();
    
    // Setup search functionality
    setupSearch();
    
    // Handle mobile menu
    setupMobileMenu();
});

// Tooltip functionality
function addTooltips() {
    const buttons = document.querySelectorAll('button[data-tooltip]');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute z-10 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg';
            tooltip.textContent = this.getAttribute('data-tooltip');
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = `${rect.top - 30}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            
            document.body.appendChild(tooltip);
            
            button.addEventListener('mouseleave', function() {
                tooltip.remove();
            });
        });
    });
}

// Search functionality
function setupSearch() {
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"]');
    searchInputs.forEach(input => {
        let debounceTimer;
        input.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const searchTerm = this.value.toLowerCase();
                const table = this.closest('.bg-white').querySelector('table');
                if (!table) return;
                
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            }, 300);
        });
    });
}

// Mobile menu functionality
function setupMobileMenu() {
    const menuButton = document.querySelector('[data-mobile-menu-button]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// Modal functionality
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Loading state functionality
function showLoading(element) {
    if (element) {
        element.disabled = true;
        const originalText = element.textContent;
        element.setAttribute('data-original-text', originalText);
        element.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i>Loading...';
    }
}

function hideLoading(element) {
    if (element) {
        element.disabled = false;
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.textContent = originalText;
        }
    }
}

// API calls (use the module-based api object now)
// Remove the API_BASE_URL global declaration
// const API_BASE_URL = 'http://localhost:5136/api';

async function apiCall(endpoint, options = {}) {
    try {
        // Use the appropriate api method based on the request
        let response;
        const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        
        if (options.method === 'GET' || !options.method) {
            // For GET requests, use the corresponding api method if available
            if (path.startsWith('items/')) {
                const sku = path.substring('items/'.length);
                return await api.getItem(sku);
            } else if (path === 'items') {
                return await api.getItems();
            } else if (path.startsWith('shipments/')) {
                const id = path.substring('shipments/'.length);
                return await api.getShipment(id);
            } else if (path === 'shipments') {
                return await api.getShipments();
            } else {
                // Fallback to direct fetch for unknown endpoints
                response = await fetch(`http://localhost:5137/api/${path}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
            }
        } else if (options.method === 'POST') {
            const data = JSON.parse(options.body);
            if (path === 'items') {
                return await api.createItem(data);
            } else if (path === 'shipments') {
                return await api.createShipment(data);
            } else {
                // Fallback to direct fetch for unknown endpoints
                response = await fetch(`http://localhost:5137/api/${path}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
            }
        } else if (options.method === 'PUT') {
            const data = JSON.parse(options.body);
            if (path.startsWith('items/')) {
                const sku = path.substring('items/'.length);
                return await api.updateItem(sku, data);
            } else if (path.startsWith('shipments/')) {
                const id = path.substring('shipments/'.length);
                return await api.updateShipment(id, data);
            } else {
                // Fallback to direct fetch for unknown endpoints
                response = await fetch(`http://localhost:5137/api/${path}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
            }
        } else if (options.method === 'DELETE') {
            if (path.startsWith('items/')) {
                const sku = path.substring('items/'.length);
                return await api.deleteItem(sku);
            } else if (path.startsWith('shipments/')) {
                const id = path.substring('shipments/'.length);
                return await api.deleteShipment(id);
            } else {
                // Fallback to direct fetch for unknown endpoints
                response = await fetch(`http://localhost:5137/api/${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
            }
        }
        
        if (response && !response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response ? await response.json() : null;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Item management
async function createItem(itemData) {
    return apiCall('/items', {
        method: 'POST',
        body: JSON.stringify(itemData)
    });
}

async function updateItem(sku, itemData) {
    return apiCall(`/items/${sku}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
    });
}

async function deleteItem(sku) {
    return apiCall(`/items/${sku}`, {
        method: 'DELETE'
    });
}

async function getItem(sku) {
    return apiCall(`/items/${sku}`);
}

// Shipment management
async function createShipment(shipmentData) {
    return apiCall('/shipments', {
        method: 'POST',
        body: JSON.stringify(shipmentData)
    });
}

async function updateShipment(id, shipmentData) {
    return apiCall(`/shipments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(shipmentData)
    });
}

async function deleteShipment(id) {
    return apiCall(`/shipments/${id}`, {
        method: 'DELETE'
    });
}

async function getShipment(id) {
    return apiCall(`/shipments/${id}`);
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('border-red-500');
        } else {
            field.classList.remove('border-red-500');
        }
    });
    
    return isValid;
}

// Chart initialization helper
function initChart(elementId, options) {
    const chart = echarts.init(document.getElementById(elementId));
    chart.setOption(options);
    
    window.addEventListener('resize', function() {
        chart.resize();
    });
    
    return chart;
} 