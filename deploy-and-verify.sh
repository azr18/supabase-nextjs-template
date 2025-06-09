#!/bin/bash

# Deployment and Verification Script for Hetzner Server
# This script starts the services and verifies external access

set -e

echo "🚀 Starting Invoice Reconciler Services on Production Server"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   exit 1
fi

# Check if Docker and Docker Compose are available
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is required but not installed${NC}"; exit 1; }

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found. Please run setup-production-env.sh first${NC}"
    exit 1
fi

# Get server IP address
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
echo -e "${BLUE}🌐 Server IP: $SERVER_IP${NC}"

echo ""
echo -e "${YELLOW}📋 Pre-deployment Checks${NC}"
echo "=========================="

# Check environment variables
check_env_var() {
    local var_name=$1
    local value=$(grep "^$var_name=" .env | cut -d'=' -f2-)
    
    if [[ $value == REPLACE_WITH_* ]] || [ -z "$value" ]; then
        echo -e "${RED}❌ $var_name is not configured${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $var_name is configured${NC}"
        return 0
    fi
}

echo "Checking required environment variables..."
ENV_OK=true
check_env_var "PRIVATE_SUPABASE_SERVICE_KEY" || ENV_OK=false
check_env_var "SUPABASE_SERVICE_ROLE_KEY" || ENV_OK=false
check_env_var "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID" || ENV_OK=false
check_env_var "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET" || ENV_OK=false

if [ "$ENV_OK" = false ]; then
    echo -e "${RED}❌ Environment variables not properly configured${NC}"
    echo "Please run: ./setup-production-env.sh"
    exit 1
fi

# Check Docker daemon
echo ""
echo "Checking Docker daemon..."
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker daemon is running${NC}"
else
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Please start Docker daemon"
    exit 1
fi

# Check for existing containers
echo ""
echo "Checking for existing containers..."
if docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Services are already running${NC}"
    read -p "Do you want to restart them? (y/N): " restart_choice
    if [[ $restart_choice =~ ^[Yy]$ ]]; then
        echo "Stopping existing services..."
        docker-compose down
    else
        echo "Skipping service restart..."
    fi
fi

echo ""
echo -e "${YELLOW}🐳 Building and Starting Services${NC}"
echo "=================================="

# Build images
echo "Building Docker images..."
if docker-compose build; then
    echo -e "${GREEN}✅ Docker images built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Docker images${NC}"
    exit 1
fi

# Start services in detached mode
echo ""
echo "Starting services in background..."
if docker-compose up -d; then
    echo -e "${GREEN}✅ Services started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

# Wait for services to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for Services to Initialize${NC}"
echo "====================================="

# Function to wait for a service to be healthy
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Wait for Python service
wait_for_service "Python Service" "http://localhost:5000/health" || {
    echo "Checking Python service logs..."
    docker-compose logs python-service
    exit 1
}

# Wait for Next.js service
wait_for_service "Next.js Service" "http://localhost:3000" || {
    echo "Checking Next.js service logs..."
    docker-compose logs nextjs-app
    exit 1
}

# Wait for Nginx
wait_for_service "Nginx Proxy" "http://localhost:80" || {
    echo "Checking Nginx logs..."
    docker-compose logs nginx
    exit 1
}

echo ""
echo -e "${YELLOW}🔍 Service Verification${NC}"
echo "======================"

# Check service status
echo "Checking container status..."
docker-compose ps

echo ""
echo "Testing internal service endpoints..."

# Test Python service health
echo "Testing Python service health endpoint..."
PYTHON_HEALTH=$(curl -s http://localhost:5000/health)
if echo "$PYTHON_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Python service health check passed${NC}"
else
    echo -e "${RED}❌ Python service health check failed${NC}"
    echo "Response: $PYTHON_HEALTH"
fi

# Test Next.js service
echo ""
echo "Testing Next.js service..."
NEXTJS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$NEXTJS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Next.js service is responding${NC}"
else
    echo -e "${RED}❌ Next.js service returned HTTP $NEXTJS_RESPONSE${NC}"
fi

# Test Nginx proxy
echo ""
echo "Testing Nginx proxy..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$NGINX_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Nginx proxy is working${NC}"
else
    echo -e "${RED}❌ Nginx proxy returned HTTP $NGINX_RESPONSE${NC}"
fi

echo ""
echo -e "${YELLOW}🌐 External Access Verification${NC}"
echo "==============================="

# Test external access
echo "Testing external access via public IP..."
EXTERNAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP" || echo "failed")
if [ "$EXTERNAL_RESPONSE" = "200" ]; then
    echo -e "${GREEN}🎉 External access is working!${NC}"
    echo -e "${GREEN}Your application is accessible at: http://$SERVER_IP${NC}"
else
    echo -e "${YELLOW}⚠️  External access test returned: $EXTERNAL_RESPONSE${NC}"
    echo "This might be due to firewall settings or the service still starting up"
fi

echo ""
echo -e "${YELLOW}🔥 Firewall Check${NC}"
echo "================"

# Check UFW status
if command -v ufw >/dev/null 2>&1; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1 | awk '{print $2}' || echo "unknown")
    echo "UFW status: $UFW_STATUS"
    
    if [ "$UFW_STATUS" = "active" ]; then
        echo "Checking if HTTP port 80 is allowed..."
        if sudo ufw status | grep -q "80.*ALLOW"; then
            echo -e "${GREEN}✅ Port 80 is allowed in UFW${NC}"
        else
            echo -e "${YELLOW}⚠️  Port 80 is not explicitly allowed in UFW${NC}"
            echo "You may need to run: sudo ufw allow 80"
        fi
    fi
else
    echo "UFW is not installed"
fi

echo ""
echo -e "${YELLOW}📊 Service Status Summary${NC}"
echo "========================="

# Final status check
docker-compose ps

echo ""
echo -e "${YELLOW}📝 Next Steps${NC}"
echo "============="

echo "1. 🌐 Access your application:"
echo "   - Local: http://localhost"
echo "   - External: http://$SERVER_IP"
echo ""
echo "2. 🔧 Monitor services:"
echo "   - View logs: docker-compose logs -f"
echo "   - Check status: docker-compose ps"
echo "   - Restart services: docker-compose restart"
echo ""
echo "3. 🔒 Security recommendations:"
echo "   - Set up SSL certificates for HTTPS"
echo "   - Configure firewall rules (UFW)"
echo "   - Update DNS records to point to $SERVER_IP"
echo ""
echo "4. 🧪 Test functionality:"
echo "   - Upload a PDF invoice and Excel report"
echo "   - Test Google OAuth sign-in"
echo "   - Verify reconciliation processing"

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}Application is running at: http://$SERVER_IP${NC}"

# Save deployment info
echo "SERVER_IP=$SERVER_IP" > deployment-info.txt
echo "DEPLOYMENT_DATE=$(date)" >> deployment-info.txt
echo -e "${GREEN}Deployment info saved to deployment-info.txt${NC}" 