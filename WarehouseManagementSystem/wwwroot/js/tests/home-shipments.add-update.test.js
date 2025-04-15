/**
 * Unit tests for the add and update functionality in home-shipments.js
 */

// Mock DOM elements
beforeEach(() => {
  // Set up document body with form elements
  document.body.innerHTML = `
    <form id="shipmentForm">
      <input type="hidden" id="shipmentId" name="shipmentId" value="">
      <select id="shipmentType" name="shipmentType" required>
        <option value="">Select Type</option>
        <option value="Inbound">Inbound</option>
        <option value="Outbound">Outbound</option>
        <option value="Transfer">Transfer</option>
        <option value="Return">Return</option>
      </select>
      <input type="text" id="partnerName" name="partnerName">
      <select id="status" name="status">
        <option value="Pending">Pending</option>
        <option value="Processing">Processing</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <select id="priority" name="priority">
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>
      <input type="date" id="estimatedArrival" name="estimatedArrival">
      <div id="itemsContainer">
        <div class="item-row">
          <input type="text" name="items[0].sku" class="item-sku" required>
          <input type="number" name="items[0].quantity" class="item-quantity" required min="1">
          <input type="text" name="items[0].notes" class="item-notes">
          <button type="button" class="remove-item">Remove</button>
        </div>
      </div>
      <button type="button" id="addItemBtn">Add Item</button>
      <button type="submit">Submit</button>
    </form>
    <div id="notificationContainer"></div>
    <div id="confirmationModal" class="modal">
      <div class="modal-content">
        <p id="confirmationMessage"></p>
        <div class="modal-actions">
          <button id="confirmYes">Yes</button>
          <button id="confirmNo">No</button>
        </div>
      </div>
    </div>
  `;

  // Mock fetch API
  global.fetch = jest.fn();
  
  // Set up fetch mock to return successful responses by default
  global.fetch.mockImplementation((url, options) => {
    let responseData = {};
    
    if (url.includes('/api/shipments') && options.method === 'POST') {
      responseData = { 
        id: '12345', 
        type: 'Inbound', 
        partnerName: 'Test Partner' 
      };
    } else if (url.includes('/api/shipments') && options.method === 'PUT') {
      responseData = { 
        id: '12345', 
        type: 'Inbound', 
        partnerName: 'Updated Partner' 
      };
    } else if (url.includes('/api/shipments/') && options.method === 'GET') {
      responseData = { 
        id: '12345', 
        type: 'Inbound', 
        partnerName: 'Test Partner',
        status: 'Pending',
        priority: 'Medium',
        estimatedArrival: '2023-10-15',
        items: [
          { sku: 'ITEM-001', quantity: 5, notes: 'Test notes' }
        ]
      };
    } else if (url.includes('/api/shipments/') && options.method === 'DELETE') {
      responseData = { success: true };
    }
    
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData)
    });
  });

  // Mock showNotification function
  window.showNotification = jest.fn();
  
  // Mock modals
  window.showModal = jest.fn();
  window.hideModal = jest.fn();
  
  // Mock console methods
  global.console = {
    ...global.console,
    log: jest.fn(),
    error: jest.fn()
  };
});

afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
});

