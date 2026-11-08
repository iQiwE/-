# stop.ps1 - Корректная остановка серверов проекта
$ErrorActionPreference = "SilentlyContinue"
$ports = @(3000, 4000)
$stoppedAny = $false

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 0) {
                Write-Host "Stopping process PID $procId on port $port..."
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                $stoppedAny = $true
            }
        }
    }
}

Start-Sleep -Seconds 1
$remaining = Get-NetTCPConnection -LocalPort 3000, 4000 -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Warning "Some connections are still active on ports 3000/4000."
} else {
    Write-Host "All project processes stopped. Ports 3000 and 4000 are clean."
}
