using WarehouseManagementSystem.Models;

namespace WarehouseManagementSystem.Services
{
    public interface IItemService
    {
        /// <summary>
        /// Generates a unique SKU for a new item
        /// </summary>
        /// <param name="prefix">Optional prefix for the SKU</param>
        /// <returns>A unique SKU string</returns>
        Task<string> GenerateUniqueSKUAsync(string prefix = "SKU");
        
        /// <summary>
        /// Creates a new item with a guaranteed unique SKU
        /// </summary>
        /// <param name="item">The item to create</param>
        /// <returns>The created item with assigned SKU</returns>
        Task<Item> CreateItemAsync(Item item);
        
        /// <summary>
        /// Checks if an item with the specified SKU exists
        /// </summary>
        /// <param name="sku">The SKU to check</param>
        /// <returns>True if the item exists, false otherwise</returns>
        Task<bool> ItemExistsAsync(string sku);
    }
} 