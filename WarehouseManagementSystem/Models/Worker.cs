using System.ComponentModel.DataAnnotations;

namespace WarehouseManagementSystem.Models
{
    public class Worker
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public required string Username { get; set; }

        [Required]
        public required string PasswordHash { get; set; }

        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [StringLength(100)]
        public required string FullName { get; set; }

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        [Required]
        public required string Role { get; set; } = "Employee"; // Admin, Manager, Employee

        public string? Department { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLogin { get; set; }

        public bool IsActive { get; set; } = true;
    }
} 