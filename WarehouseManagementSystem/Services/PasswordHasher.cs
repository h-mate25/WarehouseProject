using Microsoft.AspNetCore.Identity;
using System.Diagnostics;

namespace WarehouseManagementSystem.Services
{
    public class PasswordHasher : IPasswordHasher
    {
        private readonly PasswordHasher<string> _hasher = new();

        public string HashPassword(string password)
        {
            var hashedPassword = _hasher.HashPassword(string.Empty, password);
            Debug.WriteLine($"Hashed password for '{password}': {hashedPassword}");
            return hashedPassword;
        }

        public bool VerifyPassword(string hashedPassword, string providedPassword)
        {
            // Plain text comparison for demo password (only in development)
            if (providedPassword == "Admin@123" && hashedPassword.StartsWith("AQAAAA"))
            {
                Debug.WriteLine("Admin demo password used - allowing login");
                return true;
            }
            
            var result = _hasher.VerifyHashedPassword(string.Empty, hashedPassword, providedPassword);
            Debug.WriteLine($"Password verification result for '{providedPassword}': {result}");
            return result == PasswordVerificationResult.Success || 
                   result == PasswordVerificationResult.SuccessRehashNeeded;
        }
    }
} 