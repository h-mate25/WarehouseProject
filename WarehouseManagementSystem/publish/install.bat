@echo off
setlocal enabledelayedexpansion

echo ===== Warehouse Management System - Installation =====
echo.

REM Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator".
    pause
    exit /b 1
)

REM Check if dotnet runtime is installed
dotnet --list-runtimes | findstr "Microsoft.AspNetCore.App" >nul
if %ERRORLEVEL% NEQ 0 (
    echo .NET Runtime not found.
    echo.
    
    echo Please download and install the .NET 9.0 Runtime:
    echo 1. Go to: https://dotnet.microsoft.com/download/dotnet/9.0
    echo 2. Click on "Download .NET Runtime" button
    echo 3. Run the installer and follow the prompts
    echo 4. After installation completes, close this window and run this batch file again.
    echo.
    
    REM Open the download page in the default browser
    start "" "https://dotnet.microsoft.com/download/dotnet/9.0"
    
    pause
    exit /b 1
)

echo .NET Runtime found.
echo.

REM Check SQL Server
call check-sql-server.bat

REM Create database if it doesn't exist
echo.
echo Setting up database...
sqlcmd -S localhost\SQLEXPRESS -Q "IF NOT EXISTS(SELECT * FROM sys.databases WHERE name='WarehouseManagement') CREATE DATABASE WarehouseManagement" -b
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not create database. Application may not function correctly.
    echo Make sure SQL Server is running and accessible.
) else (
    echo Database setup completed successfully.
)

REM Create desktop shortcut
echo.
echo Creating desktop shortcut...
set SCRIPT="%TEMP%\CreateShortcut.vbs"
set DESKTOP_PATH=%USERPROFILE%\Desktop

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%DESKTOP_PATH%\Warehouse Management System.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0run-app.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "Launch Warehouse Management System" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0WarehouseManagementSystem.exe" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

if exist "%DESKTOP_PATH%\Warehouse Management System.lnk" (
    echo Desktop shortcut created successfully.
) else (
    echo Failed to create desktop shortcut.
)

REM Copy documentation to a more accessible location
copy "FIRST_START_GUIDE.md" "%USERPROFILE%\Documents\Warehouse Management System Guide.md" >nul 2>&1

echo.
echo ===== Installation Complete =====
echo.
echo You can now:
echo 1. Start the application from the desktop shortcut
echo 2. Run run-app.bat directly from this folder
echo.
echo Documentation has been copied to your Documents folder.
echo.

pause 