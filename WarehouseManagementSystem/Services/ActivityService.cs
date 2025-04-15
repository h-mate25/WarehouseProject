using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using WarehouseManagementSystem.Services.Interfaces;

namespace WarehouseManagementSystem.Services
{
    /// <summary>
    /// Service implementation for activity logging and retrieval
    /// </summary>
    public class ActivityService : IActivityService
    {
        private readonly WarehouseContext _context;
        private readonly ILogger<ActivityService> _logger;

        /// <summary>
        /// Initializes a new instance of the ActivityService class
        /// </summary>
        public ActivityService(WarehouseContext context, ILogger<ActivityService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<ActivityLog>> GetRecentActivitiesAsync(int count = 5)
        {
            _logger.LogDebug($"Getting {count} recent activities");
            
            return await _context.ActivityLogs
                .OrderByDescending(log => log.Timestamp)
                .Take(count)
                .ToListAsync();
        }

        /// <inheritdoc />
        public async Task<ActivityLog> LogActivityAsync(string actionType, string description, string itemSku = null, string userId = null)
        {
            _logger.LogDebug($"Logging activity: {actionType} - {description}");
            
            var activity = new ActivityLog
            {
                ActionType = actionType,
                Description = description,
                ItemSKU = itemSku,
                UserId = userId,
                UserName = userId != null ? await GetUsernameFromIdAsync(userId) : "System",
                Timestamp = DateTime.Now
            };

            _context.ActivityLogs.Add(activity);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Activity logged: {activity.Id} - {actionType}");
            return activity;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<ActivityLog>> GetActivitiesByTypeAsync(string actionType, int count = 10)
        {
            _logger.LogDebug($"Getting {count} activities of type {actionType}");
            
            // Convert actionType to lowercase for case-insensitive comparison
            string actionTypeLower = actionType.ToLower();
            
            return await _context.ActivityLogs
                .Where(log => log.ActionType.ToLower() == actionTypeLower)
                .OrderByDescending(log => log.Timestamp)
                .Take(count)
                .ToListAsync();
        }

        /// <inheritdoc />
        public async Task<IEnumerable<ActivityLog>> GetActivitiesByItemAsync(string itemSku, int count = 10)
        {
            _logger.LogDebug($"Getting {count} activities for item {itemSku}");
            
            return await _context.ActivityLogs
                .Where(log => log.ItemSKU == itemSku)
                .OrderByDescending(log => log.Timestamp)
                .Take(count)
                .ToListAsync();
        }

        /// <inheritdoc />
        public async Task<IEnumerable<ActivityLog>> GetActivitiesByUserAsync(string userId, int count = 10)
        {
            _logger.LogDebug($"Getting {count} activities for user {userId}");
            
            return await _context.ActivityLogs
                .Where(log => log.UserId == userId)
                .OrderByDescending(log => log.Timestamp)
                .Take(count)
                .ToListAsync();
        }

        /// <summary>
        /// Helper method to get a username from a user ID
        /// </summary>
        private async Task<string> GetUsernameFromIdAsync(string userId)
        {
            if (int.TryParse(userId, out int id))
            {
                var user = await _context.Workers.FirstOrDefaultAsync(u => u.Id == id);
                return user?.Username ?? "Unknown User";
            }
            
            return "Unknown User";
        }
    }
} 