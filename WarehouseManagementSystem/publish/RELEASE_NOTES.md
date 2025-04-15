# Warehouse Management System - Release Notes

## Version 1.0.0 (Current Release)

Release Date: 2025-04-15

### Features

- **Inventory Management**
  - Item tracking with unique SKUs
  - Stock level monitoring
  - Category and location organization
  - Barcode support

- **Shipment Processing**
  - Inbound and outbound shipment tracking
  - Priority-based processing
  - ETA monitoring
  - Partner management

- **User Management**
  - Role-based access control
  - Activity logging
  - Secure authentication

- **Dashboard**
  - Real-time inventory overview
  - Recent activity display
  - Stock movement charts
  - Low stock alerts

### Technical Details

- Built on ASP.NET Core 9.0
- SQL Server backend
- Entity Framework Core ORM
- Bootstrap-based responsive UI

### Installation Requirements

- Windows 10 or later
- .NET 9.0 Runtime or later
- SQL Server Express 2019 or later
- 4GB RAM (minimum)
- 1GB free disk space

### Known Issues

- Stock movement chart may show placeholder data on first run
- Activity logs limited to most recent 15 entries on dashboard
- API connection errors if SQL Server is not running

### Planned for Future Releases

- Mobile app support
- Barcode scanning via webcam
- Advanced reporting features
- Integration with shipping providers
- Multi-warehouse support

## Installation Instructions

For detailed installation steps, please refer to the FIRST_START_GUIDE.md file included with this release. 