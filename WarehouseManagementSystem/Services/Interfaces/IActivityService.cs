using WarehouseManagementSystem.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WarehouseManagementSystem.Services.Interfaces
{
    /// <summary>
    /// Service interface for activity logging and retrieval operations
    /// </summary>
    public interface IActivityService
    {
        /// <summary>
        /// Gets recent activity logs ordered by timestamp
        /// </summary>
        /// <param name="count">Number of logs to retrieve</param>
        /// <returns>Collection of activity logs</returns>
        Task<IEnumerable<ActivityLog>> GetRecentActivitiesAsync(int count = 5);
        
        /// <summary>
        /// Logs a new activity
        /// </summary>
        /// <param name="actionType">Type of action (Add, Remove, Update, Move, etc.)</param>
        /// <param name="description">Human-readable description of the activity</param>
        /// <param name="itemSku">Optional SKU of the related item</param>
        /// <param name="userId">Optional ID of the user who performed the action</param>
        /// <returns>The created activity log</returns>
        Task<ActivityLog> LogActivityAsync(string actionType, string description, string itemSku = null, string userId = null);
        
        /// <summary>
        /// Gets activity logs of a specific type
        /// </summary>
        /// <param name="actionType">Type of action to filter by</param>
        /// <param name="count">Number of logs to retrieve</param>
        /// <returns>Collection of activity logs</returns>
        Task<IEnumerable<ActivityLog>> GetActivitiesByTypeAsync(string actionType, int count = 10);
        
        /// <summary>
        /// Gets activity logs related to a specific item
        /// </summary>
        /// <param name="itemSku">SKU of the item</param>
        /// <param name="count">Number of logs to retrieve</param>
        /// <returns>Collection of activity logs</returns>
        Task<IEnumerable<ActivityLog>> GetActivitiesByItemAsync(string itemSku, int count = 10);
        
        /// <summary>
        /// Gets activity logs performed by a specific user
        /// </summary>
        /// <param name="userId">ID of the user</param>
        /// <param name="count">Number of logs to retrieve</param>
        /// <returns>Collection of activity logs</returns>
        Task<IEnumerable<ActivityLog>> GetActivitiesByUserAsync(string userId, int count = 10);
    }
} 