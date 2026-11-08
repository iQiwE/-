# start.ps1 - Запуск backend и frontend проекта
$ErrorActionPreference = "Stop"

$rootDir = "d:\-"
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

Write-Host "Checking active connections on ports 3000 and 4000..."
& "$PSScriptRoot\stop.ps1"

Write-Host "Starting Backend on http://localhost:4000..."
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:prod" -WorkingDirectory $backendDir -WindowStyle Hidden

Write-Host "Starting Frontend on http://localhost:3000..."
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" -WorkingDirectory $frontendDir -WindowStyle Hidden

Write-Host "Waiting for services to become responsive..."
$attempts = 0
$backendReady = $false
$frontendReady = $false

while ($attempts -lt 15 -and (-not $backendReady -or -not $frontendReady)) {
    Start-Sleep -Seconds 2
    $attempts++

    if (-not $backendReady) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/properties" -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -eq 200) { $backendReady = $true }
        } catch {}
    }

    if (-not $frontendReady) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -eq 200) { $frontendReady = $true }
        } catch {}
    }
}

Write-Host "Backend ready: $backendReady (http://localhost:4000/api/v1)"
Write-Host "Frontend ready: $frontendReady (http://localhost:3000)"
