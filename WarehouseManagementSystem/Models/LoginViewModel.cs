using System.ComponentModel.DataAnnotations;

namespace WarehouseManagementSystem.Models
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "Username is required")]
        public required string Username { get; set; }
        
        [Required(ErrorMessage = "Password is required")]
        [DataType(DataType.Password)]
        public required string Password { get; set; }
        
        public bool RememberMe { get; set; }
        
        public string? ReturnUrl { get; set; }
    }
} 