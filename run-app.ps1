# Application Runner Script
Write-Host "===== Application Runner =====" -ForegroundColor Cyan
Write-Host ""

# Variables - adjust these as needed
$appPath = ".\WarehouseManagementSystem"
$projectFile = "WarehouseManagementSystem.csproj"
$requiredDotNetVersion = "6.0"
$checkSqlServer = $true

# Function to check if .NET SDK is installed
function Check-DotNetSDK {
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
            return $false
        }
    } catch {
        Write-Host ".NET SDK is not installed or not in PATH." -ForegroundColor Red
        return $false
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
                Start-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction Stop
                Write-Host "SQL Server started successfully." -ForegroundColor Green
                return $true
            } catch {
                Write-Host "Failed to start SQL Server. You may need to run the check-sql-server script." -ForegroundColor Red
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
        dotnet clean $projectFile
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to clean the project." -ForegroundColor Red
            return $false
        }
        
        # Restore packages
        dotnet restore $projectFile
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to restore NuGet packages." -ForegroundColor Red
            return $false
        }
        
        # Build the project
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
$allChecksPass = $true

# Check .NET SDK
$dotnetInstalled = Check-DotNetSDK
if (-not $dotnetInstalled) {
    $installDotNet = Read-Host "Do you want to install .NET SDK $requiredDotNetVersion? (Y/N)"
    if ($installDotNet -eq "Y" -or $installDotNet -eq "y") {
        Write-Host "Please run the dotnet-install script first and then re-run this script." -ForegroundColor Yellow
    }
    $allChecksPass = $false
}

# Check SQL Server if required
if ($checkSqlServer) {
    $sqlServerRunning = Check-SqlServer
    if (-not $sqlServerRunning) {
        $allChecksPass = $false
    }
}

# Build and run if all checks pass
if ($allChecksPass) {
    $buildSuccess = Build-Application
    if ($buildSuccess) {
        $runSuccess = Run-Application
        if ($runSuccess) {
            Write-Host ""
            Write-Host "Application completed successfully." -ForegroundColor Green
        }
    }
} else {
    Write-Host ""
    Write-Host "Cannot run the application because one or more prerequisites failed." -ForegroundColor Red
    Write-Host "Please fix the issues and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 