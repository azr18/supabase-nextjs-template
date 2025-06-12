# Simplified Hetzner Deployment Guide 🚀

**Time Estimate: 2-3 hours for first-timers**

This simplified guide gets your MyNewAgent.ai SaaS platform running on Hetzner Cloud with minimal complexity.

## What You'll Need Before Starting

- ✅ Hetzner Cloud account (sign up at console.hetzner.cloud)
- ✅ Your domain `mynewagent.ai` ready
- ✅ Your Supabase project URL and keys
- ✅ About 2-3 hours of focused time

---

## Step 1: Create Your Server (15 minutes)

### 1.1 In Hetzner Console
1. **Go to:** https://console.hetzner.cloud/
2. **Click:** "Create Server"
3. **Choose:**
   - **Location:** Choose closest to you (Frankfurt, Helsinki, etc.)
   - **Image:** Ubuntu 24.04
   - **Type:** CPX31 (4 vCPU, 8GB RAM) - €15.84/month
   - **Name:** `mynewagent-prod`
4. **Add SSH Key:** Upload your public key (or create one)
5. **Click:** "Create & Buy Now"

**⏱️ Wait 2-3 minutes for server to start**

### 1.2 Connect to Your Server
```bash
# Replace with your actual server IP
ssh root@YOUR_SERVER_IP
```

---

## Step 2: Install Required Software (20 minutes)

Copy and paste these commands **one at a time**:

```bash
# Update system (takes 2-3 minutes)
apt update && apt upgrade -y

# Install basic tools (takes 3-5 minutes)
apt install -y curl wget git nginx ufw

# Setup firewall
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Install Docker (takes 2-3 minutes)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Test Docker works
docker --version
```

**✅ You should see Docker version printed**

---

## Step 3: Get Your Application (10 minutes)

```bash
# Download your app
git clone https://github.com/azr18/supabase-nextjs-template.git mynewagent
cd mynewagent

# Copy environment template
cp .env.production .env

# Edit your environment file
nano .env
```

### 3.1 Configure Environment Variables

**IMPORTANT:** Replace these with your actual values:

```bash
# Your Supabase Settings (REPLACE THESE!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
PRIVATE_SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# Your Domain (REPLACE THIS!)
NEXT_PUBLIC_SITE_URL=https://mynewagent.ai

# Google OAuth (REPLACE THESE!)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_secret

# App Settings
NEXT_PUBLIC_PRODUCTNAME=MyNewAgent
NODE_ENV=production
```

**To exit nano:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 4: Point Your Domain (5 minutes)

In your domain registrar (where you bought mynewagent.ai):

1. **Find:** DNS settings
2. **Add/Update A Records:**
   ```
   @ (root) → YOUR_SERVER_IP
   www → YOUR_SERVER_IP
   ```
3. **Save changes**

**⏱️ DNS changes can take 5-60 minutes to propagate**

---

## Step 5: Start Your Application (15 minutes)

```bash
# Build your application (takes 5-10 minutes)
docker-compose build

# Start everything
docker-compose up -d

# Check if it's running
docker-compose ps
```

**✅ You should see services showing "Up"**

---

## Step 6: Setup SSL Certificate (15 minutes)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
systemctl stop nginx

# Get SSL certificate (REPLACE with your domain!)
certbot certonly --standalone -d mynewagent.ai -d www.mynewagent.ai
```

### 6.1 Configure Nginx

```bash
# Create nginx config
nano /etc/nginx/sites-available/mynewagent
```

**Copy this exactly (replace `mynewagent.ai` with your domain):**

```nginx
server {
    listen 80;
    server_name mynewagent.ai www.mynewagent.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mynewagent.ai www.mynewagent.ai;

    ssl_certificate /etc/letsencrypt/live/mynewagent.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mynewagent.ai/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/mynewagent /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Start nginx
systemctl start nginx
systemctl enable nginx
```

---

## Step 7: Test Everything (10 minutes)

### 7.1 Check Your Website
1. **Open browser:** Go to `https://mynewagent.ai`
2. **You should see:** Your landing page with SSL (green lock)
3. **Test login:** Try registering/logging in

### 7.2 Check Services
```bash
# All should show "active (running)"
systemctl status nginx
systemctl status docker

# Should show services "Up"
docker-compose ps

# Check logs if needed
docker-compose logs
```

---

## 🎉 Congratulations! You're Live!

Your SaaS platform is now running at **https://mynewagent.ai**

## What You Have Now

- ✅ **Secure HTTPS website** with SSL certificate
- ✅ **Professional landing page** for marketing
- ✅ **User authentication** with Google OAuth
- ✅ **Customer dashboard** for tool access
- ✅ **Invoice Reconciler tool** ready for use
- ✅ **Automatic SSL renewal** (Certbot handles this)

---

## Basic Maintenance Commands

```bash
# View logs
docker-compose logs

# Restart services
docker-compose restart

# Update application (when you make changes)
git pull
docker-compose build
docker-compose up -d

# Check disk space
df -h

# Check memory usage
free -h
```

---

## Time Breakdown for First-Timers

| Step | Task | Time |
|------|------|------|
| 1 | Create Hetzner server | 15 min |
| 2 | Install software | 20 min |
| 3 | Download & configure app | 10 min |
| 4 | Setup domain DNS | 5 min |
| 5 | Build & start application | 15 min |
| 6 | Setup SSL & Nginx | 15 min |
| 7 | Testing & verification | 10 min |
| | **Waiting for DNS propagation** | 0-60 min |
| | **TOTAL ACTIVE TIME** | **90 minutes** |
| | **TOTAL WITH WAITING** | **2-3 hours** |

## Common Issues & Quick Fixes

**Can't connect to server:**
- Check your SSH key is correct
- Try `ssh -v root@YOUR_IP` for debug info

**Docker build fails:**
- Check your .env file has correct Supabase keys
- Try `docker-compose build --no-cache`

**Website shows "502 Bad Gateway":**
- Check: `docker-compose ps` (all should be "Up")
- Restart: `docker-compose restart`

**SSL certificate fails:**
- Make sure DNS is pointing to your server
- Check: `nslookup mynewagent.ai` should show your server IP

## Need Help?

**Check logs first:**
```bash
# Application logs
docker-compose logs

# Nginx logs  
tail -f /var/log/nginx/error.log

# System logs
journalctl -f
```

---

**🚀 Ready for Production!** Your MyNewAgent.ai SaaS platform is now live and ready for customers! 