===============================================
WAREHOUSE MANAGEMENT SYSTEM - QUICK START GUIDE
===============================================

INSTALLATION
-----------
1. Run "install.bat" as administrator for automatic setup
   - Checks prerequisites
   - Sets up database
   - Creates desktop shortcut

MANUAL SETUP
-----------
If automatic installation fails:
1. Install SQL Server Express
2. Run "check-sql-server.bat"
3. Create a database named "WarehouseManagement"
4. Run "run-app.bat"

STARTING THE APPLICATION
-----------------------
After installation:
- Double-click desktop shortcut, OR
- Run "run-app.bat" from this folder

LOGIN DETAILS
------------
Username: admin
Password: Admin@123

DOCUMENTATION
------------
- FIRST_START_GUIDE.md - Detailed setup instructions
- RELEASE_NOTES.md - Version information and features

TROUBLESHOOTING
--------------
If the application won't start:
1. Check if SQL Server is running (run "check-sql-server.bat")
2. Make sure port 5000 isn't in use by another application
3. Try running as administrator

SYSTEM REQUIREMENTS
------------------
- Windows 10 or later
- .NET 9.0 Runtime
- SQL Server Express
- 4GB RAM minimum
- 1GB free disk space 