namespace WarehouseManagementSystem.Services.Interfaces
{
    /// <summary>
    /// Interface for formatting and displaying activity data in the UI
    /// </summary>
    public interface IActivity
    {
        /// <summary>
        /// Gets the title of the activity
        /// </summary>
        string GetTitle();
        
        
        /// <summary>
        /// Gets the full description of the activity
        /// </summary>
        string GetDescription();
        
        /// <summary>
        /// Gets the icon class to use for this activity type
        /// </summary>
        string GetIcon();
        
        /// <summary>
        /// Gets a formatted timestamp string
        /// </summary>
        string GetTimestamp();
        
        /// <summary>
        /// Gets the CSS color classes for this activity type
        /// </summary>
        string GetColorClasses();
        
        /// <summary>
        /// Gets a URL link to the related item (if applicable)
        /// </summary>
        string GetItemLink();
    }
} 