/**
 * API Service implementation of IApiService interface
 * @implements {IApiService}
 */
const api = (function() {
    // Create a private API_BASE_URL that won't conflict with other scripts
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Debugging helper - log all API calls to console
    const logApiCall = (method, endpoint, data = null) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`[${timestamp}] API ${method} ${endpoint}${data ? ' with data:' : ''}`);
        
        // Enhanced logging for item creation
        if (endpoint === '/Items' && method === 'POST') {
            if (data && data.sku === 'AUTO-GENERATE') {
                console.log('Creating item with AUTO-GENERATE SKU flag', data);
            } else if (data && !data.sku) {
                console.log('Creating item with empty SKU (will fail validation)', data);
            } else if (data) {
                console.log('Creating item with provided SKU:', data.sku, data);
            }
        } else if (data) {
            console.log(data);
        }
    };
    
    return {
    // Items API
        getItems: async function() {
            logApiCall('GET', '/Items');
        const response = await fetch(`${API_BASE_URL}/Items`);
            if (!response.ok) throw new Error(`Failed to fetch items: ${response.statusText}`);
        return await response.json();
        },

        getItem: async function(sku) {
            logApiCall('GET', `/Items/${sku}`);
        const response = await fetch(`${API_BASE_URL}/Items/${sku}`);
            if (!response.ok) throw new Error(`Failed to fetch item: ${response.statusText}`);
        return await response.json();
        },

        createItem: async function(item) {
            logApiCall('POST', '/Items', item);
        const response = await fetch(`${API_BASE_URL}/Items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
        });
            
            // If response is not ok, parse the error message
            if (!response.ok) {
                let errorMessage = `HTTP error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.title || errorMessage;
                } catch (e) {
                    // Fall back to response text if JSON parsing fails
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
        return await response.json();
        },
        
        updateItem: async function(item) {
            // Extract SKU from the item object
            const sku = item.sku;
            if (!sku) {
                throw new Error('SKU is required for updating an item');
            }
            
            logApiCall('PUT', `/Items/${sku}`, item);
        const response = await fetch(`${API_BASE_URL}/Items/${sku}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
        });
            
            if (!response.ok) {
                let errorMessage = `HTTP error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.title || errorMessage;
                } catch (e) {
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            // Try to parse JSON response if available
            try {
                return await response.json();
            } catch {
                // If no JSON response, just return the response
        return response;
    }
        },

        deleteItem: async function(sku) {
            logApiCall('DELETE', `/Items/${sku}`);
        const response = await fetch(`${API_BASE_URL}/Items/${sku}`, {
            method: 'DELETE'
        });
            
            if (!response.ok) {
                let errorMessage = `HTTP error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.title || errorMessage;
                } catch (e) {
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            return response;
        },

    // Shipments API
        getShipments: async function() {
            logApiCall('GET', '/Shipments');
        const response = await fetch(`${API_BASE_URL}/Shipments`);
            if (!response.ok) throw new Error(`Failed to fetch shipments: ${response.statusText}`);
        return await response.json();
        },

        getShipmentsByType: async function(type) {
            logApiCall('GET', `/Shipments/type/${type}`);
        const response = await fetch(`${API_BASE_URL}/Shipments/type/${type}`);
            if (!response.ok) throw new Error(`Failed to fetch shipments: ${response.statusText}`);
        return await response.json();
        },

        createShipment: async function(shipment) {
            logApiCall('POST', '/Shipments', shipment);
        const response = await fetch(`${API_BASE_URL}/Shipments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shipment)
        });
            
            if (!response.ok) {
                let errorMessage = `HTTP error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.title || errorMessage;
                } catch (e) {
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();
        },
        
        updateShipment: async function(id, shipment) {
            logApiCall('PUT', `/Shipments/${id}`, shipment);
        const response = await fetch(`${API_BASE_URL}/Shipments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shipment)
        });
            
            if (!response.ok) {
                let errorMessage = `HTTP error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.title || errorMessage;
                } catch (e) {
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            return response;
        },
        
        deleteShipment: async function(id) {
            logApiCall('DELETE', `/Shipments/${id}`);
        const response = await fetch(`${API_BASE_URL}/Shipments/${id}`, {
            method: 'DELETE'
        });
            
            if (!response.ok) {
                let errorMessage = `HTTP error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.title || errorMessage;
                } catch (e) {
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
        return response;
        },

        // ActivityLogs API
        getActivityLogs: async function() {
            logApiCall('GET', '/ActivityLogs');
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Failed to fetch activity logs:', errorText);
                    throw new Error('Failed to fetch activity logs');
                }
                return await response.json();
            } catch (error) {
                console.error('Error in getActivityLogs:', error);
                throw error;
            }
        },
        
        getRecentActivities: async function(count = 5) {
            logApiCall('GET', `/ActivityLogs/recent?count=${count}`);
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs/recent?count=${count}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Failed to fetch recent activities:', errorText);
                    throw new Error('Failed to fetch recent activities');
                }
                const data = await response.json();
                console.log(`Retrieved ${data.length} recent activities`);
                return data;
            } catch (error) {
                console.error('Error in getRecentActivities:', error);
                throw error;
            }
        },
        
        getActivitiesByType: async function(type, count = 10) {
            logApiCall('GET', `/ActivityLogs/type/${type}?count=${count}`);
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs/type/${type}?count=${count}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to fetch activities for type ${type}:`, errorText);
                    throw new Error(`Failed to fetch activities for type: ${type}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error in getActivitiesByType:', error);
                throw error;
            }
        },
        
        getActivitiesByItem: async function(sku, count = 10) {
            logApiCall('GET', `/ActivityLogs/item/${sku}?count=${count}`);
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs/item/${sku}?count=${count}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to fetch activities for item ${sku}:`, errorText);
                    throw new Error(`Failed to fetch activities for item: ${sku}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error in getActivitiesByItem:', error);
                throw error;
            }
        },
        
        getActivitiesByUser: async function(userId, count = 10) {
            logApiCall('GET', `/ActivityLogs/user/${userId}?count=${count}`);
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs/user/${userId}?count=${count}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to fetch activities for user ${userId}:`, errorText);
                    throw new Error(`Failed to fetch activities for user: ${userId}`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error in getActivitiesByUser:', error);
                throw error;
            }
        },
        
        getStockMovementData: async function() {
            logApiCall('GET', '/ActivityLogs/stockmovement');
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs/stockmovement`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Failed to fetch stock movement data:', errorText);
                    throw new Error('Failed to fetch stock movement data');
                }
                return await response.json();
            } catch (error) {
                console.error('Error in getStockMovementData:', error);
                throw error;
            }
        },
        
        createActivityLog: async function(log) {
            logApiCall('POST', '/ActivityLogs', log);
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(log)
                });
                
                if (!response.ok) {
                    let errorMessage = `HTTP error ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.detail || errorData.title || errorMessage;
                    } catch (e) {
                        errorMessage = await response.text() || errorMessage;
                    }
                    console.error('Failed to create activity log:', errorMessage);
                    throw new Error(errorMessage);
                }
                
                const result = await response.json();
                console.log('Activity log created:', result);
                return result;
            } catch (error) {
                console.error('Error in createActivityLog:', error);
                throw error;
            }
        },
        
        seedActivityLogs: async function() {
            logApiCall('POST', '/ActivityLogs/seed');
            try {
                const response = await fetch(`${API_BASE_URL}/ActivityLogs/seed`, {
                    method: 'POST'
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Failed to seed activity logs:', errorText);
                    throw new Error('Failed to seed activity logs');
                }
                console.log('Activity logs seeded successfully');
                return await response.text();
            } catch (error) {
                console.error('Error in seedActivityLogs:', error);
                throw error;
            }
        },

    // Stocktakes API
        getStocktakes: async function() {
            logApiCall('GET', '/Stocktakes');
        const response = await fetch(`${API_BASE_URL}/Stocktakes`);
        if (!response.ok) throw new Error('Failed to fetch stocktakes');
        return await response.json();
        },

        createStocktake: async function(stocktake) {
            logApiCall('POST', '/Stocktakes', stocktake);
        const response = await fetch(`${API_BASE_URL}/Stocktakes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(stocktake)
        });
        if (!response.ok) throw new Error('Failed to create stocktake');
        return await response.json();
        },

        completeStocktake: async function(id) {
            logApiCall('POST', `/Stocktakes/${id}/complete`);
        const response = await fetch(`${API_BASE_URL}/Stocktakes/${id}/complete`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to complete stocktake');
        return response;
        },

        deleteStocktake: async function(id) {
            logApiCall('DELETE', `/Stocktakes/${id}`);
        const response = await fetch(`${API_BASE_URL}/Stocktakes/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete stocktake');
        return response;
    }
    };
})(); 