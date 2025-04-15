using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WarehouseManagementSystem.Models
{
    public class ShipmentItem
    {
        [Required]
        public required string ShipmentId { get; set; }

        [Required]
        public required string SKU { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        public string? Notes { get; set; }

        [ForeignKey("ShipmentId")]
        public Shipment? Shipment { get; set; }
    }
} 