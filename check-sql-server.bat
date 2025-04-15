@echo off
echo ===== SQL Server Status Check =====
echo.

REM Check if SQL Server service is running
sc query "MSSQL$SQLEXPRESS" | find "RUNNING" > nul
if %ERRORLEVEL% EQU 0 (
    echo SQL Server (SQLEXPRESS) is already running.
) else (
    echo SQL Server (SQLEXPRESS) is not running. Attempting to start...
    net start "MSSQL$SQLEXPRESS"
    if %ERRORLEVEL% EQU 0 (
        echo SQL Server (SQLEXPRESS) started successfully.
    ) else (
        echo Failed to start SQL Server (SQLEXPRESS).
        echo Please check if SQL Server is installed correctly.
        echo You can download SQL Server Express from:
        echo https://www.microsoft.com/en-us/sql-server/sql-server-downloads
    )
)

echo.
echo Checking SQL Server Browser service...
sc query "SQLBrowser" | find "RUNNING" > nul
if %ERRORLEVEL% EQU 0 (
    echo SQL Server Browser is already running.
) else (
    echo SQL Server Browser is not running. Attempting to start...
    net start "SQLBrowser"
    if %ERRORLEVEL% EQU 0 (
        echo SQL Server Browser started successfully.
    ) else (
        echo Failed to start SQL Server Browser.
        echo This might affect network connections to SQL Server.
    )
)

echo.
echo SQL Server status check completed.
pause 