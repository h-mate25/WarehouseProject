using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace WarehouseManagementSystem.Controllers
{
    [Authorize]
    public class ShipmentsController : Controller
    {
        private readonly WarehouseContext _context;

        public ShipmentsController(WarehouseContext context)
        {
            _context = context;
        }

        // GET: Shipments
        public async Task<IActionResult> Index(string type = "", string status = "")
        {
            // Apply filters if provided
            var query = _context.Shipments.AsQueryable();
            
            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(s => s.Type.ToLower() == type.ToLower());
                ViewData["TypeFilter"] = type;
            }
            
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(s => s.Status.ToLower() == status.ToLower());
                ViewData["StatusFilter"] = status;
            }
            
            var shipments = await query.ToListAsync();
            return View(shipments);
        }

        // GET: Shipments/Details/5
        public async Task<IActionResult> Details(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var shipment = await _context.Shipments
                .Include(s => s.Items)
                .FirstOrDefaultAsync(m => m.Id == id);
                
            if (shipment == null)
            {
                return NotFound();
            }

            return View(shipment);
        }

        // GET: Shipments/Create
        public IActionResult Create(string type = "")
        {
            if (!string.IsNullOrEmpty(type))
            {
                ViewData["ShipmentType"] = type;
            }
            return View();
        }

        // POST: Shipments/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Shipment shipment)
        {
            if (ModelState.IsValid)
            {
                shipment.CreatedAt = DateTime.Now;
                shipment.CreatedBy = User.Identity.Name ?? "System";
                
                _context.Add(shipment);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(shipment);
        }

        // GET: Shipments/Edit/5
        public async Task<IActionResult> Edit(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var shipment = await _context.Shipments
                .Include(s => s.Items)
                .FirstOrDefaultAsync(m => m.Id == id);
                
            if (shipment == null)
            {
                return NotFound();
            }
            
            return View(shipment);
        }

        // POST: Shipments/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(string id, Shipment shipment)
        {
            if (id != shipment.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    // Handle completion status changes
                    var existingShipment = await _context.Shipments.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
                    if (existingShipment != null && existingShipment.Status != "Completed" && shipment.Status == "Completed")
                    {
                        shipment.CompletedAt = DateTime.Now;
                        shipment.CompletedBy = User.Identity.Name ?? "System";
                    }
                    else if (existingShipment != null)
                    {
                        // Preserve completion info if moving back from completed
                        shipment.CompletedAt = existingShipment.CompletedAt;
                        shipment.CompletedBy = existingShipment.CompletedBy;
                    }
                    
                    _context.Update(shipment);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ShipmentExists(shipment.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(shipment);
        }

        // GET: Shipments/Delete/5
        public async Task<IActionResult> Delete(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var shipment = await _context.Shipments
                .FirstOrDefaultAsync(m => m.Id == id);
                
            if (shipment == null)
            {
                return NotFound();
            }

            return View(shipment);
        }

        // POST: Shipments/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(string id)
        {
            var shipment = await _context.Shipments.FindAsync(id);
            if (shipment != null)
            {
                _context.Shipments.Remove(shipment);
                await _context.SaveChangesAsync();
            }
            
            return RedirectToAction(nameof(Index));
        }

        private bool ShipmentExists(string id)
        {
            return _context.Shipments.Any(e => e.Id == id);
        }
        
        // API ENDPOINTS
        
        // GET: api/Shipments
        [HttpGet]
        [Route("api/[controller]")]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipments()
        {
            return await _context.Shipments.ToListAsync();
        }

        // GET: api/Shipments/5
        [HttpGet]
        [Route("api/[controller]/{id}")]
        public async Task<ActionResult<Shipment>> GetShipment(string id)
        {
            var shipment = await _context.Shipments
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (shipment == null)
            {
                return NotFound();
            }

            return shipment;
        }

        // GET: api/Shipments/type/inbound
        [HttpGet]
        [Route("api/[controller]/type/{type}")]
        public async Task<ActionResult<IEnumerable<Shipment>>> GetShipmentsByType(string type)
        {
            return await _context.Shipments
                .Where(s => s.Type.ToLower() == type.ToLower())
                .ToListAsync();
        }

        // PUT: api/Shipments/5
        [HttpPut]
        [Route("api/[controller]/{id}")]
        public async Task<IActionResult> PutShipment(string id, Shipment shipment)
        {
            if (id != shipment.Id)
            {
                return BadRequest();
            }

            _context.Entry(shipment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ShipmentExists(id))
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

        // POST: api/Shipments
        [HttpPost]
        [Route("api/[controller]")]
        public async Task<ActionResult<Shipment>> PostShipment(Shipment shipment)
        {
            shipment.CreatedAt = DateTime.Now;
            shipment.CreatedBy = User.Identity?.Name ?? "System";
            
            _context.Shipments.Add(shipment);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (ShipmentExists(shipment.Id))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetShipment", new { id = shipment.Id }, shipment);
        }

        // DELETE: api/Shipments/5
        [HttpDelete]
        [Route("api/[controller]/{id}")]
        public async Task<IActionResult> DeleteShipmentAPI(string id)
        {
            var shipment = await _context.Shipments.FindAsync(id);
            if (shipment == null)
            {
                return NotFound();
            }

            _context.Shipments.Remove(shipment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
} 