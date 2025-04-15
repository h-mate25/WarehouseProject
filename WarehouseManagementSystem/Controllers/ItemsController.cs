using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using WarehouseManagementSystem.Services;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace WarehouseManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class ItemsController : ControllerBase
    {
        private readonly WarehouseContext _context;
        private readonly IItemService _itemService;

        public ItemsController(WarehouseContext context, IItemService itemService)
        {
            _context = context;
            _itemService = itemService;
        }

        // GET: api/Items
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Item>>> GetItems()
        {
            return await _context.Items.ToListAsync();
        }

        // GET: api/Items/5
        [HttpGet("{sku}")]
        public async Task<ActionResult<Item>> GetItem(string sku)
        {
            var item = await _context.Items.FindAsync(sku);

            if (item == null)
            {
                return NotFound();
            }

            return item;
        }

        // PUT: api/Items/5
        [HttpPut("{sku}")]
        public async Task<IActionResult> PutItem(string sku, Item item)
        {
            if (sku != item.SKU)
            {
                return BadRequest();
            }

            item.UpdatedAt = DateTime.Now;
            _context.Entry(item).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _itemService.ItemExistsAsync(sku))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Items
        [HttpPost]
        public async Task<ActionResult<Item>> PostItem(Item item)
        {
            try
            {
                // Use the ItemService to handle the item creation with unique SKU
                var createdItem = await _itemService.CreateItemAsync(item);
                
                // Return a 201 Created response with the created item details
                return CreatedAtAction("GetItem", new { sku = createdItem.SKU }, createdItem);
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.WriteLine($"Error creating item: {ex.Message}");
                
                // Return a more detailed error response
                return StatusCode(500, new { 
                    title = "Error creating item",
                    detail = ex.Message,
                    status = 500
                });
            }
        }

        // DELETE: api/Items/5
        [HttpDelete("{sku}")]
        public async Task<IActionResult> DeleteItem(string sku)
        {
            var item = await _context.Items.FindAsync(sku);
            if (item == null)
            {
                return NotFound();
            }

            _context.Items.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Items/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Item>>> SearchItems([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await _context.Items.ToListAsync();
            }

            return await _context.Items
                .Where(item => 
                    item.SKU.Contains(query) || 
                    item.Name.Contains(query) || 
                    item.Category.Contains(query))
                .ToListAsync();
        }

        // GET: api/Items/low-stock
        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<Item>>> GetLowStockItems([FromQuery] int threshold = 10)
        {
            return await _context.Items
                .Where(item => item.Quantity <= threshold)
                .ToListAsync();
        }
    }
} 