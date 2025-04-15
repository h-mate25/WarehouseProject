console.log('[DEBUG] tasks.js loaded at:', new Date().toISOString());

/**
 * Tasks Manager
 * Handles CRUD operations for warehouse tasks
 */
class TasksManager {
    constructor() {
        this.apiUrl = '/api/Home/Tasks';
        this.taskList = document.getElementById('taskList');
        this.taskFormModal = document.getElementById('taskFormModal');
        this.viewTaskModal = document.getElementById('viewTaskModal');
        this.taskForm = document.getElementById('taskForm');
        this.notificationContainer = document.getElementById('notification');
        this.filterForm = document.getElementById('taskFilterForm');
    }

    /**
     * Initialize the tasks manager
     */
    init() {
        console.log('Initializing Tasks Manager...');
        
        // Load initial tasks
        this.loadTasks();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize datepickers
        this.initializeDatepickers();
        
        console.log('Tasks Manager initialized.');
    }

    /**
     * Set up event listeners for tasks functionality
     */
    setupEventListeners() {
        // Get buttons
        const addTaskBtn = document.getElementById('addTaskBtn');
        const filterTasksBtn = document.getElementById('filterTasksBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        // Add task button
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.showTaskForm());
        }
        
        // Filter tasks button
        if (filterTasksBtn && this.filterForm) {
            filterTasksBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }
        
