# SQL Server Status Check PowerShell Script
Write-Host "===== SQL Server Status Check =====" -ForegroundColor Cyan
Write-Host ""

# Check if SQL Server service is running
$sqlService = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
if ($sqlService -and $sqlService.Status -eq "Running") {
    Write-Host "SQL Server (SQLEXPRESS) is already running." -ForegroundColor Green
} 
else {
    Write-Host "SQL Server (SQLEXPRESS) is not running. Attempting to start..." -ForegroundColor Yellow
    try {
        Start-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction Stop
        Write-Host "SQL Server (SQLEXPRESS) started successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to start SQL Server (SQLEXPRESS)." -ForegroundColor Red
        Write-Host "Please check if SQL Server is installed correctly." -ForegroundColor Red
        Write-Host "You can download SQL Server Express from:" -ForegroundColor Yellow
        Write-Host "https://www.microsoft.com/en-us/sql-server/sql-server-downloads" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "Checking SQL Server Browser service..." -ForegroundColor Cyan
$browserService = Get-Service -Name "SQLBrowser" -ErrorAction SilentlyContinue
if ($browserService -and $browserService.Status -eq "Running") {
    Write-Host "SQL Server Browser is already running." -ForegroundColor Green
}
else {
    Write-Host "SQL Server Browser is not running. Attempting to start..." -ForegroundColor Yellow
    try {
        Start-Service -Name "SQLBrowser" -ErrorAction Stop
        Write-Host "SQL Server Browser started successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to start SQL Server Browser." -ForegroundColor Red
        Write-Host "This might affect network connections to SQL Server." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "SQL Server status check completed." -ForegroundColor Cyan
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 