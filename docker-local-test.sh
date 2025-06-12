#!/bin/bash

# Local Docker Test Script for N8N-Powered Invoice Reconciler
# This script tests the Next.js app locally using Docker

set -e

echo "🧪 Testing N8N-Powered Invoice Reconciler Locally with Docker"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
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

# Verify environment variables
echo ""
echo -e "${YELLOW}📋 Environment Configuration${NC}"
echo "============================="
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
    
    # Check critical variables
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env && grep -q "PRIVATE_SUPABASE_SERVICE_KEY" .env; then
        echo -e "${GREEN}✅ Critical Supabase variables configured${NC}"
    else
        echo -e "${RED}❌ Missing critical Supabase configuration${NC}"
        echo "Please ensure .env contains valid Supabase URL and service key"
        exit 1
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create .env file with Supabase configuration"
    exit 1
fi

# Stop any existing containers
echo ""
echo -e "${YELLOW}🐳 Docker Operations${NC}"
echo "==================="
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

# Test Next.js service
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

# Test health endpoint
echo ""
echo "Testing health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health 2>/dev/null || echo "failed")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health check working (HTTP $HEALTH_STATUS)${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $HEALTH_STATUS)${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Container Status${NC}"
echo "=================="
docker-compose ps

echo ""
echo -e "${YELLOW}🌐 Access URLs${NC}"
echo "=============="
echo "Your local test deployment is running at:"
echo -e "  • ${BLUE}Main application: http://localhost${NC}"
echo -e "  • ${BLUE}Next.js direct:   http://localhost:3000${NC}"
echo -e "  • ${BLUE}Health check:     http://localhost/health${NC}"

echo ""
echo -e "${YELLOW}🧪 Manual Testing Steps${NC}"
echo "======================"
echo "1. Open http://localhost in your browser"
echo "2. Try to sign up/login (Google OAuth if configured)"
echo "3. Navigate to the Invoice Reconciler tool"
echo "4. Test the N8N webhook integration (you'll need N8N running separately)"
echo "5. Check that file uploads work correctly"

echo ""
echo -e "${YELLOW}📋 N8N Integration Notes${NC}"
echo "========================"
echo "• This setup only runs the web application"
echo "• N8N should be running separately on port 5678 for webhook integration"
echo "• Update N8N_WEBHOOK_URL in .env to match your N8N instance"
echo "• For production, N8N typically runs on a separate server"

echo ""
echo -e "${YELLOW}📋 When You're Done Testing${NC}"
echo "=========================="
echo "To stop the test deployment:"
echo -e "  ${BLUE}docker-compose down${NC}"
echo ""
echo "To view logs:"
echo -e "  ${BLUE}docker-compose logs -f${NC}"
echo ""
echo "To restart services:"
echo -e "  ${BLUE}docker-compose restart${NC}"

echo ""
echo -e "${GREEN}🎉 Local Docker deployment test complete!${NC}"
echo -e "${BLUE}You can now test the N8N-powered Invoice Reconciler locally${NC}"

echo ""
echo "Press Ctrl+C to exit this script (services will continue running)"
echo "Or press Enter to view live logs..."
read -t 10 -n 1 || true

if [ $? -eq 0 ]; then
    echo ""
    echo "Showing live logs (Ctrl+C to exit):"
    docker-compose logs -f
fi 