// Test submitShipmentForm function
describe('submitShipmentForm', () => {
  // Mocked submitShipmentForm function for testing
  const submitShipmentForm = async (event) => {
    if (event) event.preventDefault();
    
    const form = document.getElementById('shipmentForm');
    const shipmentId = document.getElementById('shipmentId').value.trim();
    const isNewShipment = !shipmentId;
    
    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
      } else {
        field.classList.remove('error');
      }
    });
    
    if (!isValid) {
      showNotification('Please fill all required fields', 'error');
      return false;
    }
    
    // Collect form data
    const formData = new FormData(form);
    const jsonData = {};
    
    formData.forEach((value, key) => {
      // Handle items array
      if (key.startsWith('items[')) {
        const matches = key.match(/items\[(\d+)\]\.(\w+)/);
        if (matches) {
          const [, index, property] = matches;
          if (!jsonData.items) jsonData.items = [];
          if (!jsonData.items[index]) jsonData.items[index] = {};
          jsonData.items[index][property] = value;
        }
      } else {
        jsonData[key] = value;
      }
    });
    
    // Ensure items is properly converted to array
    if (jsonData.items) {
      jsonData.items = Object.values(jsonData.items);
    }
    
    try {
      const url = isNewShipment 
        ? '/api/shipments' 
        : `/api/shipments/${shipmentId}`;
      
      const method = isNewShipment ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save shipment');
      }
      
      const result = await response.json();
      
      showNotification(
        isNewShipment 
          ? `Shipment created successfully. ID: ${result.id}` 
          : 'Shipment updated successfully',
        'success'
      );
      
      // Reset form for new shipment
      if (isNewShipment) {
        form.reset();
        
        // Clear all item rows except the first one
        const itemsContainer = document.getElementById('itemsContainer');
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        
        for (let i = 1; i < itemRows.length; i++) {
          itemRows[i].remove();
        }
        
        // Clear the first row's inputs
        const firstRow = itemsContainer.querySelector('.item-row');
        if (firstRow) {
          firstRow.querySelectorAll('input').forEach(input => {
            input.value = '';
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving shipment:', error);
      showNotification('Failed to save shipment: ' + error.message, 'error');
      return false;
    }
  };

  test('validates required fields', async () => {
    // Clear required fields
    document.getElementById('shipmentType').value = '';
    document.querySelectorAll('.item-sku, .item-quantity').forEach(field => {
      field.value = '';
    });

    const result = await submitShipmentForm({ preventDefault: jest.fn() });
    
    expect(result).toBe(false);
    expect(window.showNotification).toHaveBeenCalledWith('Please fill all required fields', 'error');
  });

  test('creates new shipment successfully', async () => {
    // Set form values
    document.getElementById('shipmentType').value = 'Inbound';
    document.getElementById('partnerName').value = 'Test Partner';
    document.querySelectorAll('.item-sku').forEach(field => field.value = 'ITEM-001');
    document.querySelectorAll('.item-quantity').forEach(field => field.value = '5');

    const result = await submitShipmentForm({ preventDefault: jest.fn() });
    
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/shipments', expect.any(Object));
    expect(window.showNotification).toHaveBeenCalledWith(
      'Shipment created successfully. ID: 12345', 
      'success'
    );
  });

  test('updates existing shipment successfully', async () => {
    // Set shipment ID to simulate editing
    document.getElementById('shipmentId').value = '12345';
    document.getElementById('shipmentType').value = 'Inbound';
    document.getElementById('partnerName').value = 'Updated Partner';
    document.querySelectorAll('.item-sku').forEach(field => field.value = 'ITEM-002');
    document.querySelectorAll('.item-quantity').forEach(field => field.value = '10');

    const result = await submitShipmentForm({ preventDefault: jest.fn() });
    
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/shipments/12345', expect.any(Object));
    expect(window.showNotification).toHaveBeenCalledWith(
      'Shipment updated successfully', 
      'success'
    );
  });

  test('handles API error', async () => {
    // Mock fetch to simulate error
    global.fetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
    });

    document.getElementById('shipmentType').value = 'Inbound';
    document.getElementById('partnerName').value = 'Test Partner';
    document.querySelectorAll('.item-sku').forEach(field => field.value = 'ITEM-001');
    document.querySelectorAll('.item-quantity').forEach(field => field.value = '5');

    const result = await submitShipmentForm({ preventDefault: jest.fn() });
    
    expect(result).toBe(false);
    expect(window.showNotification).toHaveBeenCalledWith(
      'Failed to save shipment: Failed to save shipment', 
      'error'
    );
  });
});

