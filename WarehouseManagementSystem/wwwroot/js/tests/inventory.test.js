// Tests for inventory.js functionality
describe('Inventory Manager Tests', () => {
    // Setup DOM elements needed for tests
    beforeEach(() => {
        // Create DOM elements that the inventory manager interacts with
        document.body.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div><h3 class="text-2xl font-bold mt-2">0</h3></div>
                <div><h3 class="text-2xl font-bold mt-2">0</h3></div>
                <div><h3 class="text-2xl font-bold mt-2">0</h3></div>
                <div><h3 class="text-2xl font-bold mt-2">$0</h3></div>
            </div>
            <div class="items-added-today">+0 today</div>
            <table>
                <tbody></tbody>
            </table>
            <div id="recentActivities"></div>
            <div id="stockMovementChart"></div>
            <div id="allActivitiesTableBody"></div>
        `;

        // Mock notificationService
        window.notificationService = {
            showNotification: jest.fn()
        };

        // Mock modalService
        window.modalService = {
            showModal: jest.fn(),
            hideModal: jest.fn()
        };

        // Mock API
        window.api = {
            getItems: jest.fn().mockResolvedValue([]),
            getItem: jest.fn(),
            createItem: jest.fn(),
            updateItem: jest.fn(),
            deleteItem: jest.fn(),
            getRecentActivities: jest.fn().mockResolvedValue([]),
            getActivityLogs: jest.fn().mockResolvedValue([]),
            getActivitiesByType: jest.fn(),
            createActivityLog: jest.fn()
        };

        // Mock ECharts
        window.echarts = {
            init: jest.fn().mockReturnValue({
                setOption: jest.fn(),
                resize: jest.fn()
            }),
            getInstanceByDom: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test Category Class Function
    describe('getCategoryClass', () => {
        test('should return correct CSS class for Electronics category', () => {
            expect(inventoryManager.getCategoryClass('Electronics')).toBe('bg-blue-100 text-blue-800');
        });

        test('should return correct CSS class for Furniture category', () => {
            expect(inventoryManager.getCategoryClass('Furniture')).toBe('bg-green-100 text-green-800');
        });

        test('should return correct CSS class for Office Supplies category', () => {
            expect(inventoryManager.getCategoryClass('Office Supplies')).toBe('bg-yellow-100 text-yellow-800');
        });

        test('should return correct CSS class for Accessories category', () => {
            expect(inventoryManager.getCategoryClass('Accessories')).toBe('bg-purple-100 text-purple-800');
        });

        test('should return default CSS class for unknown category', () => {
            expect(inventoryManager.getCategoryClass('Unknown')).toBe('bg-gray-100 text-gray-800');
        });
    });

    // Test Condition Class Function
    describe('getConditionClass', () => {
        test('should return correct CSS class for New condition', () => {
            expect(inventoryManager.getConditionClass('New')).toBe('bg-green-100 text-green-800');
        });

        test('should return correct CSS class for Good condition', () => {
            expect(inventoryManager.getConditionClass('Good')).toBe('bg-blue-100 text-blue-800');
        });

        test('should return correct CSS class for Fair condition', () => {
            expect(inventoryManager.getConditionClass('Fair')).toBe('bg-yellow-100 text-yellow-800');
        });

        test('should return correct CSS class for Poor condition', () => {
            expect(inventoryManager.getConditionClass('Poor')).toBe('bg-orange-100 text-orange-800');
        });

        test('should return correct CSS class for Damaged condition', () => {
            expect(inventoryManager.getConditionClass('Damaged')).toBe('bg-red-100 text-red-800');
        });

        test('should return default CSS class for unknown condition', () => {
            expect(inventoryManager.getConditionClass('Unknown')).toBe('bg-gray-100 text-gray-800');
        });
    });

    // Test formatDate utility function
    describe('formatDate', () => {
        test('should return "Just now" for a date less than a minute ago', () => {
            const date = new Date(Date.now() - 30 * 1000); // 30 seconds ago
            expect(formatDate(date)).toBe('Just now');
        });

        test('should return minutes ago for a date less than an hour ago', () => {
            const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
            expect(formatDate(date)).toBe('5 minutes ago');
        });

        test('should use singular form for 1 minute ago', () => {
            const date = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
            expect(formatDate(date)).toBe('1 minute ago');
        });

        test('should return hours ago for a date less than a day ago', () => {
            const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
            expect(formatDate(date)).toBe('3 hours ago');
        });

        test('should use singular form for 1 hour ago', () => {
            const date = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
            expect(formatDate(date)).toBe('1 hour ago');
        });

        test('should return days ago for a date less than a week ago', () => {
            const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
            expect(formatDate(date)).toBe('2 days ago');
        });

        test('should use singular form for 1 day ago', () => {
            const date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
            expect(formatDate(date)).toBe('1 day ago');
        });

        test('should return formatted date string for dates older than a week', () => {
            const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
            // Since exact format may vary by locale, just check it returns a string with date elements
            expect(typeof formatDate(date)).toBe('string');
            expect(formatDate(date)).toContain(date.getDate().toString());
        });

        test('should return empty string for null date', () => {
            expect(formatDate(null)).toBe('');
        });
    });

    // Test debounce utility function
    describe('debounce', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('should debounce function calls', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100);

            // Call the debounced function multiple times
            debouncedFn();
            debouncedFn();
            debouncedFn();

            // Fast-forward time
            jest.advanceTimersByTime(50);
            expect(mockFn).not.toHaveBeenCalled();

            // Fast-forward past the debounce time
            jest.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('should pass arguments to debounced function', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100);

            // Call with arguments
            debouncedFn('test', 123);
            
            // Fast-forward past the debounce time
            jest.advanceTimersByTime(150);
            
            // Check if the function was called with the right arguments
            expect(mockFn).toHaveBeenCalledWith('test', 123);
        });
    });

    // Test updateDashboardStats function
    describe('updateDashboardStats', () => {
        test('should update dashboard stats with correct values', () => {
            const mockItems = [
                { sku: 'SKU1', name: 'Item 1', category: 'Electronics', quantity: 10, location: 'A1', condition: 'New' },
                { sku: 'SKU2', name: 'Item 2', category: 'Furniture', quantity: 3, location: 'B2', condition: 'Good' },
                { sku: 'SKU3', name: 'Item 3', category: 'Electronics', quantity: 7, location: 'C3', condition: 'Fair' }
            ];

            inventoryManager.updateDashboardStats(mockItems);

            // Get the h3 elements that should be updated
            const h3Elements = document.querySelectorAll('h3.text-2xl.font-bold.mt-2');
            
            // Check if stats are correctly updated
            expect(h3Elements[0].textContent).toBe('3'); // Total items
            expect(h3Elements[1].textContent).toBe('1'); // Low stock items (quantity < 5)
            expect(h3Elements[2].textContent).toBe('2'); // Unique categories
            expect(h3Elements[3].textContent).toBe('$1,460'); // Total value ($73 per item * total quantity)
        });

        test('should handle empty items array', () => {
            // Call with empty array
            inventoryManager.updateDashboardStats([]);
            
            // Stats should not be updated
            const h3Elements = document.querySelectorAll('h3.text-2xl.font-bold.mt-2');
            expect(h3Elements[0].textContent).toBe('0');
        });

        test('should handle null items input', () => {
            // Call with null
            inventoryManager.updateDashboardStats(null);
            
            // Stats should not be updated
            const h3Elements = document.querySelectorAll('h3.text-2xl.font-bold.mt-2');
            expect(h3Elements[0].textContent).toBe('0');
        });
    });

    // Test renderItemsTable function
    describe('renderItemsTable', () => {
        test('should render items in table correctly', () => {
            const mockItems = [
                { sku: 'SKU1', name: 'Item 1', category: 'Electronics', quantity: 10, location: 'A1', condition: 'New' },
                { sku: 'SKU2', name: 'Item 2', category: 'Furniture', quantity: 3, location: 'B2', condition: 'Good' }
            ];

            inventoryManager.renderItemsTable(mockItems);

            // Check if table rows were created
            const tableRows = document.querySelectorAll('table tbody tr');
            expect(tableRows.length).toBe(2);
            
            // Check content of first row
            expect(tableRows[0].innerHTML).toContain('SKU1');
            expect(tableRows[0].innerHTML).toContain('Item 1');
            expect(tableRows[0].innerHTML).toContain('Electronics');
            expect(tableRows[0].innerHTML).toContain('10');
            expect(tableRows[0].innerHTML).toContain('A1');
            expect(tableRows[0].innerHTML).toContain('New');
            
            // Check if low stock item has the correct class
            const lowStockQuantity = tableRows[1].querySelector('td:nth-child(4) span');
            expect(lowStockQuantity.classList.contains('text-red-600')).toBe(true);
        });

        test('should handle empty items array', () => {
            const tableBody = document.querySelector('table tbody');
            tableBody.innerHTML = 'Initial content';
            
            inventoryManager.renderItemsTable([]);
            
            // Table body should remain unchanged
            expect(tableBody.innerHTML).toBe('Initial content');
        });
    });

    // Test createInventoryItem function
    describe('createInventoryItem', () => {
        test('should call API to create item and show notification on success', async () => {
            // Mock API response
            const createdItem = {
                sku: 'SKU123',
                name: 'Test Item',
                category: 'Electronics',
                quantity: 5,
                location: 'A1',
                condition: 'New',
                notes: 'Test notes'
            };
            
            api.createItem.mockResolvedValue(createdItem);
            api.createActivityLog.mockResolvedValue({});
            
            // Create a button element for testing
            document.body.innerHTML += `
                <button id="addItemBtn">Add Item</button>
                <div id="addItemModal" class="active"></div>
            `;
            
            // Call the function
            const result = await inventoryManager.createInventoryItem(createdItem);
            
            // Check if API was called with correct data
            expect(api.createItem).toHaveBeenCalledWith({
                sku: 'SKU123',
                name: 'Test Item',
                category: 'Electronics',
                quantity: 5,
                location: 'A1',
                condition: 'New',
                notes: 'Test notes'
            });
            
            // Check if notification was shown
            expect(notificationService.showNotification).toHaveBeenCalledWith(
                expect.stringContaining('Test Item added successfully'),
                'success'
            );
            
            // Check if modal was hidden
            expect(modalService.hideModal).toHaveBeenCalledWith('addItemModal');
            
            // Check if result is correct
            expect(result).toEqual(createdItem);
        });

        test('should show error notification when API call fails', async () => {
            // Mock API error
            const error = new Error('API failure');
            api.createItem.mockRejectedValue(error);
            
            // Create button element
            document.body.innerHTML += `
                <button id="addItemBtn">Add Item</button>
            `;
            
            // Call function and expect it to throw
            await expect(inventoryManager.createInventoryItem({
                name: 'Test Item',
                category: 'Electronics'
            })).rejects.toThrow();
            
            // Check if error notification was shown
            expect(notificationService.showNotification).toHaveBeenCalledWith(
                expect.stringContaining('Error: API failure'),
                'error'
            );
        });
    });

    // Test field validation helper
    describe('showFieldError', () => {
        test('should add error message and styling to field', () => {
            // Create test field
            const field = document.createElement('input');
            document.body.appendChild(field);
            
            // Call the function
            inventoryManager.showFieldError(field, 'Test error message');
            
            // Check if field has error class
            expect(field.classList.contains('border-red-500')).toBe(true);
            
            // Check if error message was added
            const errorMessage = field.parentElement.querySelector('.text-red-500');
            expect(errorMessage).not.toBeNull();
            expect(errorMessage.textContent).toBe('Test error message');
        });

        test('should handle null field gracefully', () => {
            // This should not throw an error
            expect(() => {
                inventoryManager.showFieldError(null, 'Test error message');
            }).not.toThrow();
        });
    });

    // Test updateRecentActivityInContainer function
    describe('updateRecentActivityInContainer', () => {
        test('should render activities correctly', () => {
            const container = document.getElementById('recentActivities');
            const activities = [
                {
                    actionType: 'Add',
                    description: 'Added item SKU123',
                    timestamp: new Date().toISOString(),
                    itemSKU: 'SKU123',
                    userName: 'TestUser'
                },
                {
                    actionType: 'Remove',
                    description: 'Removed item SKU456',
                    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                    itemSKU: 'SKU456'
                }
            ];
            
            inventoryManager.updateRecentActivityInContainer(container, activities);
            
            // Check if activities were rendered
            const activityElements = container.querySelectorAll('.flex.items-start.gap-4');
            expect(activityElements.length).toBe(2);
            
            // Check first activity
            expect(activityElements[0].innerHTML).toContain('Added item SKU123');
            expect(activityElements[0].innerHTML).toContain('SKU: SKU123');
            expect(activityElements[0].innerHTML).toContain('By: TestUser');
            
            // Check second activity
            expect(activityElements[1].innerHTML).toContain('Removed item SKU456');
            expect(activityElements[1].innerHTML).toContain('1 hour ago');
        });

        test('should use demo data when activities array is empty', () => {
            const container = document.getElementById('recentActivities');
            
            inventoryManager.updateRecentActivityInContainer(container, []);
            
            // Demo data should be rendered
            expect(container.innerHTML).toContain('Added 50 iPhone 15 Pro Max units');
            expect(container.innerHTML).toContain('Removed 20 MacBook Pro units');
            expect(container.innerHTML).toContain('Updated iPad Pro inventory details');
        });
    });

    // Test API Integration
    describe('API Integration', () => {
        test('loadItems should call API and update UI', async () => {
            // Mock API response
            const mockItems = [
                { sku: 'SKU1', name: 'Item 1', category: 'Electronics', quantity: 10 },
                { sku: 'SKU2', name: 'Item 2', category: 'Furniture', quantity: 3 }
            ];
            
            api.getItems.mockResolvedValue(mockItems);
            
            // Spy on functions that should be called
            const updateStatsSpy = jest.spyOn(inventoryManager, 'updateDashboardStats');
            const renderTableSpy = jest.spyOn(inventoryManager, 'renderItemsTable');
            
            // Call the function
            const result = await inventoryManager.loadItems();
            
            // Check if API was called
            expect(api.getItems).toHaveBeenCalled();
            
            // Check if related functions were called with correct data
            expect(updateStatsSpy).toHaveBeenCalledWith(mockItems);
            expect(renderTableSpy).toHaveBeenCalledWith(mockItems);
            
            // Check if function returns expected data
            expect(result).toEqual(mockItems);
        });

        test('loadItems should handle API errors', async () => {
            // Mock API error
            api.getItems.mockRejectedValue(new Error('API error'));
            
            // Call the function
            const result = await inventoryManager.loadItems();
            
            // Check if error notification was shown
            expect(notificationService.showNotification).toHaveBeenCalledWith(
                'Failed to load inventory items',
                'error'
            );
            
            // Should return empty array as fallback
            expect(result).toEqual([]);
        });
    });
});

// Additional tests for the formatDate and debounce global utility functions
describe('Utility Functions', () => {
    test('formatDate should correctly handle null input', () => {
        expect(formatDate(null)).toBe('');
    });

    test('formatDate should correctly handle undefined input', () => {
        expect(formatDate(undefined)).toBe('');
    });
}); 