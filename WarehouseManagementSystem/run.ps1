# Script to start the Warehouse Management System
# This script ensures any existing instances are terminated before starting

# Function to terminate processes
function Terminate-App {
    param (
        [string]$ProcessName,
        [int]$ProcessId = 0
    )
    
    try {
        # Try terminating by process name first
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "Stopping existing $ProcessName processes..." -ForegroundColor Yellow
            Stop-Process -Name $ProcessName -Force
            Write-Host "Existing processes stopped." -ForegroundColor Green
            # Wait a moment to ensure process termination completes
            Start-Sleep -Seconds 1
            return $true
        }
        
        # If specified, try terminating by specific PID
        if ($ProcessId -gt 0) {
            try {
                $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Stopping process with PID $ProcessId..." -ForegroundColor Yellow
                    Stop-Process -Id $ProcessId -Force
                    Write-Host "Process with PID $ProcessId stopped." -ForegroundColor Green
                    # Wait a moment to ensure process termination completes
                    Start-Sleep -Seconds 1
                    return $true
                }
            } catch {
                Write-Host "Process with PID $ProcessId not found or already terminated." -ForegroundColor Cyan
            }
        }
        
        Write-Host "No existing processes found to terminate." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Error terminating processes: $_" -ForegroundColor Red
        return $false
    }
}

# Function to unlock file if needed
function Unlock-File {
    param (
        [string]$FilePath
    )
    
    if (Test-Path $FilePath) {
        try {
            Write-Host "Checking if file is locked: $FilePath" -ForegroundColor Cyan
            $fileStream = [System.IO.File]::Open($FilePath, 'Open', 'Read', 'None')
            $fileStream.Close()
            $fileStream.Dispose()
            Write-Host "File is not locked." -ForegroundColor Green
            return $true
        } catch {
            Write-Host "File is locked. Attempting to resolve..." -ForegroundColor Yellow
            return $false
        }
    } else {
        Write-Host "File does not exist: $FilePath" -ForegroundColor Cyan
        return $true
    }
}

# Main execution
Write-Host "=== Warehouse Management System Launcher ===" -ForegroundColor Cyan

# Step 1: Terminate any existing processes
$processName = "WarehouseManagementSystem"
$exePath = ".\bin\Debug\net9.0\WarehouseManagementSystem.exe"
Terminate-App -ProcessName $processName

# Step 2: Check if executable is still locked
if (!(Unlock-File -FilePath $exePath)) {
    Write-Host "File still appears to be locked. You may need to restart your computer if the issue persists." -ForegroundColor Yellow
    Write-Host "Waiting 5 seconds before trying to continue..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Step 3: Start the application with --no-build if the file is locked
Write-Host "Starting Warehouse Management System on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $exePath) {
    # Try running with --no-build first to avoid file locks if possible
    dotnet run --no-build
} else {
    # If executable doesn't exist, do a full build
    dotnet run
}

Write-Host "Application stopped." -ForegroundColor Yellow 