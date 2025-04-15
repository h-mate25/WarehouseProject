using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;

namespace WarehouseManagementSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StocktakesController : ControllerBase
    {
        private readonly WarehouseContext _context;

        public StocktakesController(WarehouseContext context)
        {
            _context = context;
        }

        // GET: api/Stocktakes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Stocktake>>> GetStocktakes()
        {
            return await _context.Stocktakes.ToListAsync();
        }

        // GET: api/Stocktakes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Stocktake>> GetStocktake(int id)
        {
            var stocktake = await _context.Stocktakes.FindAsync(id);

            if (stocktake == null)
            {
                return NotFound();
            }

            return stocktake;
        }

        // PUT: api/Stocktakes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStocktake(int id, Stocktake stocktake)
        {
            if (id != stocktake.Id)
            {
                return BadRequest();
            }

            _context.Entry(stocktake).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StocktakeExists(id))
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

        // POST: api/Stocktakes
        [HttpPost]
        public async Task<ActionResult<Stocktake>> PostStocktake(Stocktake stocktake)
        {
            stocktake.StartedAt = DateTime.Now;
            stocktake.Status = "In Progress";
            _context.Stocktakes.Add(stocktake);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetStocktake", new { id = stocktake.Id }, stocktake);
        }

        // POST: api/Stocktakes/5/complete
        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteStocktake(int id)
        {
            var stocktake = await _context.Stocktakes.FindAsync(id);
            if (stocktake == null)
            {
                return NotFound();
            }

            stocktake.Status = "Completed";
            stocktake.CompletedAt = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StocktakeExists(id))
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

        // DELETE: api/Stocktakes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStocktake(int id)
        {
            var stocktake = await _context.Stocktakes.FindAsync(id);
            if (stocktake == null)
            {
                return NotFound();
            }

            _context.Stocktakes.Remove(stocktake);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool StocktakeExists(int id)
        {
            return _context.Stocktakes.Any(e => e.Id == id);
        }
    }
} 