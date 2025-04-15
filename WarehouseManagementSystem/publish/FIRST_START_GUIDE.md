# Warehouse Management System - User Guide

## Quick Installation Guide

### Prerequisites
Before running the application, you need:
1. Microsoft Windows 10 or later
2. .NET 9.0 Runtime (or later)
3. SQL Server Express

### Installation Steps

#### Easy Installation (Recommended)
1. Run `install.bat` as Administrator
   - This checks prerequisites
   - Sets up the database
   - Creates a desktop shortcut
   - Copies documentation to Documents folder

#### Manual Installation
If the automatic installation doesn't work:

1. Install Prerequisites:
   - .NET 9.0 Runtime: https://dotnet.microsoft.com/download/dotnet/9.0
   - SQL Server Express: https://www.microsoft.com/en-us/sql-server/sql-server-downloads

2. Start SQL Server:
   - Run `check-sql-server.bat` to start SQL Server services

3. Create the database:
   - Open SQL Server Management Studio (or command line)
   - Create a new database called "WarehouseManagement"

4. Start the application:
   - Run `run-app.bat`

## Running the Application

After installation, you can start the application by:
1. Double-clicking the desktop shortcut, OR
2. Running `run-app.bat` from the installation folder

The application will open in your default web browser at http://localhost:5000

## Default Login Credentials
- Username: `admin`
- Password: `Admin@123`

## Main Features

### Inventory Management
- View all inventory items
- Add new items
- Update existing items
- Track stock levels

### Shipment Tracking
- Create inbound and outbound shipments
- Assign items to shipments
- Track shipment status

### User Management
- Create and manage user accounts
- Assign roles (Admin, Manager, Employee)
- Track user activity

### Activity Logging
- View system activity log
- Monitor stock changes
- Track user actions

## Troubleshooting

### Application Won't Start
1. Check if SQL Server is running:
   - Run `check-sql-server.bat`
2. Make sure port 5000 isn't being used by another application
3. Try running as administrator

### Database Connection Issues
1. Verify SQL Server Express is installed correctly
2. Check if SQL Server service is running
3. Make sure the database "WarehouseManagement" exists

### Login Problems
1. Use the default admin account (admin/Admin@123)
2. If password doesn't work, database may need to be reset

## Support
If you encounter persistent issues:
1. Check the detailed error messages
2. Ensure all prerequisites are installed correctly
3. Try reinstalling the application

## System Requirements
- Windows 10 or later
- 4GB RAM minimum
- 1GB free disk space
- SQL Server Express
- .NET 9.0 Runtime 