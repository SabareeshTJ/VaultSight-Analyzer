# VaultSight — Start both servers (Windows PowerShell)
# Run this from the project root: .\start.ps1

Write-Host "Starting VaultSight..." -ForegroundColor Cyan

# Start Flask backend in a new terminal window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; pip install -r requirements.txt; python app.py"

# Give Flask a moment to start
Start-Sleep -Seconds 2

# Start React frontend in a new terminal window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm install; npm run dev"

Write-Host "Both servers starting..." -ForegroundColor Green
Write-Host "Flask:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "React:  http://localhost:5173  ← open this in Chrome" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to open the app in Chrome..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:5173"
