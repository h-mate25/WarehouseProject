@echo off
echo ===== Warehouse Management System Launcher =====
echo.

REM Step 1: Try to kill by process name first
echo Checking for existing WarehouseManagementSystem processes...
taskkill /f /im WarehouseManagementSystem.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Successfully terminated existing processes.
    timeout /t 2 /nobreak >nul
) else (
    echo No processes found by name, checking for locks...
)

REM Step 2: Check if the build output directory exists
set EXE_PATH=bin\Debug\net9.0\WarehouseManagementSystem.exe
if exist %EXE_PATH% (
    echo Application executable exists, checking for running instances...
    
    REM Find any process locking the executable file (requires handle.exe from Sysinternals)
    REM Uncomment these lines if you have handle.exe available
    REM for /f "tokens=3" %%a in ('handle %EXE_PATH% ^| findstr /i "WarehouseManagementSystem.exe"') do (
    REM     echo Found process with PID: %%a locking the file
    REM     taskkill /f /pid %%a
    REM     timeout /t 2 /nobreak >nul
    REM )
    
    echo.
    echo Starting application with --no-build to avoid lock issues...
    dotnet run --no-build
) else (
    echo Application executable not found, performing full build...
    dotnet run
)

echo.
if %ERRORLEVEL% NEQ 0 (
    echo Application failed to start or terminated with errors.
    echo.
    echo Try the following troubleshooting steps:
    echo 1. Restart your computer to release any locked files
    echo 2. Run 'dotnet clean' to clean the project outputs
    echo 3. Try running with 'dotnet run --no-build' after building once
) else (
    echo Application stopped.
)

pause 