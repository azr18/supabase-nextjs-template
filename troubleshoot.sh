#!/bin/bash

echo "🔍 Troubleshooting Server Status..."
echo "=================================="

echo "📍 Current directory:"
pwd

echo ""
echo "🐳 Docker containers status:"
docker ps -a

echo ""
echo "🌐 Network status - checking if ports are open:"
netstat -tlnp | grep :80
netstat -tlnp | grep :443

echo ""
echo "📋 Docker Compose services (if any):"
docker-compose -f docker-compose.production.yml ps 2>/dev/null || echo "No production compose services found"
docker-compose ps 2>/dev/null || echo "No default compose services found"

echo ""
echo "🔍 Checking for running processes on port 80 and 443:"
lsof -i :80 2>/dev/null || echo "No process on port 80"
lsof -i :443 2>/dev/null || echo "No process on port 443"

echo ""
echo "🏠 Testing local connections:"
curl -I http://localhost 2>/dev/null || echo "❌ HTTP localhost failed"
curl -I https://localhost -k 2>/dev/null || echo "❌ HTTPS localhost failed"

echo ""
echo "🌍 Testing external domain:"
curl -I http://mynewagent.ai 2>/dev/null || echo "❌ HTTP external failed"
curl -I https://mynewagent.ai -k 2>/dev/null || echo "❌ HTTPS external failed"

echo ""
echo "🔒 SSL Certificate status:"
if [ -f "/etc/letsencrypt/live/mynewagent.ai/fullchain.pem" ]; then
    echo "✅ SSL certificate exists"
    openssl x509 -in /etc/letsencrypt/live/mynewagent.ai/fullchain.pem -text -noout | grep "Not After" || echo "Could not read certificate expiry"
else
    echo "❌ SSL certificate not found"
fi

echo ""
echo "📁 Checking if nginx config exists:"
if [ -f "nginx-ssl.conf" ]; then
    echo "✅ nginx-ssl.conf exists"
else
    echo "❌ nginx-ssl.conf missing"
fi

echo ""
echo "🔧 Docker system info:"
docker system df

echo ""
echo "📊 System resources:"
free -h
df -h / 