using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using WarehouseManagementSystem.Services.Interfaces;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace WarehouseManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class ActivityLogsController : ControllerBase
    {
        private readonly IActivityService _activityService;
        private readonly ILogger<ActivityLogsController> _logger;

        public ActivityLogsController(IActivityService activityService, ILogger<ActivityLogsController> logger)
        {
            _activityService = activityService;
            _logger = logger;
        }

        // GET: api/ActivityLogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetActivityLogs(
            [FromQuery] int count = 100,
            [FromQuery] string category = null)
        {
            _logger.LogInformation($"Getting activity logs (count: {count}, category: {category})");
            
            var activities = await _activityService.GetRecentActivitiesAsync(count);
            
            // Filter by category if provided (using Description field instead)
            if (!string.IsNullOrEmpty(category))
            {
                // Since there's no Category field, we'll match against the Description or ItemSKU
                activities = activities.Where(a => 
                    a.Description.Contains(category, StringComparison.OrdinalIgnoreCase) || 
                    (a.ItemSKU != null && a.ItemSKU.Contains(category, StringComparison.OrdinalIgnoreCase))
                ).ToList();
            }
            
            return Ok(activities);
        }

        // GET: api/ActivityLogs/recent
        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetRecentLogs(
            [FromQuery] int count = 5,
            [FromQuery] string category = null)
        {
            _logger.LogInformation($"Getting recent activity logs (count: {count}, category: {category})");
            
            var activities = await _activityService.GetRecentActivitiesAsync(count);
            
            // Filter by category if provided (using Description field instead)
            if (!string.IsNullOrEmpty(category))
            {
                // Since there's no Category field, we'll match against the Description or ItemSKU
                activities = activities.Where(a => 
                    a.Description.Contains(category, StringComparison.OrdinalIgnoreCase) || 
                    (a.ItemSKU != null && a.ItemSKU.Contains(category, StringComparison.OrdinalIgnoreCase))
                ).ToList();
            }
            
            return Ok(activities);
        }

        // GET: api/ActivityLogs/type/{type}
        [HttpGet("type/{type}")]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetActivitiesByType(string type, [FromQuery] int count = 10)
        {
            _logger.LogInformation($"Getting activities by type: {type} (count: {count})");
            return Ok(await _activityService.GetActivitiesByTypeAsync(type, count));
        }

        // GET: api/ActivityLogs/item/{sku}
        [HttpGet("item/{sku}")]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetActivitiesByItem(string sku, [FromQuery] int count = 10)
        {
            _logger.LogInformation($"Getting activities by item: {sku} (count: {count})");
            return Ok(await _activityService.GetActivitiesByItemAsync(sku, count));
        }

        // GET: api/ActivityLogs/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetActivitiesByUser(string userId, [FromQuery] int count = 10)
        {
            _logger.LogInformation($"Getting activities by user: {userId} (count: {count})");
            return Ok(await _activityService.GetActivitiesByUserAsync(userId, count));
        }

        // POST: api/ActivityLogs
        [HttpPost]
        public async Task<ActionResult<ActivityLog>> CreateActivityLog(ActivityLog log)
        {
            _logger.LogInformation($"Creating activity log: {log.ActionType} - {log.Description}");
            
            var activity = await _activityService.LogActivityAsync(
                log.ActionType,
                log.Description,
                log.ItemSKU,
                log.UserId
            );
            
            return CreatedAtAction(nameof(GetActivityLogs), new { id = activity.Id }, activity);
        }

        // GET: api/ActivityLogs/stockmovement
        [HttpGet("stockmovement")]
        public async Task<ActionResult<object>> GetStockMovement()
        {
            _logger.LogInformation("Getting stock movement data");
            
            // Get activities for the last 7 days
            var startDate = DateTime.UtcNow.Date.AddDays(-6);
            var endDate = DateTime.UtcNow.Date.AddDays(1);
            
            // Create days array for the last 7 days
            var days = Enumerable.Range(0, 7)
                .Select(i => startDate.AddDays(i).ToString("ddd"))
                .ToArray();
            
            // Get all activities related to stock movement within this period
            var stockActivities = await _activityService.GetActivitiesByTypeAsync("Add", 1000);
            var stockActivitiesList = stockActivities.ToList();
            
            var removeActivities = await _activityService.GetActivitiesByTypeAsync("Remove", 1000);
            stockActivitiesList.AddRange(removeActivities);
            
            var filteredActivities = stockActivitiesList
                .Where(a => a.Timestamp >= startDate && a.Timestamp < endDate)
                .ToList();
            
            // Group by day and action type
            var groupedData = filteredActivities
                .GroupBy(a => new 
                { 
                    Day = a.Timestamp.ToString("ddd"), 
                    Type = a.ActionType 
                })
                .Select(g => new 
                {
                    Day = g.Key.Day,
                    Type = g.Key.Type,
                    Count = g.Count()
                })
                .ToList();
            
            // Prepare the data series
            var inboundData = days.Select(day => 
                groupedData.FirstOrDefault(g => g.Day == day && g.Type == "Add")?.Count ?? 0
            ).ToArray();
            
            var outboundData = days.Select(day => 
                groupedData.FirstOrDefault(g => g.Day == day && g.Type == "Remove")?.Count ?? 0
            ).ToArray();
            
            return Ok(new 
            {
                Days = days,
                Inbound = inboundData,
                Outbound = outboundData
            });
        }

        // POST: api/ActivityLogs/seed
        [HttpPost("seed")]
        public async Task<IActionResult> SeedActivityLogs()
        {
            _logger.LogInformation("Seeding activity logs");
            
            var random = new Random();
            var actionTypes = new[] { "Add", "Remove", "Update", "Move" };
            var locations = new[] { "Zone A", "Zone B", "Zone C", "Zone D" };
            var items = new[] { "Laptop", "Desk Chair", "Monitor", "Keyboard", "Mouse", "Headphones", "Phone", "Tablet" };
            
            for (int i = 0; i < 20; i++)
            {
                var actionType = actionTypes[random.Next(actionTypes.Length)];
                var item = items[random.Next(items.Length)];
                var location = locations[random.Next(locations.Length)];
                var sku = $"SKU-{random.Next(1000, 9999)}";
                
                string description = actionType switch
                {
                    "Add" => $"Added {random.Next(1, 10)} {item} units",
                    "Remove" => $"Removed {random.Next(1, 5)} {item} units",
                    "Update" => $"Updated {item} details",
                    "Move" => $"Moved {item} to {location}",
                    _ => $"Action on {item}"
                };
                
                await _activityService.LogActivityAsync(
                    actionType,
                    description,
                    sku,
                    null
                );
                
                // Randomize timestamp to distribute over the last week
                var activity = await _activityService.GetRecentActivitiesAsync(1);
                var lastActivity = activity.FirstOrDefault();
                
                if (lastActivity != null)
                {
                    var hoursAgo = random.Next(0, 168); // Up to 7 days ago
                    lastActivity.Timestamp = DateTime.UtcNow.AddHours(-hoursAgo);
                    
                    using var context = HttpContext.RequestServices.GetRequiredService<WarehouseContext>();
                    context.Update(lastActivity);
                    await context.SaveChangesAsync();
                }
            }
            
            return Ok("Activity logs seeded successfully");
        }
    }
} 