using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WarehouseManagementSystem.Models;
using System.Collections.Concurrent;

namespace WarehouseManagementSystem.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ShipmentsController : ControllerBase
    {
        private static readonly ConcurrentDictionary<string, Shipment> _shipments = new();
        private readonly ILogger<ShipmentsController> _logger;

        public ShipmentsController(ILogger<ShipmentsController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Shipment>> GetShipments()
        {
            return Ok(_shipments.Values);
        }

        [HttpGet("{id}")]
        public ActionResult<Shipment> GetShipment(string id)
        {
            if (_shipments.TryGetValue(id, out var shipment))
            {
                return Ok(shipment);
            }

            return NotFound();
        }

        [HttpPost]
        public ActionResult<Shipment> CreateShipment(Shipment shipment)
        {
            if (_shipments.ContainsKey(shipment.Id))
            {
                return Conflict($"Shipment with ID {shipment.Id} already exists.");
            }

            shipment.CreatedAt = DateTime.UtcNow;
            shipment.CreatedBy = "System"; // TODO: Get from authentication

            _shipments.TryAdd(shipment.Id, shipment);
            _logger.LogInformation("Created shipment with ID: {ID}", shipment.Id);

            return CreatedAtAction(nameof(GetShipment), new { id = shipment.Id }, shipment);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateShipment(string id, Shipment shipment)
        {
            if (id != shipment.Id)
            {
                return BadRequest("ID mismatch");
            }

            if (!_shipments.ContainsKey(id))
            {
                return NotFound();
            }

            var existingShipment = _shipments[id];
            shipment.CreatedAt = existingShipment.CreatedAt;
            shipment.CreatedBy = existingShipment.CreatedBy;

            if (shipment.Status == "Completed" && existingShipment.Status != "Completed")
            {
                shipment.CompletedAt = DateTime.UtcNow;
                shipment.CompletedBy = "System"; // TODO: Get from authentication
            }

            _shipments.TryUpdate(id, shipment, existingShipment);
            _logger.LogInformation("Updated shipment with ID: {ID}", id);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteShipment(string id)
        {
            if (!_shipments.ContainsKey(id))
            {
                return NotFound();
            }

            _shipments.TryRemove(id, out _);
            _logger.LogInformation("Deleted shipment with ID: {ID}", id);

            return NoContent();
        }

        [HttpGet("search")]
        public ActionResult<IEnumerable<Shipment>> SearchShipments([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok(_shipments.Values);
            }

            var results = _shipments.Values.Where(shipment =>
                shipment.Id.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                shipment.PartnerName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                shipment.Type.Contains(query, StringComparison.OrdinalIgnoreCase)
            );

            return Ok(results);
        }

        [HttpGet("status/{status}")]
        public ActionResult<IEnumerable<Shipment>> GetShipmentsByStatus(string status)
        {
            var shipments = _shipments.Values.Where(s => s.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
            return Ok(shipments);
        }

        [HttpGet("type/{type}")]
        public ActionResult<IEnumerable<Shipment>> GetShipmentsByType(string type)
        {
            var shipments = _shipments.Values.Where(s => s.Type.Equals(type, StringComparison.OrdinalIgnoreCase));
            return Ok(shipments);
        }

        [HttpGet("priority/{priority}")]
        public ActionResult<IEnumerable<Shipment>> GetShipmentsByPriority(string priority)
        {
            var shipments = _shipments.Values.Where(s => s.Priority.Equals(priority, StringComparison.OrdinalIgnoreCase));
            return Ok(shipments);
        }

        [HttpGet("partner/{partnerName}")]
        public ActionResult<IEnumerable<Shipment>> GetShipmentsByPartner(string partnerName)
        {
            var shipments = _shipments.Values.Where(s => 
                s.PartnerName.Contains(partnerName, StringComparison.OrdinalIgnoreCase));
            return Ok(shipments);
        }
    }
} 