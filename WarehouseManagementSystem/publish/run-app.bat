@echo off
echo ===== Warehouse Management System - Quick Start =====
echo.

REM Check SQL Server first
call check-sql-server.bat

echo.
echo Starting application...
echo The application will be available at: http://localhost:5000
echo Press Ctrl+C to stop the application.
echo.

REM Start the application
start "" http://localhost:5000
WarehouseManagementSystem.exe

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Application exited with error code: %ERRORLEVEL%
    echo.
    echo Troubleshooting steps:
    echo 1. Make sure SQL Server is running (check-sql-server.bat)
    echo 2. Check if another application is using port 5000
    echo 3. Try running as administrator
    echo.
)

pause 