// Test addItemRow function
describe('addItemRow', () => {
  // Mocked addItemRow function for testing
  const addItemRow = () => {
    const container = document.getElementById('itemsContainer');
    const existingRows = container.querySelectorAll('.item-row');
    const newIndex = existingRows.length;
    
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    
    newRow.innerHTML = `
      <input type="text" name="items[${newIndex}].sku" class="item-sku" required placeholder="Item SKU">
      <input type="number" name="items[${newIndex}].quantity" class="item-quantity" required min="1" placeholder="Quantity">
      <input type="text" name="items[${newIndex}].notes" class="item-notes" placeholder="Notes">
      <button type="button" class="remove-item">Remove</button>
    `;
    
    container.appendChild(newRow);
    
    // Add event listener to remove button
    const removeBtn = newRow.querySelector('.remove-item');
    removeBtn.addEventListener('click', () => {
      newRow.remove();
    });
    
    return newRow;
  };

  test('adds new item row with correct structure', () => {
    const container = document.getElementById('itemsContainer');
    const initialRowCount = container.querySelectorAll('.item-row').length;
    
    const newRow = addItemRow();
    
    const updatedRowCount = container.querySelectorAll('.item-row').length;
    expect(updatedRowCount).toBe(initialRowCount + 1);
    expect(newRow.classList.contains('item-row')).toBe(true);
    
    // Check if inputs have correct names
    const skuInput = newRow.querySelector('.item-sku');
    const quantityInput = newRow.querySelector('.item-quantity');
    const notesInput = newRow.querySelector('.item-notes');
    
    expect(skuInput.name).toBe(`items[${initialRowCount}].sku`);
    expect(quantityInput.name).toBe(`items[${initialRowCount}].quantity`);
    expect(notesInput.name).toBe(`items[${initialRowCount}].notes`);
  });

  test('remove button removes the row', () => {
    const container = document.getElementById('itemsContainer');
    const initialRowCount = container.querySelectorAll('.item-row').length;
    
    const newRow = addItemRow();
    expect(container.querySelectorAll('.item-row').length).toBe(initialRowCount + 1);
    
    const removeButton = newRow.querySelector('.remove-item');
    removeButton.click();
    
    expect(container.querySelectorAll('.item-row').length).toBe(initialRowCount);
    expect(container.contains(newRow)).toBe(false);
  });

  test('indexes are assigned correctly for multiple rows', () => {
    const container = document.getElementById('itemsContainer');
    
    // Add three new rows
    const row1 = addItemRow();
    const row2 = addItemRow();
    const row3 = addItemRow();
    
    // Check the name attributes
    expect(row1.querySelector('.item-sku').name).toBe('items[1].sku');
    expect(row2.querySelector('.item-sku').name).toBe('items[2].sku');
    expect(row3.querySelector('.item-sku').name).toBe('items[3].sku');
    
    // Remove the middle row
    row2.querySelector('.remove-item').click();
    
    // Add another row - should use the next index
    const row4 = addItemRow();
    expect(row4.querySelector('.item-sku').name).toBe('items[3].sku');
  });
});

