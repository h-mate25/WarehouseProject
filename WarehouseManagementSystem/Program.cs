using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using WarehouseManagementSystem.Data;
using WarehouseManagementSystem.Models;
using WarehouseManagementSystem.Services;
using WarehouseManagementSystem.Services.Interfaces;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to listen only on localhost
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenLocalhost(5000);
});

// Add services to the container.
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        // Handle circular references
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        // Use camelCase for JSON property names (JavaScript standard)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Properly serialize enums
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Add authentication services
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options => 
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = Microsoft.AspNetCore.Http.CookieSecurePolicy.None; // Set to Always in production
        options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(1);
    });

// Add password hasher service
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();

// Add item service for SKU generation and management
builder.Services.AddScoped<IItemService, ItemService>();

// Add activity service for activity logging and retrieval
builder.Services.AddScoped<IActivityService, ActivityService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext - Always use SQL Server
builder.Services.AddDbContext<WarehouseContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // Comment out HSTS for HTTP only
    // app.UseHsts();
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // Seed the database for development
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try 
        {
            var context = services.GetRequiredService<WarehouseContext>();
            var passwordHasher = services.GetRequiredService<IPasswordHasher>();
            var logger = services.GetRequiredService<ILogger<Program>>();
            
            logger.LogInformation("Ensuring database exists and is up to date...");
            
            // Ensure database is created and migrations are applied
            context.Database.EnsureCreated();
            
            // Verify connection and database structure
            logger.LogInformation("Checking database connection and structure...");
            bool hasShipments = context.Shipments != null;
            bool hasItems = context.Items != null;
            
            logger.LogInformation($"Database check complete: HasShipments={hasShipments}, HasItems={hasItems}");
            
            // Log entity counts
            logger.LogInformation($"Items count: {context.Items.Count()}");
            logger.LogInformation($"Shipments count: {context.Shipments.Count()}");
            
            // Create a direct admin user with known password if no users exist
            if (!context.Workers.Any())
            {
                logger.LogInformation("No workers found. Creating admin user...");
                var admin = new Worker
                {
                    Id = 1,
                    Username = "admin",
                    PasswordHash = passwordHasher.HashPassword("Admin@123"),
                    Email = "admin@warehouse.com",
                    FullName = "System Administrator",
                    Role = "Admin",
                    Department = "IT",
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                
                context.Workers.Add(admin);
                context.SaveChanges();
                logger.LogInformation("Admin user created successfully");
            }
            
            // Add test shipments if none exist
            if (!context.Shipments.Any())
            {
                logger.LogInformation("No shipments found. Creating test shipments...");
                
                // Create test shipments
                var testShipments = new List<Shipment>
                {
                    new Shipment
                    {
                        Id = "IN20250601001",
                        Type = "Inbound",
                        PartnerName = "ACME Supplies",
                        Status = "Processing",
                        Priority = "Medium",
                        ETA = DateTime.UtcNow.AddDays(3),
                        Notes = "Standard delivery",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    },
                    new Shipment
                    {
                        Id = "OUT20250601001",
                        Type = "Outbound",
                        PartnerName = "XYZ Corporation",
                        Status = "Pending",
                        Priority = "High",
                        ETA = DateTime.UtcNow.AddDays(1),
                        Notes = "Expedited delivery",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    },
                    new Shipment
                    {
                        Id = "IN20250601002",
                        Type = "Inbound",
                        PartnerName = "Global Trading Co.",
                        Status = "In Transit",
                        Priority = "Low",
                        ETA = DateTime.UtcNow.AddDays(5),
                        Notes = "Bulk delivery",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "System"
                    }
                };
                
                context.Shipments.AddRange(testShipments);
                context.SaveChanges();
                
                // Log the shipment creation activities
                foreach (var shipment in testShipments)
                {
                    var activity = new ActivityLog
                    {
                        ActionType = "Created",
                        Description = $"Created test {shipment.Type} shipment {shipment.Id}",
                        ItemSKU = shipment.Id,
                        Timestamp = DateTime.UtcNow,
                        UserId = "System",
                        UserName = "System"
                    };
                    
                    context.ActivityLogs.Add(activity);
                }
                
                context.SaveChanges();
                logger.LogInformation("Test shipments created successfully");
            }
            
            // Add test items if none exist
            if (!context.Items.Any())
            {
                logger.LogInformation("No items found. Creating test items...");
                
                // Create test items
                var testItems = new List<Item>
                {
                    new Item
                    {
                        SKU = "ITEM-1001",
                        Name = "Standard Box",
                        Category = "Packaging",
                        Condition = "New",
                        Location = "Shelf A1",
                        Quantity = 100,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = "System",
                        UpdatedBy = "System"
                    },
                    new Item
                    {
                        SKU = "ITEM-1002",
                        Name = "Protective Foam",
                        Category = "Packaging",
                        Condition = "New",
                        Location = "Shelf A2",
                        Quantity = 50,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = "System",
                        UpdatedBy = "System"
                    },
                    new Item
                    {
                        SKU = "ITEM-2001",
                        Name = "T-Shirt (Medium)",
                        Category = "Apparel",
                        Condition = "New",
                        Location = "Shelf B1",
                        Quantity = 200,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = "System",
                        UpdatedBy = "System"
                    },
                    new Item
                    {
                        SKU = "ITEM-3001",
                        Name = "Coffee Mug",
                        Category = "Kitchenware",
                        Condition = "New",
                        Location = "Shelf C1",
                        Quantity = 75,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = "System",
                        UpdatedBy = "System"
                    }
                };
                
                context.Items.AddRange(testItems);
                context.SaveChanges();
                
                // Log the item creation activities
                foreach (var item in testItems)
                {
                    var activity = new ActivityLog
                    {
                        ActionType = "Add",
                        Description = $"Added test item {item.SKU} - {item.Name}",
                        ItemSKU = item.SKU,
                        Timestamp = DateTime.UtcNow,
                        UserId = "System",
                        UserName = "System"
                    };
                    
                    context.ActivityLogs.Add(activity);
                }
                
                context.SaveChanges();
                logger.LogInformation("Test items created successfully");
            }
            
            // Add test shipment items if none exist
            if (!context.ShipmentItems.Any())
            {
                logger.LogInformation("No shipment items found. Creating test associations...");
                
                // Get existing shipments and items
                var shipments = context.Shipments.ToList();
                var items = context.Items.ToList();
                
                if (shipments.Any() && items.Any())
                {
                    // Create associations between shipments and items
                    var shipmentItems = new List<ShipmentItem>
                    {
                        // Items for first inbound shipment
                        new ShipmentItem
                        {
                            ShipmentId = "IN20250601001",
                            SKU = items[0].SKU, // Standard Box
                            Quantity = 20,
                            Notes = "Handle with care"
                        },
                        new ShipmentItem
                        {
                            ShipmentId = "IN20250601001",
                            SKU = items[1].SKU, // Protective Foam
                            Quantity = 15,
                            Notes = "For packaging electronics"
                        },
                        
                        // Items for outbound shipment
                        new ShipmentItem
                        {
                            ShipmentId = "OUT20250601001",
                            SKU = items[2].SKU, // T-Shirt
                            Quantity = 50,
                            Notes = "Customer order #12345"
                        },
                        new ShipmentItem
                        {
                            ShipmentId = "OUT20250601001",
                            SKU = items[3].SKU, // Coffee Mug
                            Quantity = 25,
                            Notes = "Promotional items"
                        },
                        
                        // Items for second inbound shipment
                        new ShipmentItem
                        {
                            ShipmentId = "IN20250601002",
                            SKU = items[0].SKU, // Standard Box
                            Quantity = 100,
                            Notes = "Bulk order"
                        }
                    };
                    
                    context.ShipmentItems.AddRange(shipmentItems);
                    context.SaveChanges();
                    
                    // Log activity for each new shipment item
                    foreach (var item in shipmentItems)
                    {
                        var shipment = shipments.FirstOrDefault(s => s.Id == item.ShipmentId);
                        var inventoryItem = items.FirstOrDefault(i => i.SKU == item.SKU);
                        
                        if (shipment != null && inventoryItem != null)
                        {
                            var activity = new ActivityLog
                            {
                                ActionType = shipment.Type == "Inbound" ? "Add" : "Remove",
                                Description = $"Added {item.Quantity} {inventoryItem.Name} to {shipment.Type} shipment {shipment.Id}",
                                ItemSKU = item.SKU,
                                Timestamp = DateTime.UtcNow,
                                UserId = "System",
                                UserName = "System"
                            };
                            
                            context.ActivityLogs.Add(activity);
                        }
                    }
                    
                    context.SaveChanges();
                    logger.LogInformation("Test shipment items created successfully");
                }
                else
                {
                    logger.LogWarning("Could not create shipment items: No shipments or items found");
                }
            }
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred during database initialization");
            
            // Display prominent error message
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("===================================================");
            Console.WriteLine("DATABASE CONNECTION ERROR: " + ex.Message);
            Console.WriteLine("===================================================");
            Console.ResetColor();
        }
    }
}

// Comment out HTTPS redirection for HTTP only
// app.UseHttpsRedirection();

// Order is important!
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
