# Warehouse Management System - First Start Guide

## Prerequisites
Before starting the application, ensure you have the following installed:
1. .NET 9.0 SDK
2. SQL Server Express

## Installation Steps

### 1. Install .NET 9.0 SDK
If you haven't installed the .NET SDK yet:
1. Download the .NET 9.0 SDK from: https://dotnet.microsoft.com/download/dotnet/9.0
2. Run the installer and follow the prompts
3. Verify installation by opening a command prompt and typing: `dotnet --version`

### 2. Install SQL Server Express
1. Download SQL Server Express from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Choose "Express" edition
3. Run the installer and select "Basic" installation type
4. Make note of the instance name (usually "SQLEXPRESS")

### 3. Initial Setup
1. Run `check-sql-server.bat` to ensure SQL Server is running
2. Run `setup-and-run.bat` to:
   - Set up NuGet configuration
   - Restore packages
   - Build the application
   - Start the application

## Running the Application

### First Time Setup
1. Double-click `setup-and-run.bat`
   - This will:
     - Check for .NET SDK
     - Set up NuGet configuration
     - Restore packages
     - Build the application
     - Start the application

### Subsequent Runs
For future use, you can simply:
1. Double-click `run-app.bat` (created after first run)
   - This will start the application directly

## Accessing the Application
- The application will be available at: http://localhost:5137
- Use Ctrl+C in the command window to stop the application

## Troubleshooting

### Common Issues

1. **SQL Server Connection Error**
   - Run `check-sql-server.bat` to verify SQL Server is running
   - Make sure SQL Server Express is installed correctly

2. **Package Restore Errors**
   - Delete the `bin` and `obj` folders
   - Run `setup-and-run.bat` again

3. **.NET SDK Not Found**
   - Download and install the .NET 9.0 SDK
   - Restart your computer
   - Run `setup-and-run.bat` again

## Support
If you encounter any issues:
1. Check the error messages in the command window
2. Verify all prerequisites are installed correctly
3. Try running the setup scripts again

## Notes
- The application requires an active internet connection for the first setup
- Make sure to run all batch files as administrator if you encounter permission issues
- Keep SQL Server running while using the application 