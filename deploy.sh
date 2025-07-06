#!/bin/bash

# Manual Deployment Script for Production
# Run this script on your server to deploy the application

set -e

echo "🚀 Starting manual deployment..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

# Navigate to project directory
cd /root/supabase-nextjs-template

# Update code from Git
echo "📥 Pulling latest code..."
git pull origin main

# Create environment file with production values
echo "🔧 Creating production environment..."
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://mynewagent.ai
NEXT_PUBLIC_SUPABASE_URL=https://hcyteovnllklmvoptxjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeXRlb3ZubGxrbG12b3B0eGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MDI5MTcsImV4cCI6MjA2NDA3ODkxN30.QEoxsRXBGSiZYFk7Y8f7fOinpL4ExkdbEGYtY_CQj0A

# TODO: Replace these with your actual Google OAuth credentials
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret

DOMAIN=mynewagent.ai
EOF

# Create SSL nginx configuration
echo "🔒 Creating SSL configuration..."
cat > nginx-ssl.conf << 'NGINX_EOF'
events { 
  worker_connections 1024; 
}
http {
  upstream app {
    server nextjs:3000;
  }
  
  # HTTP redirect to HTTPS
  server {
    listen 80;
    server_name mynewagent.ai www.mynewagent.ai;
    return 301 https://$server_name$request_uri;
  }
  
  # HTTPS server
  server {
    listen 443 ssl;
    server_name mynewagent.ai www.mynewagent.ai;
    
    ssl_certificate /etc/letsencrypt/live/mynewagent.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mynewagent.ai/privkey.pem;
    
    location / {
      proxy_pass http://app;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
NGINX_EOF

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true
docker-compose down 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.production.yml --env-file .env.production up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps

# Test endpoints
echo "🔍 Testing endpoints..."
echo "Testing HTTP (should redirect to HTTPS):"
curl -I http://mynewagent.ai || echo "HTTP test failed"

echo "Testing HTTPS:"
curl -I https://mynewagent.ai || echo "HTTPS test failed"

echo "✅ Deployment completed!"
echo ""
echo "🎉 Your application should now be available at:"
echo "   - https://mynewagent.ai"
echo "   - https://www.mynewagent.ai"
echo ""
echo "📝 Next steps:"
echo "1. Update Google OAuth credentials in .env.production"
echo "2. Test OAuth login functionality"
echo "3. Monitor logs with: docker-compose -f docker-compose.production.yml logs -f" 