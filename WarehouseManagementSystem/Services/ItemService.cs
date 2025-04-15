using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;

namespace WarehouseManagementSystem.Services
{
    public class ItemService : IItemService
    {
        private readonly WarehouseContext _context;
        private readonly Random _random = new Random();

        public ItemService(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateUniqueSKUAsync(string prefix = "SKU")
        {
            // Keep generating SKUs until we find one that doesn't exist
            string sku;
            do
            {
                // Generate a random 4-digit number
                int randomNumber = _random.Next(1000, 10000);
                
                // Add a timestamp component for extra uniqueness (last 3 digits of ticks)
                string timeComponent = (DateTime.Now.Ticks % 1000).ToString("D3");
                
                // Combine prefix, random number, and time component
                sku = $"{prefix}-{randomNumber}-{timeComponent}";
            }
            while (await ItemExistsAsync(sku));

            return sku;
        }

        public async Task<Item> CreateItemAsync(Item item)
        {
            // Special handling for AUTO-GENERATE value or empty/null SKUs
            if (string.IsNullOrWhiteSpace(item.SKU) || item.SKU == "AUTO-GENERATE")
            {
                item.SKU = await GenerateUniqueSKUAsync();
            }
            // If SKU is already provided, check if it exists and modify if necessary
            else if (await ItemExistsAsync(item.SKU))
            {
                // Append timestamp to make it unique
                string timeComponent = (DateTime.Now.Ticks % 10000).ToString("D4");
                item.SKU = $"{item.SKU}-{timeComponent}";
            }
            
            item.CreatedAt = DateTime.Now;
            item.UpdatedAt = DateTime.Now;
            
            _context.Items.Add(item);
            await _context.SaveChangesAsync();
            
            return item;
        }

        public async Task<bool> ItemExistsAsync(string sku)
        {
            return await _context.Items.AnyAsync(i => i.SKU == sku);
        }
    }
} 