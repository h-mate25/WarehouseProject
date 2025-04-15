@echo off
echo ===== Warehouse Management System - Setup and Run =====
echo.

REM Check if dotnet is installed
dotnet --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo .NET SDK not found.
    echo.
    
    echo Please download and install the .NET 9.0 SDK:
    echo 1. Go to: https://dotnet.microsoft.com/download/dotnet/9.0
    echo 2. Click on "Download .NET SDK x64" button
    echo 3. Run the installer and follow the prompts
    echo 4. After installation completes, close this window and run this batch file again.
    echo.
    
    REM Open the download page in the default browser
    start "" "https://dotnet.microsoft.com/download/dotnet/9.0"
    
    pause
    exit
)

echo .NET SDK found: 
dotnet --version
echo.

REM Create proper NuGet.Config in the project directory
echo Setting up NuGet configuration...
    
REM Create NuGet.Config with proper sources
if not exist "WarehouseManagementSystem\NuGet.Config" (
    echo ^<?xml version="1.0" encoding="utf-8"?^> > WarehouseManagementSystem\NuGet.Config
    echo ^<configuration^> >> WarehouseManagementSystem\NuGet.Config
    echo   ^<packageSources^> >> WarehouseManagementSystem\NuGet.Config
    echo     ^<add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" /^> >> WarehouseManagementSystem\NuGet.Config
    echo     ^<add key="dotnet-preview" value="https://pkgs.dev.azure.com/dnceng/public/_packaging/dotnet9/nuget/v3/index.json" /^> >> WarehouseManagementSystem\NuGet.Config
    echo   ^</packageSources^> >> WarehouseManagementSystem\NuGet.Config
    echo ^</configuration^> >> WarehouseManagementSystem\NuGet.Config

    echo NuGet configuration created successfully.
)

REM Create global.json if it doesn't exist
if not exist "global.json" (
    echo Creating global.json to fix SDK version...
    echo { > global.json
    echo   "sdk": { >> global.json
    echo     "version": "9.0.202", >> global.json
    echo     "rollForward": "latestFeature" >> global.json
    echo   } >> global.json
    echo } >> global.json
)

echo.
echo Navigating to project directory...
cd WarehouseManagementSystem

echo Cleaning previous build artifacts...
dotnet clean
echo.

echo Restoring NuGet packages...
dotnet nuget locals all --clear
dotnet restore --force
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Package restore failed. Trying fallback method...
    echo.
    
    REM Try to add sources directly
    dotnet nuget add source https://api.nuget.org/v3/index.json --name nuget.org
    dotnet nuget add source https://pkgs.dev.azure.com/dnceng/public/_packaging/dotnet9/nuget/v3/index.json --name dotnet-preview
    
    echo Restoring packages with fallback sources...
    dotnet restore 
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Package restore failed again. Please check your internet connection.
        echo.
        cd ..
        pause
        exit /b %ERRORLEVEL%
    )
)

echo.
echo Building the application...
dotnet build --no-restore
if %ERRORLEVEL% NEQ 0 (
    echo Failed to build the application. Please check the errors above.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo Running the application...
echo The application will be available at: http://localhost:5000
echo Press Ctrl+C to stop the application.
echo.

REM Run the application
dotnet run --no-build

echo.
if %ERRORLEVEL% NEQ 0 (
    echo Application failed to start or terminated with errors.
) else (
    echo Application stopped successfully.
)

cd ..

REM Create the quick start file if it doesn't exist
if not exist "run-app.bat" (
    echo Creating quick start file for future use...
    
    echo @echo off > run-app.bat
    echo echo ===== Warehouse Management System - Quick Start ===== >> run-app.bat
    echo echo. >> run-app.bat
    echo echo Starting application... >> run-app.bat
    echo echo The application will be available at: http://localhost:5000 >> run-app.bat
    echo echo Press Ctrl+C to stop the application. >> run-app.bat
    echo echo. >> run-app.bat
    echo cd WarehouseManagementSystem >> run-app.bat
    echo dotnet run >> run-app.bat
    echo cd .. >> run-app.bat
    echo pause >> run-app.bat
    
    echo Quick start file created.
    echo For future use, just run 'run-app.bat' to start the application.
)

pause 