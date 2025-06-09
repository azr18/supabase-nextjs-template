# PowerShell Local Deployment Test Script
# This script tests the production deployment setup locally on Windows

Write-Host "🧪 Testing Production Deployment Setup Locally (Windows)" -ForegroundColor Cyan
Write-Host "========================================================="

# Check if Docker and Docker Compose are available
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is required but not installed" -ForegroundColor Red
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose is installed: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is required but not installed" -ForegroundColor Red
    exit 1
}

# Check if Docker daemon is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Environment Setup for Local Testing" -ForegroundColor Yellow
Write-Host "===================================="

# Create a local test environment file
Write-Host "Creating local test environment file..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local.test")) {
    $envContent = @"
# Local Test Environment - Based on production template
# This uses your existing local development values for testing

# Supabase Configuration (from your existing .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://hcyteovnllklmvoptxjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXRlb3ZubGxrbW12b3B0eGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MDI5MTcsImV4cCI6MjA2NDA3ODkxN30.QEoxsRXBGSiZYFkEvIe_6wqdU2s8sprHIJEiLsLZy7I

# Service role key - YOU NEED TO ADD THIS for testing
PRIVATE_SUPABASE_SERVICE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY

# Google OAuth - YOU NEED TO ADD THESE if testing OAuth
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=REPLACE_WITH_GOOGLE_CLIENT_ID
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=REPLACE_WITH_GOOGLE_CLIENT_SECRET

# Application Configuration
NEXT_PUBLIC_PRODUCTNAME=Invoice Reconciler (Local Test)
NEXT_PUBLIC_SSO_PROVIDERS=google
NEXT_PUBLIC_THEME=theme-sass

# Pricing Configuration
NEXT_PUBLIC_TIERS_NAMES=Basic,Growth,Max
NEXT_PUBLIC_TIERS_PRICES=99,199,299
NEXT_PUBLIC_TIERS_DESCRIPTIONS=Perfect for getting started,Best for growing teams,For enterprise-grade needs
NEXT_PUBLIC_TIERS_FEATURES=14 day free trial|30 PDF files,14 day free trial|1000 PDF files,14 day free trial|Unlimited PDF files
NEXT_PUBLIC_POPULAR_TIER=Growth
NEXT_PUBLIC_COMMON_FEATURES=SSL security,unlimited updates,premium support

# Optional
NEXT_PUBLIC_GOOGLE_TAG=

# Python Service Configuration
PYTHON_SERVICE_URL=http://python-service:5000

# Docker Environment
NODE_ENV=production
FLASK_ENV=production
PYTHONUNBUFFERED=1
"@
    
    $envContent | Out-File -FilePath ".env.local.test" -Encoding UTF8
    Write-Host "✅ Created .env.local.test" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local.test already exists" -ForegroundColor Yellow
}

# Copy the test env file to .env for Docker Compose
Write-Host "Setting up environment for Docker Compose..." -ForegroundColor Yellow
Copy-Item ".env.local.test" ".env"
Write-Host "✅ Environment file ready" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Required Manual Configuration" -ForegroundColor Yellow
Write-Host "==============================="
Write-Host "Before continuing, you need to:"
Write-Host "1. Get your Supabase Service Role Key:"
Write-Host "   - Go to https://app.supabase.com/project/hcyteovnllklmvoptxjr/settings/api"
Write-Host "   - Copy the 'service_role' key"
Write-Host "   - Edit .env and replace REPLACE_WITH_YOUR_SERVICE_ROLE_KEY"
Write-Host ""
Write-Host "2. (Optional) For Google OAuth testing:"
Write-Host "   - Get Google OAuth credentials from Google Cloud Console"
Write-Host "   - Edit .env and replace the Google OAuth placeholders"
Write-Host ""

$envConfigured = Read-Host "Have you updated the .env file with at least the Supabase service role key? (y/N)"

if ($envConfigured -notmatch '^[Yy]$') {
    Write-Host "Please update .env file first, then run this script again" -ForegroundColor Yellow
    Write-Host "Edit the .env file and replace REPLACE_WITH_YOUR_SERVICE_ROLE_KEY with your actual key"
    pause
    exit 0
}

Write-Host ""
Write-Host "🐳 Building and Starting Services" -ForegroundColor Yellow
Write-Host "=================================="

# Stop any existing containers
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null | Out-Null

# Build the containers
Write-Host "Building Docker images..." -ForegroundColor Yellow
try {
    docker-compose build
    Write-Host "✅ Images built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build images" -ForegroundColor Red
    exit 1
}

