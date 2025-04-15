using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace WarehouseManagementSystem.Models
{
    public class Shipment
    {
        [Key]
        [Required]
        public required string Id { get; set; }

        [Required]
        public required string Type { get; set; } // Inbound or Outbound

        [Required]
        public required string PartnerName { get; set; }

        public List<ShipmentItem> Items { get; set; } = new();

        [Required]
        public required string Status { get; set; }

        [Required]
        public DateTime ETA { get; set; }

        [Required]
        public required string Priority { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        public string CreatedBy { get; set; } = "System";

        public string CompletedBy { get; set; } = "System";
    }
} 