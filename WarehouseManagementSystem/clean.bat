@echo off
echo ===== Warehouse Management System Cleanup =====
echo.

REM Kill any running application instances
echo Stopping any running application instances...
taskkill /f /im WarehouseManagementSystem.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Successfully terminated running instances.
) else (
    echo No running instances found or already terminated.
)

REM Wait for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Clean the project outputs
echo Cleaning project outputs...
dotnet clean

REM Remove specific directories to ensure a clean state
echo Removing build directories...

if exist bin\ (
    echo Removing bin directory...
    rmdir /s /q bin 2>nul
    if exist bin\ (
        echo Some files in bin directory could not be removed.
        echo They may be locked by another process.
    ) else (
        echo Successfully removed bin directory.
    )
)

if exist obj\ (
    echo Removing obj directory...
    rmdir /s /q obj 2>nul
    if exist obj\ (
        echo Some files in obj directory could not be removed.
        echo They may be locked by another process.
    ) else (
        echo Successfully removed obj directory.
    )
)

echo.
echo Project cleanup completed.
echo You can now rebuild the project with 'dotnet build' or 'dotnet run'
echo.

pause 