# Start the services
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
try {
    docker-compose up -d
    Write-Host "✅ Services started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for Services to Initialize" -ForegroundColor Yellow
Write-Host "====================================="

# Function to wait for a service
function Wait-ForService {
    param($ServiceName, $Url, $MaxAttempts = 20)
    
    Write-Host "Waiting for $ServiceName..." -ForegroundColor Yellow
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName is ready" -ForegroundColor Green
                return $true
            }
        } catch {
            # Service not ready yet
        }
        Write-Host "  Attempt $attempt/$MaxAttempts..." -ForegroundColor Gray
        Start-Sleep 3
    }
    
    Write-Host "❌ $ServiceName failed to start" -ForegroundColor Red
    return $false
}

# Wait for services
if (-not (Wait-ForService "Python Service" "http://localhost:5000/health")) {
    Write-Host "Python service logs:" -ForegroundColor Yellow
    docker-compose logs python-service
    exit 1
}

if (-not (Wait-ForService "Next.js Service" "http://localhost:3000")) {
    Write-Host "Next.js service logs:" -ForegroundColor Yellow
    docker-compose logs nextjs-app
    exit 1
}

if (-not (Wait-ForService "Nginx Proxy" "http://localhost:80")) {
    Write-Host "Nginx logs:" -ForegroundColor Yellow
    docker-compose logs nginx
    exit 1
}

Write-Host ""
Write-Host "🔍 Testing Services" -ForegroundColor Yellow
Write-Host "=================="

# Test Python service
Write-Host "Testing Python service health..." -ForegroundColor Yellow
try {
    $pythonHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 10
    if ($pythonHealth.status -eq "ok") {
        Write-Host "✅ Python service health check passed" -ForegroundColor Green
        Write-Host "  Response: $($pythonHealth | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Python service health check failed" -ForegroundColor Red
        Write-Host "  Response: $($pythonHealth | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Python service health check failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test Next.js service
Write-Host ""
Write-Host "Testing Next.js service..." -ForegroundColor Yellow
try {
    $nextjsResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
    if ($nextjsResponse.StatusCode -eq 200) {
        Write-Host "✅ Next.js service responding (HTTP $($nextjsResponse.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ Next.js service failed (HTTP $($nextjsResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Next.js service failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test Nginx proxy
Write-Host ""
Write-Host "Testing Nginx proxy..." -ForegroundColor Yellow
try {
    $nginxResponse = Invoke-WebRequest -Uri "http://localhost:80" -TimeoutSec 10 -UseBasicParsing
    if ($nginxResponse.StatusCode -eq 200) {
        Write-Host "✅ Nginx proxy working (HTTP $($nginxResponse.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ Nginx proxy failed (HTTP $($nginxResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Nginx proxy failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📊 Container Status" -ForegroundColor Yellow
Write-Host "=================="
docker-compose ps

Write-Host ""
Write-Host "🌐 Access URLs" -ForegroundColor Yellow
Write-Host "=============="
Write-Host "Your local test deployment is running at:"
Write-Host "  • Main application: http://localhost" -ForegroundColor Cyan
Write-Host "  • Next.js direct:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • Python service:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  • Health check:     http://localhost:5000/health" -ForegroundColor Cyan

Write-Host ""
Write-Host "🧪 Manual Testing Steps" -ForegroundColor Yellow
Write-Host "======================"
Write-Host "1. Open http://localhost in your browser"
Write-Host "2. Try to sign up/login (Google OAuth if configured)"
Write-Host "3. Navigate to the Invoice Reconciler tool"
Write-Host "4. Upload test files and run reconciliation"
Write-Host "5. Check that everything works as expected"

Write-Host ""
Write-Host "📋 When You're Done Testing" -ForegroundColor Yellow
Write-Host "=========================="
Write-Host "To stop the test deployment:"
Write-Host "  docker-compose down" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:"
Write-Host "  docker-compose logs -f" -ForegroundColor Cyan
Write-Host ""
Write-Host "To restart services:"
Write-Host "  docker-compose restart" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 Local deployment test setup complete!" -ForegroundColor Green
Write-Host "You can now test the production Docker setup locally" -ForegroundColor Blue

Write-Host ""
Write-Host "Press any key to view live logs, or Ctrl+C to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Showing live logs (Ctrl+C to exit):" -ForegroundColor Yellow
docker-compose logs -f 