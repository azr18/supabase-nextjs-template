#!/bin/bash

# Local Deployment Test Script
# This script tests the production deployment setup locally before deploying to Hetzner

set -e

echo "🧪 Testing Production Deployment Setup Locally"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running on Windows (for PowerShell compatibility)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "${YELLOW}⚠️  Running on Windows - some commands may differ from Linux production${NC}"
fi

# Check if Docker and Docker Compose are available
echo "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is required but not installed${NC}"; exit 1; }

# Check if Docker daemon is running
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Please start Docker Desktop"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Environment Setup for Local Testing${NC}"
echo "===================================="

# Create a local test environment file
echo "Creating local test environment file..."
if [ ! -f ".env.local.test" ]; then
    cat > .env.local.test << 'EOF'
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
EOF
    echo -e "${GREEN}✅ Created .env.local.test${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local.test already exists${NC}"
fi

# Copy the test env file to .env for Docker Compose
echo "Setting up environment for Docker Compose..."
cp .env.local.test .env
echo -e "${GREEN}✅ Environment file ready${NC}"

echo ""
echo -e "${YELLOW}🔧 Required Manual Configuration${NC}"
echo "==============================="
echo "Before continuing, you need to:"
echo "1. Get your Supabase Service Role Key:"
echo "   - Go to https://app.supabase.com/project/hcyteovnllklmvoptxjr/settings/api"
echo "   - Copy the 'service_role' key"
echo "   - Edit .env and replace REPLACE_WITH_YOUR_SERVICE_ROLE_KEY"
echo ""
echo "2. (Optional) For Google OAuth testing:"
echo "   - Get Google OAuth credentials from Google Cloud Console"
echo "   - Edit .env and replace the Google OAuth placeholders"
echo ""

read -p "Have you updated the .env file with at least the Supabase service role key? (y/N): " env_configured

if [[ ! $env_configured =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please update .env file first, then run this script again${NC}"
    echo "Edit the .env file and replace REPLACE_WITH_YOUR_SERVICE_ROLE_KEY with your actual key"
    exit 0
fi

echo ""
echo -e "${YELLOW}🐳 Building and Starting Services${NC}"
echo "=================================="

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose down >/dev/null 2>&1 || true

# Build the containers
echo "Building Docker images..."
if docker-compose build; then
    echo -e "${GREEN}✅ Images built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build images${NC}"
    exit 1
fi

# Start the services
echo ""
echo "Starting services..."
if docker-compose up -d; then
    echo -e "${GREEN}✅ Services started${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⏳ Waiting for Services to Initialize${NC}"
echo "====================================="

# Function to wait for a service
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=20
    local attempt=1
    
    echo "Waiting for $service_name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts..."
        sleep 3
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start${NC}"
    return 1
}

# Wait for services
wait_for_service "Python Service" "http://localhost:5000/health" || {
    echo "Python service logs:"
    docker-compose logs python-service
    exit 1
}

wait_for_service "Next.js Service" "http://localhost:3000" || {
    echo "Next.js service logs:"
    docker-compose logs nextjs-app
    exit 1
}

wait_for_service "Nginx Proxy" "http://localhost:80" || {
    echo "Nginx logs:"
    docker-compose logs nginx
    exit 1
}

echo ""
echo -e "${YELLOW}🔍 Testing Services${NC}"
echo "=================="

# Test Python service
echo "Testing Python service health..."
PYTHON_HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null || echo "failed")
if echo "$PYTHON_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Python service health check passed${NC}"
    echo "  Response: $PYTHON_HEALTH"
else
    echo -e "${RED}❌ Python service health check failed${NC}"
    echo "  Response: $PYTHON_HEALTH"
fi

# Test Next.js service
echo ""
echo "Testing Next.js service..."
NEXTJS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "failed")
if [ "$NEXTJS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Next.js service responding (HTTP $NEXTJS_STATUS)${NC}"
else
    echo -e "${RED}❌ Next.js service failed (HTTP $NEXTJS_STATUS)${NC}"
fi

# Test Nginx proxy
echo ""
echo "Testing Nginx proxy..."
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "failed")
if [ "$NGINX_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Nginx proxy working (HTTP $NGINX_STATUS)${NC}"
else
    echo -e "${RED}❌ Nginx proxy failed (HTTP $NGINX_STATUS)${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Container Status${NC}"
echo "=================="
docker-compose ps

echo ""
echo -e "${YELLOW}🌐 Access URLs${NC}"
echo "=============="
echo "Your local test deployment is running at:"
echo "  • Main application: http://localhost"
echo "  • Next.js direct:   http://localhost:3000"
echo "  • Python service:   http://localhost:5000"
echo "  • Health check:     http://localhost:5000/health"

echo ""
echo -e "${YELLOW}🧪 Manual Testing Steps${NC}"
echo "======================"
echo "1. Open http://localhost in your browser"
echo "2. Try to sign up/login (Google OAuth if configured)"
echo "3. Navigate to the Invoice Reconciler tool"
echo "4. Upload test files and run reconciliation"
echo "5. Check that everything works as expected"

echo ""
echo -e "${YELLOW}📋 When You're Done Testing${NC}"
echo "=========================="
echo "To stop the test deployment:"
echo "  docker-compose down"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To restart services:"
echo "  docker-compose restart"

echo ""
echo -e "${GREEN}🎉 Local deployment test setup complete!${NC}"
echo -e "${BLUE}You can now test the production Docker setup locally${NC}"

# Keep the script running so user can see the status
echo ""
echo -e "${YELLOW}Press Ctrl+C to exit this script (services will continue running)${NC}"
echo "Or press Enter to view live logs..."
read -t 10 -n 1 || true

if [ $? -eq 0 ]; then
    echo ""
    echo "Showing live logs (Ctrl+C to exit):"
    docker-compose logs -f
fi 