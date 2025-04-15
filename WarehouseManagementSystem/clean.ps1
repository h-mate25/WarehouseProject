# Clean script for Warehouse Management System
# This script terminates any running instances and cleans the project outputs

# Terminate any running application instances
Write-Host "Stopping any running application instances..." -ForegroundColor Yellow
try {
    Stop-Process -Name "WarehouseManagementSystem" -Force -ErrorAction SilentlyContinue
    Write-Host "Successfully terminated running instances." -ForegroundColor Green
} catch {
    Write-Host "No running instances found or failed to terminate: $_" -ForegroundColor Cyan
}

# Wait a moment to ensure processes are fully terminated
Start-Sleep -Seconds 2

# Clean the project outputs
Write-Host "Cleaning project outputs..." -ForegroundColor Yellow
dotnet clean

# Remove specific directories to ensure a clean state
$dirsToRemove = @(
    ".\bin",
    ".\obj"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Write-Host "Removing directory: $dir" -ForegroundColor Cyan
        try {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "Successfully removed $dir" -ForegroundColor Green
        } catch {
            Write-Host "Failed to remove $dir completely: $_" -ForegroundColor Red
            Write-Host "Some files may still be locked." -ForegroundColor Yellow
        }
    }
}

Write-Host "Project cleanup completed." -ForegroundColor Green
Write-Host "You can now rebuild the project with 'dotnet build' or 'dotnet run'" -ForegroundColor Cyan

# Pause to see the output
Write-Host "Press any key to exit..."
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 