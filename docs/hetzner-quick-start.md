# Hetzner Quick Start - Get Running in 5 Minutes! 🚀

**⚠️ IMPORTANT: This is for testing/development only. NOT production-ready!**
For production deployment, see [hetzner-deployment-guide.md](./hetzner-deployment-guide.md)

## What You'll Get
- Your Invoice Reconciler app running on Hetzner
- Accessible via server IP address (HTTP, no SSL)
- No security hardening (firewall, SSL, etc.)
- Perfect for testing and initial development

## Prerequisites
- Hetzner Cloud account
- Your Supabase credentials ready

---

## Step 1: Create Hetzner Server (2 minutes)

1. **Log into Hetzner Console:** https://console.hetzner.cloud/
2. **Create New Server:**
   - **Name:** `invoice-reconciler-test`
   - **Location:** Choose closest to you
   - **Image:** Ubuntu 24.04
   - **Type:** CPX21 (2 vCPU, 4GB RAM) - cheapest option that works
   - **SSH Key:** Add your public key (or create one)
3. **Click "Create Server"**
4. **Note the IP address** once it's created

## Step 2: Connect and Install Docker (1 minute)

```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Install Docker (one command does everything)
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Start Docker
systemctl start docker
```

## Step 3: Get Your App (30 seconds)

```bash
# Clone the repository
git clone https://github.com/azr18/supabase-nextjs-template.git app
cd app
```

## Step 4: Configure Environment (1 minute)

```bash
# Copy the environment template
cp .env.production .env

# Edit the environment file
nano .env
```

**Update these critical values in .env:**
```bash
# Your Supabase settings (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
PRIVATE_SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site URL - Use your server IP for testing
NEXT_PUBLIC_SITE_URL=http://YOUR_SERVER_IP

# Google OAuth (get from Google Cloud Console)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret

# N8N (can configure later)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/invoice-reconciler
N8N_WEBHOOK_SECRET=test_secret_123
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

## Step 5: Start Your App (1 minute)

```bash
# Build and start everything
docker-compose up -d

# Check if it's running
docker-compose ps
```

**That's it! 🎉**

---

## Access Your App

1. **Open your browser**
2. **Go to:** `http://YOUR_SERVER_IP`
3. **You should see your Invoice Reconciler!**

## Quick Tests

- **Health Check:** `http://YOUR_SERVER_IP/health`
- **API Status:** `http://YOUR_SERVER_IP/api/health`
- **Try logging in** with Google OAuth

---

## Troubleshooting

### App won't load?
```bash
# Check logs
docker-compose logs

# Restart everything
docker-compose restart
```

### Can't connect to server?
```bash
# Allow HTTP traffic (minimal security)
ufw allow 80
ufw allow 3000
ufw --force enable
```

### Wrong Supabase URL?
```bash
# Edit environment again
nano .env
# Update the URLs, then restart
docker-compose restart
```

---

## What's Missing (Why This Isn't Production-Ready)

❌ **No SSL certificates** - Using HTTP only  
❌ **No firewall security** - All ports open  
❌ **No monitoring** - Can't track issues  
❌ **No backups** - Data could be lost  
❌ **No domain name** - Using IP address  
❌ **No security hardening** - Vulnerable to attacks  

## Next Steps

### For Continued Testing:
- Set up N8N for webhook testing
- Test file uploads and processing
- Invite team members to test

### Ready for Production?
Follow the comprehensive [Production Deployment Guide](./hetzner-deployment-guide.md) which includes:
- SSL certificates and domain setup
- Security hardening and firewall
- Monitoring and alerting
- Backup strategies
- Performance optimization

---

## Cost Information

**CPX21 Server:** ~€4.51/month (~$5 USD)  
**Perfect for testing and small-scale usage**

For production with more users, consider upgrading to CPX31 (€13.52/month)

---

## Quick Commands Reference

```bash
# View app logs
docker-compose logs -f

# Restart app
docker-compose restart

# Stop app
docker-compose down

# Update app (when you push changes)
git pull
docker-compose build
docker-compose up -d

# Check server resources
htop              # CPU/RAM usage
df -h             # Disk space
docker stats      # Container resources
```

---

**🚀 Enjoy your quick Hetzner deployment!**

Need help? The app is running but having issues? Check the [troubleshooting section](./hetzner-deployment-guide.md#troubleshooting) in the full deployment guide. 