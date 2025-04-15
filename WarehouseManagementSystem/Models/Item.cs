using System;
using System.ComponentModel.DataAnnotations;

namespace WarehouseManagementSystem.Models
{
    public class Item
    {
        [Key]
        [Required]
        public required string SKU { get; set; }

        [Required]
        public required string Name { get; set; }

        [Required]
        public required string Category { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        public required string Location { get; set; }

        [Required]
        public required string Condition { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public string CreatedBy { get; set; } = "System";

        public string UpdatedBy { get; set; } = "System";
    }
} 