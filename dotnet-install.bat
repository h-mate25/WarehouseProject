@echo off
echo ===== .NET SDK Installation Helper =====
echo.

REM Check if .NET SDK is already installed
where dotnet >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo .NET SDK is already installed.
    dotnet --info | findstr "Version"
    echo.
    set /p CONTINUE=Do you want to install/update .NET SDK anyway? (Y/N): 
    if /i not "%CONTINUE%"=="Y" goto :END
)

echo.
echo Downloading .NET SDK installer...
echo.

REM Create a temp directory
set TEMP_DIR=%TEMP%\dotnet-install
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM Download the installer script
curl -L -o "%TEMP_DIR%\dotnet-install.ps1" https://dot.net/v1/dotnet-install.ps1
if %ERRORLEVEL% NEQ 0 (
    echo Failed to download the .NET installer script.
    goto :ERROR
)

echo.
echo Installing .NET SDK...
echo.

REM Run the installer with PowerShell
powershell -ExecutionPolicy Bypass -File "%TEMP_DIR%\dotnet-install.ps1" -Channel LTS
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install .NET SDK.
    goto :ERROR
)

REM Refresh environment variables
call refreshenv 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Note: You may need to restart your command prompt for changes to take effect.
)

echo.
echo Verifying installation...
where dotnet >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo .NET SDK was installed successfully.
    dotnet --info | findstr "Version"
) else (
    echo .NET SDK installation may have succeeded, but 'dotnet' command not found in PATH.
    echo You may need to restart your command prompt or add the installation path to your PATH environment variable.
)

goto :END

:ERROR
echo.
echo Installation failed. Please try the following:
echo 1. Visit https://dotnet.microsoft.com/download to download and install manually
echo 2. Ensure you have administrator privileges
echo 3. Check your internet connection
echo.

:END
echo.
echo .NET SDK installation process completed.
pause 