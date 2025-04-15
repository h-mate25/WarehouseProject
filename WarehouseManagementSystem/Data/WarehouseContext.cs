using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Models;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace WarehouseManagementSystem.Data
{
    public class WarehouseContext : DbContext
    {
        public WarehouseContext(DbContextOptions<WarehouseContext> options)
            : base(options)
        {
        }

        public DbSet<Item> Items { get; set; }
        public DbSet<Shipment> Shipments { get; set; }
        public DbSet<ShipmentItem> ShipmentItems { get; set; }
        public DbSet<Stocktake> Stocktakes { get; set; }
        public DbSet<Worker> Workers { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<WarehouseTask> Tasks { get; set; }
        
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(warnings => 
                warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
            
            base.OnConfiguring(optionsBuilder);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure relationships and constraints here if needed
            
            // Configure ShipmentItem with composite key
            modelBuilder.Entity<ShipmentItem>()
                .HasKey(si => new { si.ShipmentId, si.SKU });
                
            modelBuilder.Entity<ShipmentItem>()
                .HasOne(si => si.Shipment)
                .WithMany(s => s.Items)
                .HasForeignKey(si => si.ShipmentId);
            
            // Configure Worker model
            modelBuilder.Entity<Worker>()
                .HasIndex(w => w.Username)
                .IsUnique();
                
            modelBuilder.Entity<Worker>()
                .HasIndex(w => w.Email)
                .IsUnique();
            
            // Seed admin user for development
            modelBuilder.Entity<Worker>().HasData(
                new Worker
                {
                    Id = 1,
                    Username = "admin",
                    
                    // Updated password hash for "Admin@123"
                    PasswordHash = "AQAAAAIAAYagAAAAECCSbGm+Pv6mxIBm7Wy3D0Aoc5IfmS1lU3L1CqjuCsmx/k3evvgbCOqeOL3qVRMcIA==",
                    Email = "admin@warehouse.com",
                    FullName = "System Administrator",
                    Role = "Admin",
                    Department = "IT",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                }
            );
        }
    }
} 