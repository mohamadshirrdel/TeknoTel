$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env"

# خواندن CRON_SECRET از فایل .env
$line = Get-Content $envFile |
    Where-Object { $_ -match '^CRON_SECRET=' } |
    Select-Object -First 1

if (-not $line) {
    throw "CRON_SECRET پیدا نشد"
}

$secret = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")

# اجرای API انقضای سفارش‌ها
try {
    $result = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/cron/expire-orders" `
        -Headers @{ Authorization = "Bearer $secret" }

    Write-Output "$(Get-Date) - Expired: $($result.expiredCount)"
}
catch {
    Write-Output "$(Get-Date) - Error: $_"
}