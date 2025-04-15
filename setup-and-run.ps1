# Warehouse Management System - Setup and Run
Write-Host "===== Warehouse Management System Setup and Run =====" -ForegroundColor Cyan
Write-Host "This script will set up all prerequisites and run the application." -ForegroundColor Cyan
Write-Host ""

# Configuration
$appPath = ".\WarehouseManagementSystem"
$projectFile = "WarehouseManagementSystem.csproj"
$requiredDotNetVersion = "6.0"
$dotnetInstallUrl = "https://dot.net/v1/dotnet-install.ps1"
$tempDir = "$env:TEMP\dotnet-install"

# Function to install .NET SDK
function Install-DotNetSDK {
    Write-Host "Installing .NET SDK $requiredDotNetVersion..." -ForegroundColor Cyan
    
    # Create temp directory if it doesn't exist
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    # Download the installer script
    $installerPath = "$tempDir\dotnet-install.ps1"
    try {
        Invoke-WebRequest -Uri $dotnetInstallUrl -OutFile $installerPath
        Write-Host "Installer script downloaded successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to download .NET installer script: $_" -ForegroundColor Red
        return $false
    }
    
    # Run the installer
    try {
        & $installerPath -Channel $requiredDotNetVersion
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Installation failed with exit code $LASTEXITCODE" -ForegroundColor Red
            return $false
        }
        Write-Host ".NET SDK $requiredDotNetVersion installed successfully." -ForegroundColor Green
        
        # Update PATH for current session
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        return $true
    } catch {
        Write-Host "Error installing .NET SDK: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check if .NET SDK is installed
function Check-DotNetSDK {
    Write-Host "Checking for .NET SDK $requiredDotNetVersion..." -ForegroundColor Cyan
    try {
        $dotnetInfo = dotnet --list-sdks
        $hasSdk = $dotnetInfo -match $requiredDotNetVersion
        
        if ($hasSdk) {
            Write-Host ".NET SDK $requiredDotNetVersion is installed." -ForegroundColor Green
            return $true
        } else {
            Write-Host ".NET SDK $requiredDotNetVersion is required but not found." -ForegroundColor Yellow
            Write-Host "Installed SDKs:" -ForegroundColor Yellow
            $dotnetInfo | ForEach-Object { Write-Host "  $_" }
            
            $installDotNet = Read-Host "Do you want to install .NET SDK $requiredDotNetVersion? (Y/N)"
            if ($installDotNet -eq "Y" -or $installDotNet -eq "y") {
                return (Install-DotNetSDK)
            } else {
                return $false
            }
        }
    } catch {
        Write-Host ".NET SDK is not installed or not in PATH." -ForegroundColor Red
        
        $installDotNet = Read-Host "Do you want to install .NET SDK $requiredDotNetVersion? (Y/N)"
        if ($installDotNet -eq "Y" -or $installDotNet -eq "y") {
            return (Install-DotNetSDK)
        } else {
            return $false
        }
    }
}

# Function to check SQL Server
function Check-SqlServer {
    Write-Host "Checking SQL Server status..." -ForegroundColor Cyan
    
    $sqlService = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
    if ($sqlService -and $sqlService.Status -eq "Running") {
        Write-Host "SQL Server (SQLEXPRESS) is running." -ForegroundColor Green
        return $true
    } else {
        Write-Host "SQL Server (SQLEXPRESS) is not running." -ForegroundColor Yellow
        
        $startSql = Read-Host "Do you want to start SQL Server? (Y/N)"
        if ($startSql -eq "Y" -or $startSql -eq "y") {
            try {
                if ($sqlService) {
                    Start-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction Stop
                    Write-Host "SQL Server started successfully." -ForegroundColor Green
                    
                    # Also check and start SQL Browser service
                    $browserService = Get-Service -Name "SQLBrowser" -ErrorAction SilentlyContinue
                    if ($browserService -and $browserService.Status -ne "Running") {
                        Start-Service -Name "SQLBrowser" -ErrorAction SilentlyContinue
                        Write-Host "SQL Server Browser service started." -ForegroundColor Green
                    }
                    
                    return $true
                } else {
                    Write-Host "SQL Server is not installed. Would you like to install it? (Y/N)" -ForegroundColor Yellow
                    $installSql = Read-Host
                    if ($installSql -eq "Y" -or $installSql -eq "y") {
                        Write-Host "Please visit https://www.microsoft.com/en-us/sql-server/sql-server-downloads to download SQL Server Express."
                        Write-Host "After installation, please run this script again."
                    }
                    return $false
                }
            } catch {
                Write-Host "Failed to start SQL Server: $_" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "SQL Server is required to run the application." -ForegroundColor Yellow
            return $false
        }
    }
}

# Function to build the application
function Build-Application {
    Write-Host ""
    Write-Host "Building application..." -ForegroundColor Cyan
    
    try {
        Set-Location -Path $appPath
        
        # Clean the project
        Write-Host "Cleaning solution..." -ForegroundColor Cyan
        dotnet clean $projectFile
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to clean the project." -ForegroundColor Red
            return $false
        }
        
        # Restore packages
        Write-Host "Restoring NuGet packages..." -ForegroundColor Cyan
        dotnet restore $projectFile
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to restore NuGet packages." -ForegroundColor Red
            return $false
        }
        
        # Build the project
        Write-Host "Building project..." -ForegroundColor Cyan
        dotnet build $projectFile --configuration Release
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build the project." -ForegroundColor Red
            return $false
        }
        
        Write-Host "Application built successfully." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Error building application: $_" -ForegroundColor Red
        return $false
    } finally {
        Set-Location -Path $PSScriptRoot
    }
}

