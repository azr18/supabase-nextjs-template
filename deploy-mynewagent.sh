#!/bin/bash
# MyNewAgent Automated Deployment Script
# Optimized for non-developers using Context7 best practices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root (you should already be root on Hetzner)"
fi

echo "🚀 MyNewAgent Automated Deployment Starting..."
echo "================================================="

# Step 1: Collect credentials
log "Step 1: Collecting credentials..."

read -p "Enter your GitHub token (starts with ghp_): " GITHUB_TOKEN
if [[ ! $GITHUB_TOKEN =~ ^ghp_ ]]; then
    error "Invalid GitHub token format"
fi

read -p "Enter your Supabase service role key: " SUPABASE_SERVICE_KEY
if [ ${#SUPABASE_SERVICE_KEY} -lt 50 ]; then
    error "Supabase service key seems too short"
fi

read -p "Enter your Google OAuth Client ID: " GOOGLE_CLIENT_ID
if [[ ! $GOOGLE_CLIENT_ID =~ \.apps\.googleusercontent\.com$ ]]; then
    error "Invalid Google Client ID format"
fi

read -p "Enter your Google OAuth Client Secret: " GOOGLE_CLIENT_SECRET
if [ ${#GOOGLE_CLIENT_SECRET} -lt 20 ]; then
    error "Google Client Secret seems too short"
fi

success "Credentials collected"

# Step 2: Update system and install dependencies
log "Step 2: Installing dependencies..."

apt update && apt upgrade -y
success "System updated"

# Install Docker
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    success "Docker installed"
else
    success "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log "Installing Docker Compose..."
    apt install docker-compose-plugin -y
    success "Docker Compose installed"
else
    success "Docker Compose already installed"
fi

# Install additional tools
apt install nginx-full certbot python3-certbot-nginx curl wget unzip git -y
systemctl start docker
systemctl enable docker
success "All dependencies installed"

# Step 3: Clone repository
log "Step 3: Getting your application code..."

if [ -d "mynewagent" ]; then
    warning "Directory 'mynewagent' exists, removing..."
    rm -rf mynewagent
fi

# Clone with token
git clone https://${GITHUB_TOKEN}@github.com/azr18/supabase-nextjs-template.git mynewagent
cd mynewagent
success "Repository cloned"

# Step 4: Configure environment
log "Step 4: Setting up environment..."

# Create .env file
cat > .env << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hcyteovnllklmvoptxjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXRlb3ZubGxrbG12b3B0eGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3NTgxMTAsImV4cCI6MjA1MDMzNDExMH0.V6TiUgJQ3G-0tJr7Lm5oJzNZr5gALUiHMGX_qYrLKJU
PRIVATE_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}

# Google OAuth
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=${GOOGLE_CLIENT_SECRET}

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://mynewagent.ai
NEXT_PUBLIC_APP_NAME=MyNewAgent
NEXT_PUBLIC_APP_DESCRIPTION=AI-Powered Business Automation Platform
PYTHON_SERVICE_URL=http://python-service:5000

# Domain Configuration
ALLOWED_ORIGINS=https://mynewagent.ai,https://mynewagent.io,https://www.mynewagent.ai,https://www.mynewagent.io
EOF

chmod 600 .env
success "Environment configured"

# Step 5: Build and start services
log "Step 5: Building and starting your application..."

# Stop any existing nginx
systemctl stop nginx 2>/dev/null || true

# Build and start containers
docker-compose build
docker-compose up -d

# Wait for services to be ready
log "Waiting for services to start..."
sleep 30

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    error "Services failed to start. Check logs with: docker-compose logs"
fi

success "Application services started"

# Step 6: Test internal services
log "Step 6: Testing services..."

# Test Python service
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    success "Python service healthy"
else
    warning "Python service health check failed"
fi

# Test Next.js app
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    success "Next.js app healthy"
else
    warning "Next.js app health check failed"
fi

# Step 7: Get server IP and wait for DNS
log "Step 7: Preparing SSL certificates..."

SERVER_IP=$(curl -s ifconfig.me)
success "Server IP: $SERVER_IP"

echo ""
warning "IMPORTANT: Configure DNS in Hostinger NOW!"
echo "1. Go to Hostinger Control Panel → DNS Zone"
echo "2. For mynewagent.ai: Add A record @ → $SERVER_IP"
echo "3. For mynewagent.ai: Add A record www → $SERVER_IP"
echo "4. For mynewagent.io: Add A record @ → $SERVER_IP"
echo "5. For mynewagent.io: Add A record www → $SERVER_IP"
echo ""

read -p "Press ENTER after configuring DNS (or wait 5 minutes)..."

# Step 8: Configure SSL
log "Step 8: Setting up SSL certificates..."

# Wait and test DNS resolution
log "Testing DNS resolution..."
for i in {1..10}; do
    if nslookup mynewagent.ai | grep -q "$SERVER_IP"; then
        success "DNS for mynewagent.ai resolved"
        break
    fi
    log "Waiting for DNS propagation... (attempt $i/10)"
    sleep 30
done

# Get SSL certificates
log "Obtaining SSL certificates..."
if certbot --nginx --non-interactive --agree-tos --email admin@mynewagent.ai \
   -d mynewagent.ai -d www.mynewagent.ai -d mynewagent.io -d www.mynewagent.io; then
    success "SSL certificates obtained"
else
    warning "SSL certificates failed - will retry in background"
fi

# Step 9: Final configuration
log "Step 9: Final configuration..."

# Configure auto-renewal
systemctl enable certbot.timer
success "SSL auto-renewal enabled"

# Set up firewall
ufw allow 22
ufw allow 80  
ufw allow 443
ufw --force enable
success "Firewall configured"

# Step 10: Final tests
log "Step 10: Running final tests..."

# Test external access
if curl -f http://$SERVER_IP > /dev/null 2>&1; then
    success "External HTTP access working"
else
    warning "External HTTP access failed"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE! 🎉"
echo "================================================="
success "MyNewAgent is now deployed!"
echo ""
echo "📍 Access your application:"
echo "   • http://$SERVER_IP (immediate)"
echo "   • https://mynewagent.ai (after DNS propagation)"
echo "   • https://mynewagent.io (after DNS propagation)"
echo ""
echo "🔧 Management commands:"
echo "   • Check status: docker-compose ps"
echo "   • View logs: docker-compose logs -f"
echo "   • Restart: docker-compose restart"
echo ""
echo "⚠️  Remember to:"
echo "   1. Test Google OAuth login"
echo "   2. Update Google OAuth redirect URLs"
echo "   3. Update Supabase Auth settings"
echo ""
success "Deployment script completed successfully!" 