using System;
using System.ComponentModel.DataAnnotations;
using WarehouseManagementSystem.Services.Interfaces;

namespace WarehouseManagementSystem.Models
{
    public class ActivityLog : IActivity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public required string ActionType { get; set; } // "Add", "Remove", "Update", "Move", "Login"

        [Required]
        public required string Description { get; set; }

        public string? ItemSKU { get; set; }

        public string? UserId { get; set; }

        public string? UserName { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.Now;

        // IActivity implementation
        public string GetTitle()
        {
            return Description.Split(' ')[0]; // Get the first word as a short title
        }

        public string GetDescription()
        {
            return Description;
        }

        public string GetIcon()
        {
            return GetIconClass();
        }

        public string GetTimestamp()
        {
            // Format relative timestamp
            var now = DateTime.Now;
            var diff = now - Timestamp;

            if (diff.TotalSeconds < 60)
                return "Just now";

            if (diff.TotalMinutes < 60)
                return $"{(int)diff.TotalMinutes} minute{(diff.TotalMinutes >= 2 ? "s" : "")} ago";

            if (diff.TotalHours < 24)
                return $"{(int)diff.TotalHours} hour{(diff.TotalHours >= 2 ? "s" : "")} ago";

            if (diff.TotalDays < 7)
                return $"{(int)diff.TotalDays} day{(diff.TotalDays >= 2 ? "s" : "")} ago";

            if (diff.TotalDays < 30)
            {
                int weeks = (int)(diff.TotalDays / 7);
                return $"{weeks} week{(weeks >= 2 ? "s" : "")} ago";
            }

            return Timestamp.ToString("MMM d, yyyy");
        }

        public string GetColorClasses()
        {
            return $"{GetBgColorClass()} {GetTextColorClass()}";
        }

        public string GetItemLink()
        {
            return !string.IsNullOrEmpty(ItemSKU) ? $"/Items/Details/{ItemSKU}" : "#";
        }

        // Helper method to get appropriate icon class
        public string GetIconClass()
        {
            return ActionType.ToLower() switch
            {
                "add" => "ri-add-line",
                "remove" => "ri-subtract-line",
                "update" => "ri-edit-line",
                "move" => "ri-arrow-left-right-line",
                "login" => "ri-login-box-line",
                "logout" => "ri-logout-box-line",
                _ => "ri-information-line"
            };
        }

        // Helper method to get background color class
        public string GetBgColorClass()
        {
            return ActionType.ToLower() switch
            {
                "add" => "bg-blue-100",
                "remove" => "bg-red-100",
                "update" => "bg-yellow-100",
                "move" => "bg-green-100",
                "login" => "bg-purple-100",
                "logout" => "bg-gray-100",
                _ => "bg-gray-100"
            };
        }

        // Helper method to get text color class
        public string GetTextColorClass()
        {
            return ActionType.ToLower() switch
            {
                "add" => "text-blue-600",
                "remove" => "text-red-600",
                "update" => "text-yellow-600",
                "move" => "text-green-600",
                "login" => "text-purple-600",
                "logout" => "text-gray-600",
                _ => "text-gray-600"
            };
        }
    }
} 