# Function to run the application
function Run-Application {
    Write-Host ""
    Write-Host "Running application..." -ForegroundColor Cyan
    
    try {
        Set-Location -Path $appPath
        
        # Run the application
        dotnet run --project $projectFile --configuration Release
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Application exited with errors." -ForegroundColor Red
            return $false
        }
        
        return $true
    } catch {
        Write-Host "Error running application: $_" -ForegroundColor Red
        return $false
    } finally {
        Set-Location -Path $PSScriptRoot
    }
}

# Main execution flow
$setupComplete = $true

# Step 1: Check .NET SDK
Write-Host "=== Step 1: .NET SDK Check ===" -ForegroundColor Magenta
$dotnetInstalled = Check-DotNetSDK
if (-not $dotnetInstalled) {
    Write-Host ".NET SDK setup failed. Cannot continue." -ForegroundColor Red
    $setupComplete = $false
} else {
    Write-Host ".NET SDK check completed successfully." -ForegroundColor Green
}

# Step 2: Check SQL Server
if ($setupComplete) {
    Write-Host ""
    Write-Host "=== Step 2: SQL Server Check ===" -ForegroundColor Magenta
    $sqlServerRunning = Check-SqlServer
    if (-not $sqlServerRunning) {
        Write-Host "SQL Server setup failed. Cannot continue." -ForegroundColor Red
        $setupComplete = $false
    } else {
        Write-Host "SQL Server check completed successfully." -ForegroundColor Green
    }
}

# Step 3: Build the application
if ($setupComplete) {
    Write-Host ""
    Write-Host "=== Step 3: Build Application ===" -ForegroundColor Magenta
    $buildSuccess = Build-Application
    if (-not $buildSuccess) {
        Write-Host "Application build failed. Cannot continue." -ForegroundColor Red
        $setupComplete = $false
    } else {
        Write-Host "Application build completed successfully." -ForegroundColor Green
    }
}

# Step 4: Run the application
if ($setupComplete) {
    Write-Host ""
    Write-Host "=== Step 4: Run Application ===" -ForegroundColor Magenta
    $runSuccess = Run-Application
    if ($runSuccess) {
        Write-Host "Application ran successfully." -ForegroundColor Green
    } else {
        Write-Host "Application run failed." -ForegroundColor Red
    }
}

# Final status
Write-Host ""
if ($setupComplete) {
    Write-Host "Setup and run process completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Setup and run process did not complete due to errors." -ForegroundColor Red
    Write-Host "Please fix the issues and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")