        // Clear filters button
        if (clearFiltersBtn && this.filterForm) {
            clearFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearFilters();
            });
        }
        
        // Task form submission
        if (this.taskForm) {
            this.taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }
        
        // Task item click delegation
        if (this.taskList) {
            this.taskList.addEventListener('click', (e) => {
                const target = e.target;
                
                if (target.classList.contains('view-task-btn') || target.closest('.view-task-btn')) {
                    const taskId = target.closest('[data-task-id]').dataset.taskId;
                    this.viewTask(taskId);
                } else if (target.classList.contains('edit-task-btn') || target.closest('.edit-task-btn')) {
                    const taskId = target.closest('[data-task-id]').dataset.taskId;
                    this.editTask(taskId);
                } else if (target.classList.contains('delete-task-btn') || target.closest('.delete-task-btn')) {
                    const taskId = target.closest('[data-task-id]').dataset.taskId;
                    this.deleteTask(taskId);
                } else if (target.classList.contains('complete-task-btn') || target.closest('.complete-task-btn')) {
                    const taskId = target.closest('[data-task-id]').dataset.taskId;
                    this.completeTask(taskId);
                }
            });
        }
    }
    
    /**
     * Initialize datepickers for date inputs
     */
    initializeDatepickers() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            // Set min date to today for due date inputs that are not filters
            if (input.id === 'dueDate' && !input.closest('#taskFilterForm')) {
                const today = new Date().toISOString().split('T')[0];
                input.min = today;
            }
        });
    }

    /**
     * Load tasks from the server
     */
    loadTasks() {
        if (!this.taskList) {
            console.error('Task list container not found!');
            return;
        }
        
        fetch(this.apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Tasks loaded:', data);
                this.renderTasks(data);
                this.updateTasksCount(data);
            })
            .catch(error => {
                console.error('Error loading tasks:', error);
                this.showNotification('Error loading tasks. Please try again.', 'error');
            });
    }
    
    /**
     * Apply filters to tasks
     */
    applyFilters() {
        if (!this.filterForm) return;
        
        const formData = new FormData(this.filterForm);
        const params = new URLSearchParams();
        
        formData.forEach((value, key) => {
            if (value) params.append(key, value);
        });
        
        fetch(`${this.apiUrl}/filter?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Filtered tasks:', data);
                this.renderTasks(data);
                this.updateTasksCount(data);
                this.showNotification('Filters applied successfully', 'success');
            })
            .catch(error => {
                console.error('Error applying filters:', error);
                this.showNotification('Error applying filters. Please try again.', 'error');
            });
    }
    
    /**
     * Clear all applied filters
     */
    clearFilters() {
        if (!this.filterForm) return;
        
        this.filterForm.reset();
        this.loadTasks();
        this.showNotification('Filters cleared', 'info');
    }

    /**
     * Render tasks in the task list
     * @param {Array} tasks - Array of task objects
     */
    renderTasks(tasks) {
        if (!this.taskList) return;
        
        this.taskList.innerHTML = '';
        
        if (!tasks || tasks.length === 0) {
            this.taskList.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No tasks found. Create a new task to get started.
                    </td>
                </tr>
            `;
            return;
        }
        
        tasks.forEach(task => {
            const dueDate = new Date(task.dueDate);
            const formattedDueDate = dueDate.toLocaleDateString();
            
            // Determine status class
            let statusClass = '';
            switch (task.status) {
                case 'Completed':
                    statusClass = 'bg-green-100 text-green-800';
                    break;
                case 'In Progress':
                    statusClass = 'bg-blue-100 text-blue-800';
                    break;
                case 'Overdue':
                    statusClass = 'bg-red-100 text-red-800';
                    break;
                default:
                    statusClass = 'bg-yellow-100 text-yellow-800';
                    break;
            }
            
            // Determine priority class
            let priorityClass = '';
            switch (task.priority) {
                case 'Low':
                    priorityClass = 'bg-gray-100 text-gray-800';
                    break;
                case 'Medium':
                    priorityClass = 'bg-blue-100 text-blue-800';
                    break;
                case 'High':
                    priorityClass = 'bg-orange-100 text-orange-800';
                    break;
                case 'Urgent':
                    priorityClass = 'bg-red-100 text-red-800';
                    break;
            }
            
            const taskRow = document.createElement('tr');
            taskRow.className = task.isCompleted ? 'bg-gray-50' : '';
            taskRow.dataset.taskId = task.id;
            
            taskRow.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}">
                    ${task.title}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${task.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityClass}">
                        ${task.priority}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${task.category || 'General'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formattedDueDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${task.assignedTo || 'Unassigned'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <button type="button" class="view-task-btn text-indigo-600 hover:text-indigo-900" title="View">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <button type="button" class="edit-task-btn text-blue-600 hover:text-blue-900" title="Edit">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                        ${!task.isCompleted ? `
                        <button type="button" class="complete-task-btn text-green-600 hover:text-green-900" title="Mark as Complete">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        ` : ''}
                        <button type="button" class="delete-task-btn text-red-600 hover:text-red-900" title="Delete">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            
            this.taskList.appendChild(taskRow);
        });
    }
    
    /**
     * Update tasks count display
     * @param {Array} tasks - Array of task objects
     */
    updateTasksCount(tasks) {
        const totalTasksElement = document.getElementById('totalTasks');
        const pendingTasksElement = document.getElementById('pendingTasks');
        const completedTasksElement = document.getElementById('completedTasks');
        const overdueTasksElement = document.getElementById('overdueTasks');
        
        if (!tasks) return;
        
        const totalCount = tasks.length;
        const pendingCount = tasks.filter(t => t.status === 'Pending').length;
        const completedCount = tasks.filter(t => t.status === 'Completed').length;
        const overdueCount = tasks.filter(t => t.status === 'Overdue').length;
        
        if (totalTasksElement) totalTasksElement.textContent = totalCount;
        if (pendingTasksElement) pendingTasksElement.textContent = pendingCount;
        if (completedTasksElement) completedTasksElement.textContent = completedCount;
        if (overdueTasksElement) overdueTasksElement.textContent = overdueCount;
    }

    /**
     * Show the task form modal for creating a new task
     */
    showTaskForm() {
        if (!this.taskFormModal || !this.taskForm) return;
        
        // Reset form
        this.taskForm.reset();
        this.taskForm.dataset.mode = 'create';
        this.taskForm.dataset.taskId = '';
        
        // Set default due date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dueDateInput = this.taskForm.querySelector('#dueDate');
        if (dueDateInput) {
            dueDateInput.value = tomorrow.toISOString().split('T')[0];
        }
        
        // Update modal title
        const modalTitle = this.taskFormModal.querySelector('.modal-title');
        if (modalTitle) modalTitle.textContent = 'Create New Task';
        
        // Show modal
        this.taskFormModal.classList.remove('hidden');
    }
    
    /**
     * Hide the task form modal
     */
    hideTaskForm() {
        if (!this.taskFormModal) return;
        this.taskFormModal.classList.add('hidden');
    }
    
    /**
     * Hide the view task modal
     */
    hideViewTask() {
        if (!this.viewTaskModal) return;
        this.viewTaskModal.classList.add('hidden');
    }

    /**
     * Save a task (create or update)
     */
    saveTask() {
        if (!this.taskForm) return;
        
        // Validate form
        if (!this.validateTaskForm()) {
            return;
        }
        
        const formData = new FormData(this.taskForm);
        const taskData = {};
        
        formData.forEach((value, key) => {
            taskData[key] = value;
        });
        
        // Check if this is an update or create
        const isUpdate = this.taskForm.dataset.mode === 'edit';
        const taskId = this.taskForm.dataset.taskId;
        
        const url = isUpdate ? `${this.apiUrl}/${taskId}` : this.apiUrl;
        const method = isUpdate ? 'PUT' : 'POST';
        
        // Add metadata
        if (!isUpdate) {
            taskData.createdAt = new Date().toISOString();
        }
        
        // Convert to proper format for API
        const task = {
            task: taskData
        };
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Task ${isUpdate ? 'updated' : 'created'}:`, data);
                this.hideTaskForm();
                this.loadTasks();
                this.showNotification(`Task ${isUpdate ? 'updated' : 'created'} successfully`, 'success');
            })
            .catch(error => {
                console.error(`Error ${isUpdate ? 'updating' : 'creating'} task:`, error);
                this.showNotification(`Error ${isUpdate ? 'updating' : 'creating'} task. Please try again.`, 'error');
            });
    }
    
    /**
     * Validate the task form
     * @returns {boolean} - Whether the form is valid
     */
    validateTaskForm() {
        if (!this.taskForm) return false;
        
        const title = this.taskForm.querySelector('#title').value.trim();
        const dueDate = this.taskForm.querySelector('#dueDate').value;
        
        if (!title) {
            this.showNotification('Title is required', 'error');
            return false;
        }
        
        if (!dueDate) {
            this.showNotification('Due date is required', 'error');
            return false;
        }
        
        return true;
    }

    /**
     * View a task's details
     * @param {number} taskId - The ID of the task to view
     */
    viewTask(taskId) {
        if (!this.viewTaskModal) return;
        
        fetch(`${this.apiUrl}/${taskId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(task => {
                console.log('Task details:', task);
                
                // Update modal content
                const dueDate = new Date(task.dueDate).toLocaleDateString();
                const createdAt = new Date(task.createdAt).toLocaleDateString();
                const completedAt = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Not completed';
                
                // Determine status class
                let statusClass = '';
                switch (task.status) {
                    case 'Completed':
                        statusClass = 'bg-green-100 text-green-800';
                        break;
                    case 'In Progress':
                        statusClass = 'bg-blue-100 text-blue-800';
                        break;
                    case 'Overdue':
                        statusClass = 'bg-red-100 text-red-800';
                        break;
                    default:
                        statusClass = 'bg-yellow-100 text-yellow-800';
                        break;
                }
                
                // Determine priority class
                let priorityClass = '';
                switch (task.priority) {
                    case 'Low':
                        priorityClass = 'bg-gray-100 text-gray-800';
                        break;
                    case 'Medium':
                        priorityClass = 'bg-blue-100 text-blue-800';
                        break;
                    case 'High':
                        priorityClass = 'bg-orange-100 text-orange-800';
                        break;
                    case 'Urgent':
                        priorityClass = 'bg-red-100 text-red-800';
                        break;
                }
                
                // Populate modal content
                this.viewTaskModal.querySelector('.modal-title').textContent = task.title;
                
                const contentContainer = this.viewTaskModal.querySelector('.modal-content');
                contentContainer.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Status</p>
                            <p class="mt-1">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                                    ${task.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Priority</p>
                            <p class="mt-1">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityClass}">
                                    ${task.priority}
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-500">Description</p>
                        <p class="mt-1 text-sm text-gray-900">${task.description || 'No description provided'}</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Category</p>
                            <p class="mt-1 text-sm text-gray-900">${task.category || 'General'}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Assigned To</p>
                            <p class="mt-1 text-sm text-gray-900">${task.assignedTo || 'Unassigned'}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Due Date</p>
                            <p class="mt-1 text-sm text-gray-900">${dueDate}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Created At</p>
                            <p class="mt-1 text-sm text-gray-900">${createdAt}</p>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Completed At</p>
                            <p class="mt-1 text-sm text-gray-900">${completedAt}</p>
                        </div>
                    </div>
                    
                    ${task.relatedItemSKU || task.relatedShipmentId ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        ${task.relatedItemSKU ? `
                        <div>
                            <p class="text-sm font-medium text-gray-500">Related Item</p>
                            <p class="mt-1 text-sm text-gray-900">${task.relatedItemSKU}</p>
                        </div>
                        ` : ''}
                        ${task.relatedShipmentId ? `
                        <div>
                            <p class="text-sm font-medium text-gray-500">Related Shipment</p>
                            <p class="mt-1 text-sm text-gray-900">${task.relatedShipmentId}</p>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                `;
                
                // Show modal
                this.viewTaskModal.classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error viewing task:', error);
                this.showNotification('Error loading task details. Please try again.', 'error');
            });
    }

    /**
     * Edit a task
     * @param {number} taskId - The ID of the task to edit
     */
    editTask(taskId) {
        if (!this.taskFormModal || !this.taskForm) return;
        
        fetch(`${this.apiUrl}/${taskId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(task => {
                console.log('Task to edit:', task);
                
                // Set form mode
                this.taskForm.dataset.mode = 'edit';
                this.taskForm.dataset.taskId = task.id;
                
                // Populate form fields
                this.taskForm.querySelector('#title').value = task.title;
                this.taskForm.querySelector('#description').value = task.description || '';
                this.taskForm.querySelector('#status').value = task.status;
                this.taskForm.querySelector('#priority').value = task.priority;
                this.taskForm.querySelector('#category').value = task.category || 'General';
                this.taskForm.querySelector('#assignedTo').value = task.assignedTo || '';
                
                // Format due date for input
                const dueDate = new Date(task.dueDate);
                const formattedDueDate = dueDate.toISOString().split('T')[0];
                this.taskForm.querySelector('#dueDate').value = formattedDueDate;
                
                // Related items
                if (this.taskForm.querySelector('#relatedItemSKU')) {
                    this.taskForm.querySelector('#relatedItemSKU').value = task.relatedItemSKU || '';
                }
                
                if (this.taskForm.querySelector('#relatedShipmentId')) {
                    this.taskForm.querySelector('#relatedShipmentId').value = task.relatedShipmentId || '';
                }
                
                // Update modal title
                const modalTitle = this.taskFormModal.querySelector('.modal-title');
                if (modalTitle) modalTitle.textContent = 'Edit Task';
                
                // Show modal
                this.taskFormModal.classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error loading task for edit:', error);
                this.showNotification('Error loading task for edit. Please try again.', 'error');
            });
    }

    /**
     * Delete a task
     * @param {number} taskId - The ID of the task to delete
     */
    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        fetch(`${this.apiUrl}/${taskId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Task deleted:', data);
                this.loadTasks();
                this.showNotification('Task deleted successfully', 'success');
            })
            .catch(error => {
                console.error('Error deleting task:', error);
                this.showNotification('Error deleting task. Please try again.', 'error');
            });
    }

    /**
     * Mark a task as complete
     * @param {number} taskId - The ID of the task to complete
     */
    completeTask(taskId) {
        fetch(`${this.apiUrl}/${taskId}/complete`, {
            method: 'PUT'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Task completed:', data);
                this.loadTasks();
                this.showNotification('Task marked as complete', 'success');
            })
            .catch(error => {
                console.error('Error completing task:', error);
                this.showNotification('Error completing task. Please try again.', 'error');
            });
    }

    /**
     * Show a notification message
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, info)
     */
    showNotification(message, type = 'info') {
        if (!this.notificationContainer) return;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'flex items-center p-4 mb-4 rounded-lg';
        
        // Set color based on type
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-50', 'text-green-800');
                break;
            case 'error':
                notification.classList.add('bg-red-50', 'text-red-800');
                break;
            default:
                notification.classList.add('bg-blue-50', 'text-blue-800');
                break;
        }
        
        // Set icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = `<svg class="flex-shrink-0 w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>`;
                break;
            case 'error':
                icon = `<svg class="flex-shrink-0 w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>`;
                break;
            default:
                icon = `<svg class="flex-shrink-0 w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm0 8a1 1 0 10-2 0 1 1 0 002 0z" clip-rule="evenodd" />
                </svg>`;
                break;
        }
        
        // Set notification content
        notification.innerHTML = `
            ${icon}
            <div class="text-sm font-medium">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8" data-dismiss-target="#notification" aria-label="Close">
                <span class="sr-only">Close</span>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        
        // Add close button functionality
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => {
            notification.remove();
        });
        
        // Add to container
        this.notificationContainer.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize tasks manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tasks view initialized');
    window.tasksManager = new TasksManager();
    window.tasksManager.init();
}); 