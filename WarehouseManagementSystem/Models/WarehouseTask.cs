using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WarehouseManagementSystem.Models
{
    public class WarehouseTask
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }
        
        [Required]
        public DateTime UpdatedAt { get; set; }

        public DateTime? CompletedAt { get; set; }
        
        // Adding alias property for CompletionDate that points to CompletedAt
        public DateTime? CompletionDate 
        { 
            get { return CompletedAt; }
            set { CompletedAt = value; }
        }

        [Required]
        public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed, Overdue

        [Required]
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent

        [StringLength(50)]
        public string Category { get; set; } = "General"; // General, Inventory, Shipping, Receiving, Maintenance

        [StringLength(50)]
        public string AssignedTo { get; set; }

        public bool IsCompleted { get; set; } = false;

        // Navigation properties if needed for related entities
        public string RelatedItemSKU { get; set; }
        
        public int? RelatedShipmentId { get; set; }
    }
} 