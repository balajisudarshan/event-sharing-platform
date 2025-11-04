# Run All API Tests
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Event Sharing Platform - API Tests   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
$mongoRunning = $false
try {
    $result = mongosh --eval "db.version()" --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        $mongoRunning = $true
        Write-Host "✓ MongoDB is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ MongoDB is not running" -ForegroundColor Red
    Write-Host "  Starting MongoDB..." -ForegroundColor Yellow
    net start MongoDB
}

Write-Host ""
Write-Host "Running API Tests..." -ForegroundColor Yellow
Write-Host ""

# Navigate to backend directory
Set-Location -Path $PSScriptRoot

# Run tests
npm test

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Test Run Complete              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run specific tests:" -ForegroundColor Yellow
Write-Host "  npm run test:auth         - Authentication tests" -ForegroundColor Gray
Write-Host "  npm run test:events       - Event tests" -ForegroundColor Gray
Write-Host "  npm run test:registrations - Registration tests" -ForegroundColor Gray
Write-Host "  npm run test:coverage     - With coverage report" -ForegroundColor Gray
Write-Host ""
