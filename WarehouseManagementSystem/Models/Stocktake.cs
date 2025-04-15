using System;
using System.ComponentModel.DataAnnotations;

namespace WarehouseManagementSystem.Models
{
    public class Stocktake
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public required string Zone { get; set; }

        [Required]
        public required string Shelf { get; set; }

        [Required]
        public required string Counter { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }

        [Required]
        public required string Status { get; set; } = "In Progress"; // "In Progress", "Completed", "Cancelled"

        public string? Notes { get; set; }
    }
} 