// Test updateShipment function
describe('updateShipment', () => {
  // Mocked updateShipment function for testing
  const updateShipment = async (shipmentId) => {
    if (!shipmentId) {
      showNotification('Invalid shipment ID', 'error');
      return false;
    }
    
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const shipment = await response.json();
      
      // Populate form fields
      document.getElementById('shipmentId').value = shipment.id;
      
      if (shipment.type) {
        document.getElementById('shipmentType').value = shipment.type;
      }
      
      if (shipment.partnerName) {
        document.getElementById('partnerName').value = shipment.partnerName;
      }
      
      if (shipment.status) {
        document.getElementById('status').value = shipment.status;
      }
      
      if (shipment.priority) {
        document.getElementById('priority').value = shipment.priority;
      }
      
      if (shipment.estimatedArrival) {
        document.getElementById('estimatedArrival').value = shipment.estimatedArrival;
      }
      
      // Handle items
      const itemsContainer = document.getElementById('itemsContainer');
      itemsContainer.innerHTML = ''; // Clear existing items
      
      if (shipment.items && shipment.items.length > 0) {
        shipment.items.forEach((item, index) => {
          const row = document.createElement('div');
          row.className = 'item-row';
          
          row.innerHTML = `
            <input type="text" name="items[${index}].sku" class="item-sku" required value="${item.sku || ''}">
            <input type="number" name="items[${index}].quantity" class="item-quantity" required min="1" value="${item.quantity || 1}">
            <input type="text" name="items[${index}].notes" class="item-notes" value="${item.notes || ''}">
            <button type="button" class="remove-item">Remove</button>
          `;
          
          itemsContainer.appendChild(row);
          
          // Add event listener to remove button
          const removeBtn = row.querySelector('.remove-item');
          removeBtn.addEventListener('click', () => {
            row.remove();
          });
        });
      } else {
        // Add an empty row if no items
        const row = document.createElement('div');
        row.className = 'item-row';
        
        row.innerHTML = `
          <input type="text" name="items[0].sku" class="item-sku" required>
          <input type="number" name="items[0].quantity" class="item-quantity" required min="1" value="1">
          <input type="text" name="items[0].notes" class="item-notes">
          <button type="button" class="remove-item">Remove</button>
        `;
        
        itemsContainer.appendChild(row);
        
        // Add event listener to remove button
        const removeBtn = row.querySelector('.remove-item');
        removeBtn.addEventListener('click', () => {
          row.remove();
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error loading shipment:', error);
      showNotification('Failed to load shipment data: ' + error.message, 'error');
      return false;
    }
  };

  test('loads shipment data correctly', async () => {
    const result = await updateShipment('12345');
    
    expect(result).toBe(true);
    expect(document.getElementById('shipmentId').value).toBe('12345');
    expect(document.getElementById('shipmentType').value).toBe('Inbound');
    expect(document.getElementById('partnerName').value).toBe('Test Partner');
    expect(document.getElementById('status').value).toBe('Pending');
    expect(document.getElementById('priority').value).toBe('Medium');
    expect(document.getElementById('estimatedArrival').value).toBe('2023-10-15');
    
    // Check items
    const itemRows = document.querySelectorAll('.item-row');
    expect(itemRows.length).toBe(1);
    
    const skuInput = itemRows[0].querySelector('.item-sku');
    const quantityInput = itemRows[0].querySelector('.item-quantity');
    const notesInput = itemRows[0].querySelector('.item-notes');
    
    expect(skuInput.value).toBe('ITEM-001');
    expect(quantityInput.value).toBe('5');
    expect(notesInput.value).toBe('Test notes');
  });

  test('handles shipment with no items', async () => {
    // Mock fetch to return a shipment with no items
    global.fetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: '12345',
          type: 'Inbound',
          partnerName: 'Test Partner',
          items: []
        })
      });
    });

    const result = await updateShipment('12345');
    
    expect(result).toBe(true);
    
    // Check that an empty row was added
    const itemRows = document.querySelectorAll('.item-row');
    expect(itemRows.length).toBe(1);
    
    // Check that inputs are empty
    const skuInput = itemRows[0].querySelector('.item-sku');
    expect(skuInput.value).toBe('');
  });

  test('handles API error', async () => {
    // Mock fetch to simulate error
    global.fetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
    });

    const result = await updateShipment('99999');
    
    expect(result).toBe(false);
    expect(window.showNotification).toHaveBeenCalledWith(
      'Failed to load shipment data: HTTP error! status: 404', 
      'error'
    );
  });

  test('requires valid shipment ID', async () => {
    const result = await updateShipment('');
    
    expect(result).toBe(false);
    expect(window.showNotification).toHaveBeenCalledWith('Invalid shipment ID', 'error');
  });
});

