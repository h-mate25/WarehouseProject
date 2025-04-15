using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using WarehouseManagementSystem.Services.Interfaces;

namespace WarehouseManagementSystem.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly WarehouseContext _context;
        private readonly IActivityService _activityService;

        public HomeController(ILogger<HomeController> logger, WarehouseContext context, IActivityService activityService)
        {
            _logger = logger;
            _context = context;
            _activityService = activityService;
        }

        // Helper method to log activity - calls LogActivityAsync internally
        private void LogActivity(string actionType, string description, string itemSku = null, string userId = null)
        {
            // Skip logging if actionType is "View" - we don't want to create View activities anymore
            if (actionType == "View")
                return;
                
            _ = _activityService.LogActivityAsync(actionType, description, itemSku, userId);
        }

        [AllowAnonymous]
        public IActionResult Index()
        {
            // Redirect to Tasks page if authenticated, otherwise to login page
            // Note: Application now runs on port 5137
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction(nameof(Tasks));
            }
            return RedirectToAction("Login", "Account");
        }

        public IActionResult Tasks()
        {
            // Removed View activity logging
            return View();
        }

        public IActionResult Inventory()
        {
            // Removed View activity logging
            return View();
        }

        // Permanent redirect for old URL
        public IActionResult StockList()
        {
            return RedirectToActionPermanent("Inventory");
        }

        public IActionResult Stocktake()
        {
            return View();
        }

        [AllowAnonymous]
        public async Task<IActionResult> Shipments(string type = null)
        {
            // Get shipments from the database
            var query = _context.Shipments
                .Include(s => s.Items) // Include items for consistent data loading
                .AsQueryable();
            
            // Apply type filter if provided
            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(s => s.Type.ToLower() == type.ToLower());
                ViewData["ShipmentType"] = type;
            }
            
            // Calculate dashboard statistics
            var allShipments = await _context.Shipments.Include(s => s.Items).ToListAsync();
            ViewData["ActiveShipments"] = allShipments.Count(s => s.Status != "Completed");
            ViewData["HighPriorityCount"] = allShipments.Count(s => (s.Priority == "High" || s.Priority == "Urgent") && s.Status != "Completed");
            
            ViewData["PendingInbound"] = allShipments.Count(s => s.Type == "Inbound" && s.Status != "Completed");
            ViewData["PendingOutbound"] = allShipments.Count(s => s.Type == "Outbound" && s.Status != "Completed");
            
            // Calculate arriving/departing today
            var today = DateTime.Today;
            ViewData["ArrivingToday"] = allShipments.Count(s => 
                s.Type == "Inbound" && 
                s.ETA.Date == today && 
                s.Status != "Completed");
                
            ViewData["DepartingToday"] = allShipments.Count(s => 
                s.Type == "Outbound" && 
                s.ETA.Date == today && 
                s.Status != "Completed");
                
            ViewData["CompletedToday"] = allShipments.Count(s => 
                s.Status == "Completed" && 
                s.CompletedAt != null && 
                s.CompletedAt.Value.Date == today);
            
            return View();
        }

        [AllowAnonymous]
        public async Task<IActionResult> InboundShipments()
        {
            ViewData["ShipmentType"] = "Inbound";
            return await Shipments("Inbound");
        }

        [AllowAnonymous]
        public async Task<IActionResult> OutboundShipments()
        {
            ViewData["ShipmentType"] = "Outbound";
            return await Shipments("Outbound");
        }

        [AllowAnonymous]
        public async Task<IActionResult> ShipmentHistory()
        {
            // Get all completed shipments
            var query = _context.Shipments
                .Include(s => s.Items)
                .Where(s => s.Status == "Completed")
                .OrderByDescending(s => s.CompletedAt);
                
            ViewData["CompletedShipments"] = await query.ToListAsync();
            
            return View("Shipments");
        }

        public IActionResult Profile()
        {
            return RedirectToAction("Profile", "Account");
        }

        public IActionResult Help()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new { RequestId = HttpContext.TraceIdentifier });
        }
        
        // API ENDPOINTS FOR SHIPMENTS
        
        [HttpGet]
        [Route("api/Home/Shipments")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShipments(string type = null, string status = null, string search = null)
        {
            var query = _context.Shipments
                .Include(s => s.Items)
                .AsQueryable();
            
            // Apply filters
            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(s => s.Type.ToLower() == type.ToLower());
            }
            
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(s => s.Status.ToLower() == status.ToLower());
            }
            
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(s => 
                    s.Id.Contains(search) || 
                    s.PartnerName.Contains(search));
            }
            
            var shipments = await query.ToListAsync();
            return Json(shipments);
        }
        
        [HttpGet]
        [Route("api/Home/Shipments/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShipment(string id)
        {
            var shipment = await _context.Shipments
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == id);
                
            if (shipment == null)
            {
                return NotFound();
            }
            
            return Json(shipment);
        }
        
        [HttpPost]
        [Route("api/Home/Shipments")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateShipment([FromBody] ShipmentWrapper wrapper)
        {
            if (wrapper?.Shipment == null)
            {
                return BadRequest(new { shipment = new[] { "The shipment field is required." } });
            }
            
            var shipment = wrapper.Shipment;
            
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            shipment.CreatedAt = DateTime.Now;
            shipment.CreatedBy = User.Identity?.Name ?? "System";
            
            // Set shipmentId for each item
            if (shipment.Items != null)
            {
                foreach (var item in shipment.Items)
                {
                    item.ShipmentId = shipment.Id;
                }
                
                // Update the location of each item in inventory to the shipment ID
                foreach (var shipmentItem in shipment.Items)
                {
                    // Find the corresponding inventory item
                    var inventoryItem = await _context.Items.FindAsync(shipmentItem.SKU);
                    if (inventoryItem != null)
                    {
                        // Update the location to the shipment ID
                        inventoryItem.Location = shipment.Id;
                        inventoryItem.UpdatedAt = DateTime.Now;
                        inventoryItem.UpdatedBy = User.Identity?.Name ?? "System";
                        
                        // Mark as modified
                        _context.Entry(inventoryItem).State = EntityState.Modified;
                        
                        // Log the item location change
                        var itemActivity = new ActivityLog
                        {
                            Timestamp = DateTime.Now,
                            UserId = User.Identity?.Name ?? "System",
                            ActionType = "Move",
                            ItemSKU = shipmentItem.SKU,
                            Description = $"Item moved to shipment {shipment.Id}"
                        };
                        _context.ActivityLogs.Add(itemActivity);
                    }
                }
            }
            
            _context.Shipments.Add(shipment);
            
            try
            {
                await _context.SaveChangesAsync();
                
                // Log activity
                var activity = new ActivityLog
                {
                    Timestamp = DateTime.Now,
                    UserId = User.Identity?.Name ?? "System",
                    ActionType = "Created",
                    ItemSKU = shipment.Id,
                    Description = $"Created new {shipment.Type} shipment {shipment.Id}"
                };
                
                _context.ActivityLogs.Add(activity);
                await _context.SaveChangesAsync();
                
                return Json(shipment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        
        [HttpPut]
        [Route("api/Home/Shipments/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateShipment(string id, [FromBody] Shipment shipment)
        {
            if (id != shipment.Id)
            {
                return BadRequest();
            }
            
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Check if shipment exists
            var existingShipment = await _context.Shipments.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
            if (existingShipment == null)
            {
                return NotFound();
            }
            
            // Handle completion status
            if (existingShipment.Status != "Completed" && shipment.Status == "Completed")
            {
                shipment.CompletedAt = DateTime.Now;
                shipment.CompletedBy = User.Identity?.Name ?? "System";
            }
            else
            {
                shipment.CompletedAt = existingShipment.CompletedAt;
                shipment.CompletedBy = existingShipment.CompletedBy;
            }
            
            // Update the location of each item in inventory to the shipment ID
            if (shipment.Items != null && shipment.Items.Any())
            {
                foreach (var shipmentItem in shipment.Items)
                {
                    // Make sure the ShipmentId is set
                    shipmentItem.ShipmentId = shipment.Id;
                    
                    // Find the corresponding inventory item
                    var inventoryItem = await _context.Items.FindAsync(shipmentItem.SKU);
                    if (inventoryItem != null)
                    {
                        // Update the location to the shipment ID only if it's not already set
                        if (inventoryItem.Location != shipment.Id)
                        {
                            inventoryItem.Location = shipment.Id;
                            inventoryItem.UpdatedAt = DateTime.Now;
                            inventoryItem.UpdatedBy = User.Identity?.Name ?? "System";
                            
                            // Mark as modified
                            _context.Entry(inventoryItem).State = EntityState.Modified;
                            
                            // Log the item location change
                            var itemActivity = new ActivityLog
                            {
                                Timestamp = DateTime.Now,
                                UserId = User.Identity?.Name ?? "System",
                                ActionType = "Move",
                                ItemSKU = shipmentItem.SKU,
                                Description = $"Item moved to shipment {shipment.Id}"
                            };
                            _context.ActivityLogs.Add(itemActivity);
                        }
                    }
                }
            }
            
            _context.Entry(shipment).State = EntityState.Modified;
            
            try
            {
                await _context.SaveChangesAsync();
                
                // Log activity
                var activity = new ActivityLog
                {
                    Timestamp = DateTime.Now,
                    UserId = User.Identity?.Name ?? "System",
                    ActionType = "Updated",
                    ItemSKU = shipment.Id,
                    Description = $"Updated {shipment.Type} shipment {shipment.Id}"
                };
                
                _context.ActivityLogs.Add(activity);
                await _context.SaveChangesAsync();
                
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        
        [HttpDelete]
        [Route("api/Home/Shipments/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteShipment(string id)
        {
            var shipment = await _context.Shipments
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == id);
                
            if (shipment == null)
            {
                return NotFound();
            }
            
            // Reset the location of each item in the shipment
            if (shipment.Items != null && shipment.Items.Any())
            {
                foreach (var shipmentItem in shipment.Items)
                {
                    // Find the corresponding inventory item
                    var inventoryItem = await _context.Items.FindAsync(shipmentItem.SKU);
                    if (inventoryItem != null && inventoryItem.Location == shipment.Id)
                    {
                        // Reset the location to a default value
                        inventoryItem.Location = "Warehouse";
                        inventoryItem.UpdatedAt = DateTime.Now;
                        inventoryItem.UpdatedBy = User.Identity?.Name ?? "System";
                        
                        // Mark as modified
                        _context.Entry(inventoryItem).State = EntityState.Modified;
                        
                        // Log the item location change
                        var itemActivity = new ActivityLog
                        {
                            Timestamp = DateTime.Now,
                            UserId = User.Identity?.Name ?? "System",
                            ActionType = "Move",
                            ItemSKU = shipmentItem.SKU,
                            Description = $"Item returned to warehouse from deleted shipment {shipment.Id}"
                        };
                        _context.ActivityLogs.Add(itemActivity);
                    }
                }
            }
            
            _context.Shipments.Remove(shipment);
            
            try
            {
                await _context.SaveChangesAsync();
                
                // Log activity
                var activity = new ActivityLog
                {
                    Timestamp = DateTime.Now,
                    UserId = User.Identity?.Name ?? "System",
                    ActionType = "Deleted",
                    ItemSKU = id,
                    Description = $"Deleted shipment {id}"
                };
                
                _context.ActivityLogs.Add(activity);
                await _context.SaveChangesAsync();
                
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Add wrapper class at the bottom of the controller
        public class ShipmentWrapper
        {
            public Shipment Shipment { get; set; }
        }

        [HttpGet]
        [Route("api/Home/Tasks")]
        public async Task<IActionResult> GetTasks()
        {
            try
            {
                var tasks = await _context.Tasks
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks");
                return StatusCode(500, new { message = "Error retrieving tasks", error = ex.Message });
            }
        }

        [HttpGet]
        [Route("api/Home/Tasks/Today")]
        public async Task<IActionResult> GetTodayTasks()
        {
            try
            {
                var today = DateTime.Today;
                var tasks = await _context.Tasks
                    .Where(t => t.CreatedAt.Date == today || t.DueDate.Date == today)
                    .OrderByDescending(t => t.Priority == "High")
                    .ThenBy(t => t.Status == "Completed")
                    .ThenByDescending(t => t.CreatedAt)
                    .ToListAsync();
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving today's tasks");
                return StatusCode(500, new { message = "Error retrieving today's tasks", error = ex.Message });
            }
        }

        public class TaskWrapper
        {
            public WarehouseTask Task { get; set; }
        }

        [HttpPost]
        [Route("api/Home/Tasks")]
        public async Task<IActionResult> CreateTask([FromBody] TaskWrapper wrapper)
        {
            if (wrapper?.Task == null)
            {
                return BadRequest(new { message = "Task is required" });
            }

            var task = wrapper.Task;
            
            if (string.IsNullOrEmpty(task.Title))
            {
                return BadRequest(new { message = "Task title is required" });
            }

            try
            {
                task.CreatedAt = DateTime.Now;
                task.UpdatedAt = DateTime.Now;
                
                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();
                
                // Log activity
                await _activityService.LogActivityAsync("Task Created", $"Task '{task.Title}' was created", "Task");
                
                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return StatusCode(500, new { message = "Error creating task", error = ex.Message });
            }
        }

        [HttpPut]
        [Route("api/Home/Tasks/{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskWrapper wrapper)
        {
            if (wrapper?.Task == null)
            {
                return BadRequest(new { message = "Task is required" });
            }

            var task = wrapper.Task;
            
            if (id != task.Id)
            {
                return BadRequest(new { message = "Task ID mismatch" });
            }

            try
            {
                var existingTask = await _context.Tasks.FindAsync(id);
                if (existingTask == null)
                {
                    return NotFound(new { message = $"Task with ID {id} not found" });
                }

                // Update properties
                existingTask.Title = task.Title;
                existingTask.Description = task.Description;
                existingTask.AssignedTo = task.AssignedTo;
                existingTask.DueDate = task.DueDate;
                existingTask.Status = task.Status;
                existingTask.Priority = task.Priority;
                existingTask.RelatedItemSKU = task.RelatedItemSKU;
                existingTask.RelatedShipmentId = task.RelatedShipmentId;
                existingTask.UpdatedAt = DateTime.Now;
                
                // If marked as completed and wasn't completed before
                if (task.Status == "Completed" && existingTask.CompletionDate == null)
                {
                    existingTask.CompletionDate = DateTime.Now;
                }
                // If no longer completed
                else if (task.Status != "Completed")
                {
                    existingTask.CompletionDate = null;
                }

                _context.Update(existingTask);
                await _context.SaveChangesAsync();
                
                // Log activity
                await _activityService.LogActivityAsync("Task Updated", $"Task '{existingTask.Title}' was updated", "Task");
                
                return Ok(existingTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task");
                return StatusCode(500, new { message = "Error updating task", error = ex.Message });
            }
        }

        [HttpPut]
        [Route("api/Home/Tasks/{id}/complete")]
        public async Task<IActionResult> CompleteTask(int id)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(id);
                if (task == null)
                {
                    return NotFound(new { message = $"Task with ID {id} not found" });
                }

                task.Status = "Completed";
                task.CompletionDate = DateTime.Now;
                task.UpdatedAt = DateTime.Now;
                
                _context.Update(task);
                await _context.SaveChangesAsync();
                
                // Log activity
                await _activityService.LogActivityAsync("Task Completed", $"Task '{task.Title}' was marked as completed", "Task");
                
                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing task");
                return StatusCode(500, new { message = "Error completing task", error = ex.Message });
            }
        }

        [HttpDelete]
        [Route("api/Home/Tasks/{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(id);
                if (task == null)
                {
                    return NotFound(new { message = $"Task with ID {id} not found" });
                }

                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
                
                // Log activity
                await _activityService.LogActivityAsync("Task Deleted", $"Task '{task.Title}' was deleted", "Task");
                
                return Ok(new { message = $"Task with ID {id} was deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task");
                return StatusCode(500, new { message = "Error deleting task", error = ex.Message });
            }
        }
    }
} 