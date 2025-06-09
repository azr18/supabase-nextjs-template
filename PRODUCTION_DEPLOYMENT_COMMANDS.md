# Production Deployment Commands - Quick Reference

## 🚀 Commands to Run on Hetzner Server

### Step 1: Configure Environment Variables
```bash
# Run the interactive setup script
./setup-production-env.sh

# OR manually copy and edit environment file
cp .env.production .env
nano .env
```

### Step 2: Deploy and Start Services
```bash
# Run the automated deployment script
./deploy-and-verify.sh

# OR run commands manually:
docker-compose build
docker-compose up -d
```

### Step 3: Verify Deployment
```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl http://localhost:5000/health     # Python service
curl http://localhost:3000            # Next.js app
curl http://localhost:80              # Nginx proxy

# Get server IP
curl ifconfig.me
```

## 🔧 Common Management Commands

### Service Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose build
docker-compose up -d --force-recreate
```

### Monitoring
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f nextjs-app
docker-compose logs -f python-service
docker-compose logs -f nginx

# Check container resource usage
docker stats

# Check container status
docker-compose ps
```

### Troubleshooting
```bash
# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5000

# Check firewall status
sudo ufw status

# Allow HTTP traffic through firewall
sudo ufw allow 80
sudo ufw allow 443

# Check disk space
df -h

# Check system resources
htop
free -h
```

## 🌐 Access URLs

### Local Testing (on server)
- Nginx Proxy: `http://localhost:80`
- Next.js App: `http://localhost:3000`
- Python Service: `http://localhost:5000`
- Python Health: `http://localhost:5000/health`

### External Access
- Application: `http://YOUR_SERVER_IP`
- Replace `YOUR_SERVER_IP` with the actual IP address

## 🔒 Security Commands

### Firewall Configuration
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important - do this first!)
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status verbose
```

### SSL Certificate Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### File Permissions
```bash
# Secure .env file
chmod 600 .env

# Make scripts executable
chmod +x setup-production-env.sh
chmod +x deploy-and-verify.sh
```

## 📊 Health Check Commands

### Quick Health Check
```bash
# Check all services are running
docker-compose ps

# Test Python service
curl -f http://localhost:5000/health

# Test Next.js app
curl -f http://localhost:3000

# Test external access
curl -f http://$(curl -s ifconfig.me)
```

### Detailed Health Check
```bash
# Run the verification script
./deploy-and-verify.sh

# Or check manually:
echo "=== Container Status ==="
docker-compose ps

echo "=== Service Health ==="
echo "Python Health: $(curl -s http://localhost:5000/health)"
echo "Next.js Status: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)"
echo "Nginx Status: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:80)"

echo "=== External Access ==="
SERVER_IP=$(curl -s ifconfig.me)
echo "Server IP: $SERVER_IP"
echo "External Status: $(curl -s -o /dev/null -w '%{http_code}' http://$SERVER_IP)"
```

## 🐛 Common Issues & Solutions

### Issue: Services not starting
```bash
# Check logs for errors
docker-compose logs

# Check if ports are already in use
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5000

# Stop conflicting services
sudo systemctl stop nginx    # If system nginx is running
sudo systemctl stop apache2  # If Apache is running
```

### Issue: External access not working
```bash
# Check firewall
sudo ufw status

# Open required ports
sudo ufw allow 80
sudo ufw allow 443

# Check if service is bound to correct interface
docker-compose logs nginx
```

### Issue: Environment variables not loaded
```bash
# Check .env file exists and has correct permissions
ls -la .env
cat .env

# Restart services after env changes
docker-compose down
docker-compose up -d
```

### Issue: Google OAuth not working
1. Check Google Cloud Console redirect URLs
2. Verify environment variables in `.env`
3. Ensure HTTPS is configured for production
4. Check Supabase Auth settings

## 📱 Testing the Application

### Basic Functionality Test
1. Open browser: `http://YOUR_SERVER_IP`
2. Try to sign up/login with Google
3. Upload a test PDF invoice
4. Upload a test Excel report
5. Run reconciliation process
6. Download results

### API Testing
```bash
# Test health endpoint
curl http://YOUR_SERVER_IP/api/health

# Test authentication (should redirect to login)
curl -I http://YOUR_SERVER_IP/app

# Test file upload endpoint (requires authentication)
# This will need a proper test with valid auth token
```

## 📝 Maintenance Schedule

### Daily
- Check service status: `docker-compose ps`
- Monitor disk space: `df -h`

### Weekly
- Check logs for errors: `docker-compose logs --since=7d | grep -i error`
- Update system packages: `sudo apt update && sudo apt upgrade`

### Monthly
- Renew SSL certificates: `sudo certbot renew`
- Review security logs
- Backup environment configuration

## 🆘 Emergency Commands

### Stop Everything
```bash
docker-compose down
sudo systemctl stop docker
```

### Restart Everything
```bash
sudo systemctl start docker
docker-compose up -d
```

### Reset to Clean State
```bash
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Backup Critical Files
```bash
# Backup environment config
cp .env .env.backup.$(date +%Y%m%d)

# Backup docker-compose config
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d)
``` 