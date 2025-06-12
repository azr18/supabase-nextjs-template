# Hetzner Deployment Guide - N8N-Powered Invoice Reconciler

This guide will walk you through deploying the N8N-powered Invoice Reconciler SaaS platform to Hetzner Cloud.

## Prerequisites

- Hetzner Cloud account
- Domain name (recommended)
- SSL certificates (Let's Encrypt or custom)
- N8N instance (can be hosted separately or on the same server)

## Server Requirements

**Recommended Hetzner Configuration:**
- **Server Type:** CPX31 (4 vCPU, 8GB RAM, 160GB SSD)
- **Location:** Choose closest to your users (Helsinki, Frankfurt, etc.)
- **OS:** Ubuntu 24.04 LTS
- **Network:** Public IPv4 + IPv6

## Step 1: Server Setup

### 1.1 Create Hetzner Server

```bash
# Create server via Hetzner Console or CLI
# Name: invoice-reconciler-prod
# Type: CPX31
# Image: Ubuntu 24.04
# SSH Key: Add your public key
```

### 1.2 Initial Server Configuration

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl wget git nginx certbot python3-certbot-nginx fail2ban ufw

# Setup firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5678/tcp  # For N8N (if hosted on same server)
ufw --force enable

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# Install Docker Compose
apt install -y docker-compose-plugin

# Create deployment user
useradd -m -s /bin/bash -G docker deploy
usermod -aG sudo deploy
```

## Step 2: Application Deployment

### 2.1 Clone Repository

```bash
# Switch to deploy user
su - deploy

# Clone repository
git clone https://github.com/azr18/supabase-nextjs-template.git invoice-reconciler
cd invoice-reconciler
```

### 2.2 Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
PRIVATE_SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site URL (CRITICAL for OAuth)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Google OAuth
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret

# N8N Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com:5678/webhook/invoice-reconciler
N8N_WEBHOOK_SECRET=your_secure_webhook_secret

# Application Configuration
NEXT_PUBLIC_PRODUCTNAME=Invoice Reconciler
NEXT_PUBLIC_SSO_PROVIDERS=google
NODE_ENV=production
```

### 2.3 Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start services in background
docker-compose up -d

# Check status
docker-compose ps
```

## Step 3: SSL and Domain Configuration

### 3.1 Configure DNS

Point your domain to the server IP:
```
A record: @ -> YOUR_SERVER_IP
A record: www -> YOUR_SERVER_IP
```

### 3.2 Setup SSL with Let's Encrypt

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Update nginx configuration
sudo nano /etc/nginx/sites-available/invoice-reconciler
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Proxy to Docker application
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/invoice-reconciler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 4: N8N Setup (Optional - Same Server)

If you want to run N8N on the same server:

### 4.1 N8N Docker Setup

```bash
# Create N8N directory
mkdir -p ~/n8n-data

# Run N8N container
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your_secure_password \
  -e WEBHOOK_URL=https://your-domain.com:5678 \
  -v ~/n8n-data:/home/node/.n8n \
  --restart unless-stopped \
  n8nio/n8n
```

### 4.2 N8N SSL Configuration

Add N8N to nginx configuration:

```nginx
# Add to your nginx server block
location /n8n/ {
    proxy_pass http://localhost:5678/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Step 5: Production Monitoring

### 5.1 Setup Log Rotation

```bash
# Configure Docker log rotation
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 5.2 Monitoring Scripts

```bash
# Create monitoring script
nano ~/monitor-services.sh
```

```bash
#!/bin/bash
cd /home/deploy/invoice-reconciler

# Check Docker services
if ! docker-compose ps | grep -q "Up"; then
    echo "Services down, restarting..."
    docker-compose restart
    # Send alert (email, Slack, etc.)
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage high: ${DISK_USAGE}%"
    # Send alert
fi
```

```bash
# Make executable and add to cron
chmod +x ~/monitor-services.sh
crontab -e
# Add: */5 * * * * /home/deploy/monitor-services.sh
```

## Step 6: Security Hardening

### 6.1 Fail2Ban Configuration

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-botsearch]
enabled = true
```

### 6.2 Automatic Updates

```bash
# Install unattended upgrades
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Step 7: Backup Strategy

### 7.1 Application Backup

```bash
# Create backup script
nano ~/backup-app.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz invoice-reconciler/

# Backup Docker volumes
docker run --rm -v invoice-reconciler_nextjs_uploads:/data -v $BACKUP_DIR:/backup ubuntu tar czf /backup/uploads_$DATE.tar.gz -C /data .

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 7.2 Database Backup (Supabase handles this, but for reference)

Since you're using Supabase, database backups are handled by Supabase. However, you can export your schema and data periodically:

```bash
# Export schema (run locally, not on server)
npx supabase db dump --schema-only > schema_backup.sql

# Export data
npx supabase db dump --data-only > data_backup.sql
```

## Step 8: Performance Optimization

### 8.1 Nginx Optimization

Add to nginx configuration:

```nginx
# Add to http block
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 8.2 Docker Resource Limits

Update docker-compose.yml:

```yaml
services:
  nextjs-app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2'
        reservations:
          memory: 512M
          cpus: '1'
```

## Step 9: Testing Production Deployment

### 9.1 Verify Services

```bash
# Check all services
docker-compose ps

# Test endpoints
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/health

# Check logs
docker-compose logs -f
```

### 9.2 Test Invoice Reconciler

1. Open https://your-domain.com
2. Register/login with Google OAuth
3. Navigate to Invoice Reconciler tool
4. Test file upload functionality
5. Verify N8N webhook integration

## Step 10: Ongoing Maintenance

### 10.1 Regular Tasks

- Monitor disk space and logs
- Update Docker images monthly
- Renew SSL certificates (automatic with certbot)
- Review security logs
- Test backup/restore procedures

### 10.2 Scaling Considerations

For high traffic:
- Use Hetzner Load Balancer
- Consider multiple server instances
- Implement Redis for session storage
- Use CDN for static assets

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

**N8N webhook failures:**
```bash
# Check N8N logs
docker logs n8n

# Verify webhook URL in .env
grep N8N_WEBHOOK_URL .env
```

**High memory usage:**
```bash
# Check Docker stats
docker stats

# Restart services
docker-compose restart
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] Fail2Ban installed and configured
- [ ] SSL certificates installed
- [ ] Security headers configured in Nginx
- [ ] Docker daemon secured
- [ ] Regular backups scheduled
- [ ] Monitoring scripts in place
- [ ] System updates automated
- [ ] SSH key authentication only
- [ ] Non-root user for deployment

## Support

For issues specific to:
- **Hetzner Cloud:** [Hetzner Support](https://docs.hetzner.com/)
- **Docker:** [Docker Documentation](https://docs.docker.com/)
- **N8N:** [N8N Documentation](https://docs.n8n.io/)
- **Supabase:** [Supabase Documentation](https://supabase.com/docs)

---

**Next Steps:** After successful deployment, consider setting up monitoring with Grafana/Prometheus for production-grade observability. 