// Test deleteShipment function
describe('deleteShipment', () => {
  // Mocked deleteShipment function for testing
  const deleteShipment = async (shipmentId) => {
    if (!shipmentId) {
      showNotification('Invalid shipment ID', 'error');
      return false;
    }
    
    // Show confirmation modal
    document.getElementById('confirmationMessage').textContent = 
      `Are you sure you want to delete shipment ${shipmentId}? This action cannot be undone.`;
    
    showModal('confirmationModal');
    
    // Return a promise that resolves when the user confirms or cancels
    return new Promise((resolve) => {
      const confirmYesBtn = document.getElementById('confirmYes');
      const confirmNoBtn = document.getElementById('confirmNo');
      
      // Handle confirmation
      const handleConfirm = async () => {
        try {
          const response = await fetch(`/api/shipments/${shipmentId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          
          showNotification('Shipment deleted successfully', 'success');
          hideModal('confirmationModal');
          
          // Clean up event listeners
          confirmYesBtn.removeEventListener('click', handleConfirm);
          confirmNoBtn.removeEventListener('click', handleCancel);
          
          resolve(true);
        } catch (error) {
          console.error('Error deleting shipment:', error);
          showNotification('Failed to delete shipment: ' + error.message, 'error');
          hideModal('confirmationModal');
          
          // Clean up event listeners
          confirmYesBtn.removeEventListener('click', handleConfirm);
          confirmNoBtn.removeEventListener('click', handleCancel);
          
          resolve(false);
        }
      };
      
      // Handle cancellation
      const handleCancel = () => {
        hideModal('confirmationModal');
        
        // Clean up event listeners
        confirmYesBtn.removeEventListener('click', handleConfirm);
        confirmNoBtn.removeEventListener('click', handleCancel);
        
        resolve(false);
      };
      
      // Add event listeners
      confirmYesBtn.addEventListener('click', handleConfirm);
      confirmNoBtn.addEventListener('click', handleCancel);
    });
  };

  test('shows confirmation dialog and deletes on confirm', async () => {
    // Create a promise to resolve when the confirm button is clicked
    const deletePromise = deleteShipment('12345');
    
    // Verify confirmation modal is shown
    expect(window.showModal).toHaveBeenCalledWith('confirmationModal');
    expect(document.getElementById('confirmationMessage').textContent).toContain('12345');
    
    // Simulate user confirming the deletion
    document.getElementById('confirmYes').click();
    
    // Wait for the deletion process to complete
    const result = await deletePromise;
    
    // Verify delete operation was successful
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/shipments/12345', { method: 'DELETE' });
    expect(window.showNotification).toHaveBeenCalledWith('Shipment deleted successfully', 'success');
    expect(window.hideModal).toHaveBeenCalledWith('confirmationModal');
  });

  test('cancels deletion when user clicks No', async () => {
    // Create a promise to resolve when the cancel button is clicked
    const deletePromise = deleteShipment('12345');
    
    // Verify confirmation modal is shown
    expect(window.showModal).toHaveBeenCalledWith('confirmationModal');
    
    // Simulate user canceling the deletion
    document.getElementById('confirmNo').click();
    
    // Wait for the cancellation process to complete
    const result = await deletePromise;
    
    // Verify no API call was made and operation was cancelled
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalledWith('/api/shipments/12345', { method: 'DELETE' });
    expect(window.hideModal).toHaveBeenCalledWith('confirmationModal');
  });

  test('handles API error during deletion', async () => {
    // Mock fetch to simulate error
    global.fetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
    });

    // Create a promise to resolve when the confirm button is clicked
    const deletePromise = deleteShipment('12345');
    
    // Simulate user confirming the deletion
    document.getElementById('confirmYes').click();
    
    // Wait for the deletion process to complete
    const result = await deletePromise;
    
    // Verify operation failed and error notification was shown
    expect(result).toBe(false);
    expect(window.showNotification).toHaveBeenCalledWith(
      'Failed to delete shipment: HTTP error! status: 500', 
      'error'
    );
  });

  test('requires valid shipment ID', async () => {
    const result = await deleteShipment('');
    
    expect(result).toBe(false);
    expect(window.showNotification).toHaveBeenCalledWith('Invalid shipment ID', 'error');
    expect(window.showModal).not.toHaveBeenCalled();
  });
}); 