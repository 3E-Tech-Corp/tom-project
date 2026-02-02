<#
.SYNOPSIS
    Provisions a new IIS site, app pool, SQL Server database, and configuration.
    Uses the Demo_{Id}_{Title} naming convention for all resources.

.DESCRIPTION
    Idempotent - safe to re-run. Checks if resources exist before creating them.
    Grants ftsql login permissions on the new database.

.PARAMETER ProjectId
    Numeric project ID (e.g., 2)

.PARAMETER ProjectTitle
    Project title in PascalCase (e.g., ApolloSpark)

.PARAMETER Domain
    Public domain for IIS host header bindings (e.g., apollospark.synthia.bot)

.PARAMETER SqlServerInstance
    SQL Server instance name. Default: localhost

.PARAMETER BasePath
    Root path for sites. Default: F:\New_WWW

.PARAMETER SqlUser
    SQL login to grant DB access. Default: ftsql

.PARAMETER SqlPassword
    Password for the SQL login. Default: letsroc
#>
param(
    [Parameter(Mandatory = $true)]
    [int]$ProjectId,

    [Parameter(Mandatory = $true)]
    [string]$ProjectTitle,

    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [string]$SqlServerInstance = "localhost",
    [string]$BasePath = "F:\New_WWW",
    [string]$SqlUser = "ftsql",
    [string]$SqlPassword = "letsroc"
)

$ErrorActionPreference = "Stop"

# Convention names
$conventionName = "Demo_${ProjectId}_${ProjectTitle}"
$siteName       = $conventionName
$appPoolName    = $conventionName
$databaseName   = $conventionName

# Paths
$sitePath      = Join-Path $BasePath $conventionName
$frontendPath  = Join-Path $sitePath "WWW"
$backendPath   = Join-Path $sitePath "API"
$logsPath      = Join-Path $backendPath "logs"
$backupPath    = "F:\deploy-backups\$conventionName"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " IIS Provisioning: $conventionName" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Convention:   Demo_${ProjectId}_${ProjectTitle}"
Write-Host "  Domain:       $Domain"
Write-Host "  Site Name:    $siteName"
Write-Host "  App Pool:     $appPoolName"
Write-Host "  Database:     $databaseName"
Write-Host "  Frontend:     $frontendPath"
Write-Host "  Backend:      $backendPath"
Write-Host "  SQL Instance: $SqlServerInstance"
Write-Host "  SQL User:     $SqlUser"
Write-Host "==========================================================" -ForegroundColor Cyan

$summary = @()

# 1. Create Directories
Write-Host "`n>> Creating directories..." -ForegroundColor Yellow

foreach ($dir in @($frontendPath, $backendPath, $logsPath, $backupPath)) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   Created: $dir" -ForegroundColor Green
        $summary += "Created directory: $dir"
    } else {
        Write-Host "   Exists:  $dir" -ForegroundColor Gray
    }
}

# 2. Create SQL Server Database + Grant Permissions
Write-Host "`n>> Creating database: $databaseName ..." -ForegroundColor Yellow

$sqlCreate = @"
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$databaseName')
BEGIN
    CREATE DATABASE [$databaseName];
    PRINT 'DATABASE_CREATED';
END
ELSE
BEGIN
    PRINT 'DATABASE_EXISTS';
END
"@

