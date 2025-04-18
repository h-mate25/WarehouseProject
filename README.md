# Warehouse Management System

A comprehensive solution for inventory management, shipment tracking, stocktaking, and user management designed to help warehouse operators efficiently manage their operations.

## System Overview

The Warehouse Management System is a web application built with ASP.NET Core that provides:

- **Inventory Management**: Track items with unique SKUs, locations, quantities
- **Shipment Tracking**: Manage inbound and outbound shipments
- **User Management**: Role-based access control (Admin, Manager, Employee)
- **Activity Logging**: Comprehensive audit trail of all system activities
- **Stocktaking**: Inventory reconciliation and auditing

## Technology Stack

- **Framework**: ASP.NET Core (.NET 9.0)
- **Database**: Microsoft SQL Server with Entity Framework Core
- **Authentication**: Cookie-based authentication
- **Frontend**: ASP.NET MVC with Razor views
- **API Documentation**: Swagger/OpenAPI

## Key Features

### Inventory Management
- Unique SKU generation
- Location-based organization
- Stock level monitoring
- Quantity adjustments with audit logging

### Shipment Processing
- Inbound/outbound shipment tracking
- ETA monitoring
- Priority-based processing
- Partner relationship management

### Security
- Role-based authorization
- Password hashing with PBKDF2 (20,000 iterations)
- Activity audit logging
- Secure cookie configuration

## Architecture

The application follows a layered architecture:

- **Presentation Layer**: Razor Views handle UI rendering
- **Application Layer**: Controllers mediate between UI and business logic
- **Domain Layer**: Entities enforce business rules
- **Infrastructure Layer**: EF Core implements repository pattern with SQL Server

## Database Schema

The system uses several key entities:

- **Item**: Inventory items with unique SKUs
- **Shipment**: Inbound or outbound shipments
- **Worker**: System users with different roles
- **ActivityLog**: Tracks user actions and system events
- **Stocktake**: Inventory auditing operations

## Getting Started

### Prerequisites

- .NET 9.0 SDK
- SQL Server (Express or higher)
- Visual Studio 2022 or VS Code

### Setup

1. Clone the repository
```
git clone https://github.com/h-mate25/WarehouseProject.git
```

2. Navigate to the project directory
```
cd WarehouseProject
```

3. Run the setup script
```
.\setup-and-run.bat
```

This will:
- Install required dependencies
- Set up the SQL Server database
- Apply migrations
- Start the application

### Default Credentials

After setup, you can log in with:
- Username: `admin`
- Password: `Admin@123`

## API Configuration

The API server is configured to run on port 5000 locally:

```csharp
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenLocalhost(5000);
});
```

## Contributing

Please read our contribution guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