try {
    $result = sqlcmd -S $SqlServerInstance -Q $sqlCreate -h -1 -W 2>&1
    $resultText = ($result | Out-String).Trim()
    if ($resultText -match "DATABASE_CREATED") {
        Write-Host "   Database created: $databaseName" -ForegroundColor Green
        $summary += "Created database: $databaseName"
    } elseif ($resultText -match "DATABASE_EXISTS") {
        Write-Host "   Database already exists: $databaseName" -ForegroundColor Gray
    } else {
        Write-Host "   sqlcmd output: $resultText" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR creating database: $_" -ForegroundColor Red
    throw
}

# 3. Grant SQL User Permissions
Write-Host "`n>> Granting $SqlUser permissions on $databaseName ..." -ForegroundColor Yellow

$sqlGrant = "USE [$databaseName]; IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$SqlUser') BEGIN CREATE USER [$SqlUser] FOR LOGIN [$SqlUser]; END; ALTER ROLE db_datareader ADD MEMBER [$SqlUser]; ALTER ROLE db_datawriter ADD MEMBER [$SqlUser]; ALTER ROLE db_ddladmin ADD MEMBER [$SqlUser]; GRANT EXECUTE TO [$SqlUser];"

try {
    sqlcmd -S $SqlServerInstance -Q $sqlGrant -h -1 -W 2>&1 | Out-Null
    Write-Host "   Permissions granted: datareader, datawriter, ddladmin, execute" -ForegroundColor Green
    $summary += "Granted $SqlUser permissions on $databaseName"
} catch {
    Write-Host "   WARNING: Could not grant permissions: $_" -ForegroundColor Yellow
}

# 4. Generate appsettings.Production.json (using SQL login, not Trusted_Connection)
Write-Host "`n>> Generating appsettings.Production.json ..." -ForegroundColor Yellow

$appsettingsPath = Join-Path $backendPath "appsettings.Production.json"

if (!(Test-Path $appsettingsPath)) {
    # Generate a random 32-byte base64 JWT key
    $jwtKey = [System.Convert]::ToBase64String(
        (1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]
    )

    $connectionString = "Server=$SqlServerInstance;Database=$databaseName;User ID=$SqlUser;Password=$SqlPassword;TrustServerCertificate=True;MultipleActiveResultSets=True"

    $appsettings = @{
        ConnectionStrings = @{
            DefaultConnection = $connectionString
        }
        Jwt = @{
            Key          = $jwtKey
            Issuer       = $ProjectTitle
            Audience     = $ProjectTitle
            ExpiryHours  = 24
        }
        Cors = @{
            Origins = "https://$Domain"
        }
        Logging = @{
            LogLevel = @{
                Default              = "Information"
                "Microsoft.AspNetCore" = "Warning"
            }
        }
    }

    $appsettings | ConvertTo-Json -Depth 5 | Set-Content -Path $appsettingsPath -Encoding UTF8
    Write-Host "   Created: $appsettingsPath" -ForegroundColor Green
    Write-Host "   Connection: $SqlUser@$databaseName" -ForegroundColor Gray
    $summary += "Created appsettings.Production.json (SQL login: $SqlUser)"
} else {
    Write-Host "   Exists:  $appsettingsPath (not overwritten)" -ForegroundColor Gray
}

# 5. Import IIS Module + Create App Pool
Import-Module WebAdministration -ErrorAction Stop

Write-Host "`n>> Creating App Pool: $appPoolName ..." -ForegroundColor Yellow

if (!(Test-Path "IIS:\AppPools\$appPoolName")) {
    New-WebAppPool -Name $appPoolName | Out-Null
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedPipelineMode -Value "Integrated"
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name autoStart -Value $true
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name startMode -Value "AlwaysRunning"
    Write-Host "   App pool created: $appPoolName (No Managed Code, Integrated, AlwaysRunning)" -ForegroundColor Green
    $summary += "Created app pool: $appPoolName"
} else {
    Write-Host "   App pool exists: $appPoolName" -ForegroundColor Gray
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedPipelineMode -Value "Integrated"
}

# 6. Create IIS Site (HTTP port 80 with host header)
Write-Host "`n>> Creating IIS Site: $siteName ..." -ForegroundColor Yellow

if (!(Get-Website -Name $siteName -ErrorAction SilentlyContinue)) {
    New-Website -Name $siteName `
                -PhysicalPath $frontendPath `
                -ApplicationPool $appPoolName `
                -HostHeader $Domain `
                -Port 80 `
                -Force | Out-Null
    Write-Host "   Site created: $siteName -> $frontendPath (port 80, host: $Domain)" -ForegroundColor Green
    $summary += "Created IIS site: $siteName"
} else {
    Write-Host "   Site exists: $siteName" -ForegroundColor Gray
}

# 7. Add HTTPS binding if synthia.bot wildcard cert is available
Write-Host "`n>> Checking for SSL certificate..." -ForegroundColor Yellow

$cert = Get-ChildItem Cert:\LocalMachine\WebHosting -ErrorAction SilentlyContinue | Where-Object {
    $_.Subject -like "*synthia.bot*"
} | Sort-Object NotAfter -Descending | Select-Object -First 1

if (-not $cert) {
    $cert = Get-ChildItem Cert:\LocalMachine\My -ErrorAction SilentlyContinue | Where-Object {
        $_.Subject -like "*synthia.bot*"
    } | Sort-Object NotAfter -Descending | Select-Object -First 1
}

if ($cert) {
    $certStore = if ((Get-ChildItem "Cert:\LocalMachine\WebHosting\$($cert.Thumbprint)" -ErrorAction SilentlyContinue)) { "WebHosting" } else { "My" }
    $existingHttps = Get-WebBinding -Name $siteName -Protocol "https" -ErrorAction SilentlyContinue
    if (!$existingHttps) {
        New-WebBinding -Name $siteName -Protocol "https" -Port 443 -HostHeader $Domain -SslFlags 1
        $binding = Get-WebBinding -Name $siteName -Protocol "https"
        $binding.AddSslCertificate($cert.Thumbprint, $certStore)
        Write-Host "   HTTPS binding added (SNI, $certStore store)" -ForegroundColor Green
        $summary += "Added HTTPS binding with synthia.bot cert"
    } else {
        Write-Host "   HTTPS binding already exists" -ForegroundColor Gray
    }
} else {
    Write-Host "   No synthia.bot certificate found — HTTP only" -ForegroundColor Yellow
    Write-Host "   Run add-https-binding.yml after cert is installed" -ForegroundColor Yellow
    $summary += "No SSL cert — HTTP only"
}

# 8. Create /api Virtual Application
Write-Host "`n>> Creating /api virtual application..." -ForegroundColor Yellow

$existingApp = Get-WebApplication -Site $siteName -Name "api" -ErrorAction SilentlyContinue
if (!$existingApp) {
    New-WebApplication -Site $siteName `
                       -Name "api" `
                       -PhysicalPath $backendPath `
                       -ApplicationPool $appPoolName | Out-Null
    Write-Host "   Virtual app created: /api -> $backendPath" -ForegroundColor Green
    $summary += "Created virtual application: /api"
} else {
    Write-Host "   Virtual app /api already exists" -ForegroundColor Gray
}

# 9. Set Folder Permissions
Write-Host "`n>> Setting folder permissions..." -ForegroundColor Yellow

$appPoolIdentity = "IIS AppPool\$appPoolName"

try {
    $acl = Get-Acl $frontendPath
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $acl.SetAccessRule($rule)
    Set-Acl -Path $frontendPath -AclObject $acl

    $acl = Get-Acl $backendPath
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $acl.SetAccessRule($rule)
    Set-Acl -Path $backendPath -AclObject $acl

    $acl = Get-Acl $logsPath
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $appPoolIdentity, "Modify", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $acl.SetAccessRule($rule)
    Set-Acl -Path $logsPath -AclObject $acl

    $acl = Get-Acl $backendPath
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $appPoolIdentity, "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $acl.SetAccessRule($rule)
    Set-Acl -Path $backendPath -AclObject $acl

    Write-Host "   Permissions set for IIS_IUSRS and $appPoolIdentity" -ForegroundColor Green
    $summary += "Set folder permissions"
} catch {
    Write-Host "   Warning: Error setting permissions — $_" -ForegroundColor Yellow
}

# 10. Create SPA web.config + placeholder index.html
$webConfigPath = Join-Path $frontendPath "web.config"
if (!(Test-Path $webConfigPath)) {
    $webConfig = '<?xml version="1.0" encoding="utf-8"?><configuration><system.webServer><rewrite><rules><rule name="SPA" stopProcessing="true"><match url=".*" /><conditions logicalGrouping="MatchAll"><add input="{REQUEST_URI}" pattern="^/api" negate="true" /><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /><add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /></conditions><action type="Rewrite" url="/index.html" /></rule></rules></rewrite></system.webServer></configuration>'
    Set-Content -Path $webConfigPath -Value $webConfig
    Write-Host "`n>> Created SPA web.config" -ForegroundColor Green
}

$indexPath = Join-Path $frontendPath "index.html"
if (!(Test-Path $indexPath)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
    Set-Content -Path $indexPath -Value "<!DOCTYPE html><html><head><title>$ProjectTitle</title></head><body><h1>$ProjectTitle</h1><p>Provisioned. Awaiting first deployment.</p><p><small>$timestamp</small></p></body></html>"
    Write-Host ">> Created placeholder index.html" -ForegroundColor Green
}

# 11. Start App Pool
Write-Host "`n>> Starting App Pool..." -ForegroundColor Yellow

try {
    $poolState = (Get-WebAppPoolState -Name $appPoolName).Value
    if ($poolState -ne "Started") {
        Start-WebAppPool -Name $appPoolName
        Write-Host "   App pool started" -ForegroundColor Green
    } else {
        Write-Host "   App pool already running" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Warning: Could not start app pool — $_" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========== Provisioning Complete! ==========" -ForegroundColor Green
Write-Host "Convention:   $conventionName"
Write-Host "Domain:       $Domain"
Write-Host "Site Name:    $siteName"
Write-Host "App Pool:     $appPoolName"
Write-Host "Database:     $databaseName"
Write-Host "SQL User:     $SqlUser"
Write-Host "Frontend:     $frontendPath"
Write-Host "Backend:      $backendPath"
Write-Host "Backups:      $backupPath"
Write-Host ""
Write-Host "Actions taken:" -ForegroundColor Yellow
foreach ($item in $summary) {
    Write-Host "  - $item" -ForegroundColor Green
}
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  https://$Domain"
Write-Host "  https://$Domain/api/health"
Write-Host "============================================" -ForegroundColor Green
